import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  useProjectStore,
  makeZoneId,
} from '../store/projectStore'
import type { TraxSecurityZone } from '../types/index'

export const useAddZone = () => {
  const addZone      = useProjectStore((s) => s.addZone)
  const setEditorMode = useProjectStore((s) => s.setEditorMode)
  const { screenToFlowPosition } = useReactFlow()

  return useCallback(
    (screenX: number, screenY: number) => {
      // Convert screen click → canvas coordinates
      const pos    = screenToFlowPosition({ x: screenX, y: screenY })
      const zoneId = makeZoneId()

      const zone: TraxSecurityZone = {
        zone_id:           zoneId,
        name:              'New Zone',
        description:       '',
        external:          false,
        isNetworkZone:     false,
        isProximityZone:   false,
        isHostZone:        false,
        isStructuringBox:  true,
        isVisible:         true,
        isTopSecurityZone: false,
        ZoneExposures:     [],
        TypeOf: {
          name: 'General Host Zone',
          type: 'Host',
        },
      }

      addZone(zone, {
        x:             pos.x - 160,   
        y:             pos.y - 60,
        width:         320,
        height:        120,
        color:         '#1e3a5f',
        labelPosition: 'top',
      })

  
    },
    [addZone, setEditorMode, screenToFlowPosition],
  )
}