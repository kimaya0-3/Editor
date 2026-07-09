// src/hooks/useAddCommunication.ts

import { useCallback } from 'react'
import {
  useProjectStore,
  makeCommId,
  makeInterfaceId,
} from '../store/projectStore'
import type { Connection } from '@xyflow/react'
import type {
  TraxInterSWCommunication,
  TraxLogicalInterface,
  TraxZoneCommunication,
} from '../types/index'

export const useAddCommunication = () => {
  const project                  = useProjectStore((s) => s.project)
  const addCommunicationWithStub = useProjectStore((s) => s.addCommunicationWithStub)
  const addZoneCommunication     = useProjectStore((s) => s.addZoneCommunication)
  const selectCommunication      = useProjectStore((s) => s.selectCommunication)

  // ── Helper: is this connection component-to-component? ───────────────────
  const isComponentToComponent = useCallback(
    (connection: Connection): boolean => {
      if (!project) return false
      const srcIsComp = project.SWComponents.some((c) => c.subUnit_id === connection.source)
      const tgtIsComp = project.SWComponents.some((c) => c.subUnit_id === connection.target)
      return srcIsComp && tgtIsComp
    },
    [project],
  )

  // ── Main handler — called directly from onConnect ─────────────────────────
  const handleAddEdge = useCallback(
    (connection: Connection) => {
      if (!project) return

      const sourceId = connection.source
      const targetId = connection.target
      if (!sourceId || !targetId) return

      const sourceIsComp = project.SWComponents.some((c) => c.subUnit_id === sourceId)
      const targetIsComp = project.SWComponents.some((c) => c.subUnit_id === targetId)
      const sourceIsZone = project.SecurityZones.some((z) => z.zone_id === sourceId)
      const targetIsZone = project.SecurityZones.some((z) => z.zone_id === targetId)

      // ── Component → Component ─────────────────────────────────────────────
      if (sourceIsComp && targetIsComp) {
        const targetComp = project.SWComponents.find((c) => c.subUnit_id === targetId)!

        // Use first existing interface, or create a stub if none exist
        const existingIface = targetComp.LogicalInterfaces?.[0]
        const ifaceId       = existingIface?.interface_id ?? makeInterfaceId(targetId)
        const createStub    = !existingIface

        const stub: TraxLogicalInterface | null = createStub
          ? {
              interface_id:              ifaceId,
              name:                      'New Interface',
              softwareAttackSurfaceType: 'Network_Interface_API',
              abstractInterfaceType:     'Network',
              specificExposureRating_I:  'NoRating',
              CALCzoneDerivedExposure_I: 'NoRating',
              isManagementInterface:     false,
              fromUntrustedZones:        false,
            }
          : null

        const commId = makeCommId()
        const comm: TraxInterSWCommunication = {
          communication_id:         commId,
          name:                     'New Communication',
          description:              '',
          specificExposureRating_C: 'NoRating',
          viaUntrustedZones:        false,
          TargetInterface:          { interface_id: ifaceId },
          SourceComponent:          { subUnit_id: sourceId },
        }

        addCommunicationWithStub(sourceId, targetId, comm, stub, {
          entityType:   'communication',
          sourceType:   'component',
          targetType:   'component',
          labelOffsetX: 0,
          labelOffsetY: 0,
          animated:     false,
          color:        '#3b82f6',
        })

        // Select it so the editor opens immediately in the side panel
        selectCommunication(commId)
        return
      }

      // ── Zone → Zone or Zone ↔ Component ───────────────────────────────────
      if (
        (sourceIsZone || sourceIsComp) &&
        (targetIsZone || targetIsComp)
      ) {
        // Owner zone is whichever side is a zone (prefer source)
        const ownerZoneId = sourceIsZone ? sourceId : targetId

        const commId = makeCommId()
        const comm: TraxZoneCommunication = {
          communication_id:         commId,
          name:                     'New Communication',
          description:              '',
          specificExposureRating_C: 'NoRating',
          viaUntrustedZones:        false,
          TargetZone:               { zone_id: targetId },
          SourceZone:               { zone_id: sourceId },
        }

        addZoneCommunication(ownerZoneId, comm, {
          entityType:   'zoneCommunication',
          sourceType:   sourceIsZone ? 'zone' : 'component',
          targetType:   targetIsZone ? 'zone' : 'component',
          labelOffsetX: 0,
          labelOffsetY: 0,
          animated:     false,
          color:        '#a78bfa',
        })

        // Select it so the editor opens immediately in the side panel
        selectCommunication(commId)
        return
      }
    },
    [project, addCommunicationWithStub, addZoneCommunication, selectCommunication],
  )

  return { handleAddEdge, isComponentToComponent }
}