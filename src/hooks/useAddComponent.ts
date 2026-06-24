import { useCallback } from 'react'
import {
  useProjectStore,
  makeComponentId,
  makeInterfaceId,
} from '../store/projectStore'
import type { TraxSWComponent } from '../types/index'
import type { Node } from '@xyflow/react'

export const useAddComponent = () => {
  const addComponent  = useProjectStore((s) => s.addComponent)
  const setEditorMode = useProjectStore((s) => s.setEditorMode)

  // clickedNode  = the zoneNode the user clicked on
  // clickPos     = flow-space position of the click (relative to canvas)
  // zoneFlowPos  = the zone node's own position in flow-space
  return useCallback(
    (clickedNode: Node, clickPos: { x: number; y: number }) => {
      if (clickedNode.type !== 'zoneNode') return

      const zoneId  = clickedNode.id
      const compId  = makeComponentId()
      const ifaceId = makeInterfaceId(compId)

      // Component position is RELATIVE to the parent zone node
      const relX = clickPos.x - (clickedNode.position?.x ?? 0)
      const relY = clickPos.y - (clickedNode.position?.y ?? 0)

      const component: TraxSWComponent = {
        subUnit_id:   compId,
        name:         'New Component',
        description:  '',
        scope:        'In_Scope',
        SecurityZone: { zone_id: zoneId },
        LogicalInterfaces:     [],
        InterSWCommunications: [],
      }

      addComponent(component, {
        x:             Math.max(8, relX - 60),   // keep inside zone bounds
        y:             Math.max(32, relY - 20),
        width:         120,
        height:        40,
        color:         '#166534',
        labelPosition: 'center',
        parentId:      zoneId,
      })

      // Stay in addComponent mode — user may want to add more
    },
    [addComponent, setEditorMode],
  )
}