import { useCallback } from 'react'
import {
  useProjectStore,
  makeComponentId,
} from '../store/projectStore'
import type { TraxSWComponent } from '../types/index'
import type { Node } from '@xyflow/react'

export const useAddComponent = () => {
  const addComponent  = useProjectStore((s) => s.addComponent)
  const selectComponent = useProjectStore((s) => s.selectComponent)
  const MIN_COMPONENT_Y_IN_ZONE = 96

  // clickedNode  = the zoneNode the user clicked on
  // clickPos     = flow-space position of the click (relative to canvas)
  // zoneFlowPos  = the zone node's own position in flow-space
  return useCallback(
    (clickedNode: Node, clickPos: { x: number; y: number }) => {
      if (clickedNode.type !== 'zoneNode') return

      const zoneId  = clickedNode.id
      const compId  = makeComponentId()

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
        y:             Math.max(MIN_COMPONENT_Y_IN_ZONE, relY - 20),
        width:         120,
        height:        40,
        color:         '#166534',
        labelPosition: 'center',
        parentId:      zoneId,
      })

      // Select the newly created component after state commit.
      window.setTimeout(() => {
        selectComponent(compId)
      }, 0)

      // Stay in addComponent mode — user may want to add more
    },
    [addComponent, selectComponent],
  )
}