// src/hooks/useAddCommunication.ts

import { useCallback } from 'react'
import {
  useProjectStore,
  makeCommId,
  makeZoneInterfaceId,
  makeInterfaceId,
} from '../store/projectStore'
import type { Connection } from '@xyflow/react'
import type {
  TraxInterSWCommunication,
  TraxLogicalInterface,
  TraxZoneCommunication,
  TraxZoneInterface,
  TraxSecurityZone,
} from '../types/index'

export const useAddCommunication = () => {
  const project                  = useProjectStore((s) => s.project)
  const addCommunicationWithStub = useProjectStore((s) => s.addCommunicationWithStub)
  const addZoneCommunication     = useProjectStore((s) => s.addZoneCommunication)
  const addZoneInterface         = useProjectStore((s) => s.addZoneInterface)
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

  const inferZoneInterfaceType = useCallback((zone: TraxSecurityZone | undefined) => {
    switch (zone?.TypeOf?.type) {
      case 'Proximity': return 'Proximity'
      case 'Host':      return 'Host'
      default:          return 'Network'
    }
  }, [])

  const ensureZoneInterface = useCallback(
    (zoneId: string): TraxZoneInterface => {
      const current = useProjectStore.getState().project
      const zone = current?.SecurityZones.find((z) => z.zone_id === zoneId)
      const existing = zone?.ZoneInterfaces?.[0]
      if (existing) return existing

      const iface: TraxZoneInterface = {
        interface_id:              makeZoneInterfaceId(),
        name:                      'New Zone Interface',
        description:               '',
        abstractInterfaceType:     inferZoneInterfaceType(zone),
        specificExposureRating_I:  'NoRating',
        isManagementInterface:     false,
        ConnectedToSecurityZone:    { zone_id: zoneId },
      }

      addZoneInterface(zoneId, iface)

      const refreshed = useProjectStore.getState().project?.SecurityZones.find(
        (z) => z.zone_id === zoneId
      )
      return refreshed?.ZoneInterfaces?.find((i) => i.interface_id === iface.interface_id) ?? iface
    },
    [addZoneInterface, inferZoneInterfaceType],
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
        const sourceZoneId = sourceIsZone
          ? sourceId
          : project.SWComponents.find((c) => c.subUnit_id === sourceId)?.SecurityZone.zone_id ?? sourceId
        const targetZoneId = targetIsZone
          ? targetId
          : project.SWComponents.find((c) => c.subUnit_id === targetId)?.SecurityZone.zone_id ?? targetId

        const sourceZone = project.SecurityZones.find((z) => z.zone_id === sourceZoneId)
        const targetZone = project.SecurityZones.find((z) => z.zone_id === targetZoneId)

        const sourceInterface = sourceZone ? ensureZoneInterface(sourceZone.zone_id) : null
        const targetInterface = targetZone ? ensureZoneInterface(targetZone.zone_id) : null

        // Owner zone is whichever side is a zone (prefer source)
        const ownerZoneId = sourceIsZone ? sourceZoneId : targetZoneId

        const commId = makeCommId()
        const comm: TraxZoneCommunication = {
          communication_id:         commId,
          name:                     'New Communication',
          description:              '',
          specificExposureRating_C: 'NoRating',
          viaUntrustedZones:        false,
          TargetZone:               { zone_id: targetZoneId },
          SourceZone:               { zone_id: sourceZoneId },
          ...(sourceInterface ? { SourceInterface: { interface_id: sourceInterface.interface_id } } : {}),
          ...(targetInterface ? { TargetInterface: { interface_id: targetInterface.interface_id } } : {}),
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
    [
      project,
      addCommunicationWithStub,
      addZoneCommunication,
      selectCommunication,
      ensureZoneInterface,
    ],
  )

  return { handleAddEdge, isComponentToComponent }
}