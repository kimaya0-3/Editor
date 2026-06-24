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
  const setEditorMode            = useProjectStore((s) => s.setEditorMode)

  return useCallback(
    (connection: Connection) => {
      if (!project) return

      const sourceId = connection.source
      const targetId = connection.target
      if (!sourceId || !targetId || sourceId === targetId) return

      const sourceIsZone = project.SecurityZones.some((z) => z.zone_id === sourceId)
      const targetIsZone = project.SecurityZones.some((z) => z.zone_id === targetId)
      const sourceIsComp = project.SWComponents.some((c) => c.subUnit_id === sourceId)
      const targetIsComp = project.SWComponents.some((c) => c.subUnit_id === targetId)

      // ── Zone → Zone ──────────────────────────────────────────────────────
      if (sourceIsZone && targetIsZone) {
        const comm: TraxZoneCommunication = {
          communication_id:         makeCommId(),
          name:                     'New Communication',
          description:              '',
          specificExposureRating_C: 'NoRating',
          viaUntrustedZones:        false,
          TargetZone:               { zone_id: targetId },
          SourceZone:               { zone_id: sourceId },
        }
        addZoneCommunication(sourceId, comm, {
          entityType:   'zoneCommunication',
          sourceType:   'zone',
          targetType:   'zone',
          labelOffsetX: 0,
          labelOffsetY: 0,
          animated:     false,
          color:        '#a78bfa',
        })
        setEditorMode('idle')
        return
      }

      // ── Zone → Component or Component → Zone ─────────────────────────────
      if ((sourceIsZone && targetIsComp) || (sourceIsComp && targetIsZone)) {
        const ownerZoneId = sourceIsZone ? sourceId : targetId
        const comm: TraxZoneCommunication = {
          communication_id:         makeCommId(),
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
        setEditorMode('idle')
        return
      }

      // ── Component → Component ────────────────────────────────────────────
      if (sourceIsComp && targetIsComp) {
        const targetComp = project.SWComponents.find((c) => c.subUnit_id === targetId)
        if (!targetComp) return

        // Reuse existing first interface, or generate a guaranteed-unique stub ID
        const existingIfaceId = targetComp.LogicalInterfaces?.[0]?.interface_id
        const stubIfaceId     = existingIfaceId ?? makeInterfaceId(targetId)

        // Only create a stub if the target has no interfaces at all
        const stub: TraxLogicalInterface | null = existingIfaceId ? null : {
          interface_id:              stubIfaceId,
          name:                      'Interface',
          softwareAttackSurfaceType: 'Network_Interface_API',
          abstractInterfaceType:     'Network',
          specificExposureRating_I:  'NoRating',
          CALCzoneDerivedExposure_I: 'NoRating',
          isManagementInterface:     false,
          fromUntrustedZones:        false,
        }

        // IDs are generated here synchronously from current store state,
        // then passed into one atomic set — no race condition possible
        const comm: TraxInterSWCommunication = {
          communication_id:         makeCommId(),
          name:                     'New Communication',
          description:              '',
          specificExposureRating_C: 'NoRating',
          viaUntrustedZones:        false,
          TargetInterface:          { interface_id: stubIfaceId },
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

        setEditorMode('idle')
      }
    },
    [project, addCommunicationWithStub, addZoneCommunication, setEditorMode],
  )
}