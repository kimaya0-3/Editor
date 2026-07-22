// src/hooks/useAddCommunication.ts

import { useCallback } from 'react'
import {
  useProjectStore,
  makeCommId,
  makeZoneInterfaceId,
} from '../store/projectStore'
import type { Connection } from '@xyflow/react'
import type {
  TraxInterSWCommunication,
  TraxZoneCommunication,
  TraxZoneInterface,
  TraxSecurityZone,
} from '../types/index'

export const useAddCommunication = () => {
  const project                  = useProjectStore((s) => s.project)
  const addCommunication         = useProjectStore((s) => s.addCommunication)
  const addZoneCommunication     = useProjectStore((s) => s.addZoneCommunication)
  const addZoneInterface         = useProjectStore((s) => s.addZoneInterface)
  const updateCommunication      = useProjectStore((s) => s.updateCommunication)
  const selectCommunication      = useProjectStore((s) => s.selectCommunication)

  const selectCommunicationAfterCommit = useCallback((commId: string) => {
    window.setTimeout(() => {
      selectCommunication(commId)
    }, 0)
  }, [selectCommunication])

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

        // Use first existing interface. If none exists, do not auto-create one.
        const existingIface = targetComp.LogicalInterfaces?.[0]
        if (!existingIface) return
        const ifaceId = existingIface.interface_id

        const commId = makeCommId()
        const comm: TraxInterSWCommunication = {
          communication_id:         commId,
          name:                     'New Communication',
          description:              '',
          specificExposureRating_C: 'NoRating',
          viaUntrustedZones:        false,
          TargetInterface:          { interface_id: ifaceId },
          SourceComponent:          { subUnit_id: sourceId },
          // New component communications start without a source interface selected.
          SourceInterface:          undefined,
        }

        addCommunication(sourceId, comm, {
          entityType:   'communication',
          sourceType:   'component',
          targetType:   'component',
          labelOffsetX: 0,
          labelOffsetY: 0,
          animated:     false,
          color:        '#3b82f6',
        })

        // Guard against any downstream/default behavior that may inject a source interface.
        window.setTimeout(() => {
          updateCommunication(commId, { SourceInterface: undefined })
        }, 0)

        // Select it so the editor opens immediately in the side panel
        selectCommunicationAfterCommit(commId)
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
        selectCommunicationAfterCommit(commId)
        return
      }
    },
    [
      project,
      addCommunication,
      addZoneCommunication,
      ensureZoneInterface,
      updateCommunication,
      selectCommunicationAfterCommit,
    ],
  )

  return { handleAddEdge, isComponentToComponent }
}