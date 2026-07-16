// src/components/Canvas/Canvas.tsx

import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from '@xyflow/react'
import type {
  NodeTypes,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { ZoneNode }              from './ZoneNode'
import { ComponentNode }         from './ComponentNode'
import { HoverEdge }             from './HoverEdge'
import { useProjectStore }       from '../../store/projectStore'
import { useAddZone }            from '../../hooks/useAddZone'
import { useAddComponent }       from '../../hooks/useAddComponent'
import { useAddCommunication }   from '../../hooks/useAddCommunication'
import {
  buildNodes,
  communicationsToEdges,
} from '../../utils/transformers'

// ─── Node / Edge Types ────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  zoneNode:      ZoneNode,
  componentNode: ComponentNode,
}

const edgeTypes = {
  default:    HoverEdge,
  smoothstep: HoverEdge,
  straight:   HoverEdge,
  step:       HoverEdge,
  animated:   HoverEdge,
}

// ─── CanvasInner ──────────────────────────────────────────────────────────────

const CanvasInner = () => {
  const project                 = useProjectStore((s) => s.project)
  const theme                   = useProjectStore((s) => s.theme)
  const diagramLayout           = useProjectStore((s) => s.diagramLayout)
  const layoutStamp             = useProjectStore((s) => s.layoutStamp)
  const updateNodePosition      = useProjectStore((s) => s.updateNodePosition)
  const batchUpsertNodes        = useProjectStore((s) => s.batchUpsertNodes)
  const selectZone              = useProjectStore((s) => s.selectZone)
  const selectComponent         = useProjectStore((s) => s.selectComponent)
  const selectCommunication     = useProjectStore((s) => s.selectCommunication)
  const clearSelection          = useProjectStore((s) => s.clearSelection)
  const selectedZoneId          = useProjectStore((s) => s.selectedZoneId)
  const selectedComponentId     = useProjectStore((s) => s.selectedComponentId)
  const selectedCommunicationId = useProjectStore((s) => s.selectedCommunicationId)
  const editorMode              = useProjectStore((s) => s.editorMode)
  const setEditorMode           = useProjectStore((s) => s.setEditorMode)
  const deleteCommunication     = useProjectStore((s) => s.deleteCommunication)
  const deleteZoneCommunication = useProjectStore((s) => s.deleteZoneCommunication)
  const isDark                  = theme === 'dark'

  const settings = diagramLayout.settings

  const { screenToFlowPosition, fitView } = useReactFlow()

  const handleAddZone        = useAddZone()
  const handleAddComponent   = useAddComponent()
  const { handleAddEdge }    = useAddCommunication()

  // ── Container ready gate ──────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setReady(true)
        observer.disconnect()
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Derived nodes & edges ─────────────────────────────────────────────────
  const derivedNodes = useMemo((): Node[] => {
    if (!project) return []
    return buildNodes(
      project.SecurityZones ?? [],
      project.SWComponents  ?? [],
      diagramLayout.nodes,
      settings,
    )
  }, [project, diagramLayout.nodes, settings])

  const derivedEdges = useMemo((): Edge[] => {
    if (!project) return []
    return communicationsToEdges(
      project.SecurityZones ?? [],
      project.SWComponents  ?? [],
      settings.edgeStyle,
    )
  }, [project, settings])

  // ── Local RF state ────────────────────────────────────────────────────────
  const [nodes, setNodes] = useState<Node[]>(derivedNodes)
  const [edges, setEdges] = useState<Edge[]>(derivedEdges)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const nodesRef                    = useRef<Node[]>(nodes)
  const stampRebuildJustHappenedRef = useRef(false)

  useEffect(() => { nodesRef.current = nodes }, [nodes])

  // ── Full rebuild on layout stamp change ───────────────────────────────────
  useEffect(() => {
    stampRebuildJustHappenedRef.current = true

    const {
      project:       freshProject,
      diagramLayout: freshLayout,
    } = useProjectStore.getState()

    if (!freshProject) return

    const freshNodes = buildNodes(
      freshProject.SecurityZones ?? [],
      freshProject.SWComponents  ?? [],
      freshLayout.nodes,
      freshLayout.settings,
    )

    const freshEdges = communicationsToEdges(
      freshProject.SecurityZones ?? [],
      freshProject.SWComponents  ?? [],
      freshLayout.settings.edgeStyle,
    )

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes(freshNodes)
    setEdges(freshEdges)

    const storedIds = new Set(freshLayout.nodes.map((n) => n.id))
    const missing   = freshNodes.filter((n) => !storedIds.has(n.id))

    if (missing.length > 0) {
      batchUpsertNodes(
        missing.map((n) => ({
          id:            n.id,
          entityType:    (n.type === 'zoneNode' ? 'zone' : 'component') as 'zone' | 'component',
          x:             n.position.x,
          y:             n.position.y,
          width:         n.type === 'zoneNode' ? 300 : 220,
          height:        n.type === 'zoneNode' ? 200 : 40,
          color:         '#94a3b8',
          labelPosition: 'top' as const,
          parentId:      n.parentId,
          userMoved:     false,
        }))
      )
    }

    setTimeout(() => fitView({ padding: 0.2 }), 50)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutStamp])

  // ── Sync edges ────────────────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEdges(derivedEdges)
  }, [derivedEdges])

  // ── Sync nodes from store changes ─────────────────────────────────────────
  useEffect(() => {
    if (stampRebuildJustHappenedRef.current) {
      stampRebuildJustHappenedRef.current = false
      return
    }

    setNodes((rfNodes) => {
      const rfMap      = new Map(rfNodes.map((n) => [n.id, n]))
      const derivedMap = new Map(derivedNodes.map((n) => [n.id, n]))
      const result: Node[] = []

      for (const rfNode of rfNodes) {
        const fresh = derivedMap.get(rfNode.id)
        if (!fresh) continue
        result.push(
          fresh.data !== rfNode.data
            ? { ...rfNode, data: fresh.data }
            : rfNode
        )
      }

      for (const derived of derivedNodes) {
        if (!rfMap.has(derived.id)) result.push(derived)
      }

      return result
    })
  }, [derivedNodes])

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editorMode !== 'idle') {
        setEditorMode('idle')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editorMode, setEditorMode])

  // ── Clamp drag to parent bounds ───────────────────────────────────────────
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!node.parentId) return
      const parent = nodes.find((n) => n.id === node.parentId)
      if (!parent?.style) return

      const parentW = Number(parent.style.width  ?? 300)
      const parentH = Number(parent.style.height ?? 200)
      const nodeW   = 220
      const nodeH   = 40

      const clampedX = Math.min(Math.max(0, node.position.x), parentW - nodeW)
      const clampedY = Math.min(Math.max(0, node.position.y), parentH - nodeH)

      updateNodePosition(node.id, clampedX, clampedY, node.parentId)
    },
    [nodes, updateNodePosition],
  )

  // ── Node changes ──────────────────────────────────────────────────────────
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
      setTimeout(() => {
        changes.forEach((change) => {
          if (
            change.type     === 'position' &&
            change.position !== undefined  &&
            change.dragging === false
          ) {
            const node = nodesRef.current.find((n) => n.id === change.id)
            updateNodePosition(
              change.id,
              change.position.x,
              change.position.y,
              node?.parentId,
            )
          }
        })
      }, 0)
    },
    [updateNodePosition],
  )

  // ── Edge changes — intercept removes so they delete from store too ─────────
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteCommunication(change.id)
          deleteZoneCommunication(change.id)
        }
      })
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [deleteCommunication, deleteZoneCommunication],
  )

  // ── Edge click ────────────────────────────────────────────────────────────
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      selectCommunication(
        edge.id === selectedCommunicationId ? null : edge.id
      )
    },
    [selectCommunication, selectedCommunicationId],
  )

  // ── Node click ────────────────────────────────────────────────────────────
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (editorMode === 'addEdge') return

      if (editorMode === 'addComponent' && node.type === 'zoneNode') {
        const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        handleAddComponent(node, flowPos)
        return
      }

      if (node.type === 'zoneNode') {
        selectZone(node.id === selectedZoneId ? null : node.id)
      } else if (node.type === 'componentNode') {
        selectComponent(node.id === selectedComponentId ? null : node.id)
      }
    },
    [
      editorMode, handleAddComponent, screenToFlowPosition,
      selectZone, selectComponent, selectedZoneId, selectedComponentId,
    ],
  )

  // ── Pane click ────────────────────────────────────────────────────────────
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (editorMode === 'addZone') {
        handleAddZone(event.clientX, event.clientY)
        return
      }
      clearSelection()
    },
    [editorMode, handleAddZone, clearSelection],
  )

  // ── onConnect — create immediately, no modal ──────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      handleAddEdge(connection)
      if (editorMode === 'addEdge') {
        setEditorMode('idle')
      }
    },
    [editorMode, handleAddEdge, setEditorMode],
  )

  // ── Cursor ────────────────────────────────────────────────────────────────
  const cursorStyle =
    editorMode === 'addZone'      ? 'crosshair' :
    editorMode === 'addComponent' ? 'cell'      :
    'default'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        width:      '100%',
        height:     '100%',
        background: isDark ? '#030712' : '#f8fafc',
        cursor:     cursorStyle,
        position:   'relative',
      }}
    >
      {ready && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodeOrigin={[0, 0]}
          nodesDraggable={true}
          nodeDragThreshold={1}
          nodesConnectable={true}
          elementsSelectable={true}
          colorMode={isDark ? 'dark' : 'light'}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color={isDark ? '#374151' : '#cbd5e1'}
          />
          <Controls />
          <MiniMap
            nodeColor={(node) =>
              node.type === 'componentNode'
                ? (isDark ? '#1e3a2f' : '#dcfce7')
                : (isDark ? '#1e3a5f' : '#bfdbfe')
            }
            maskColor={isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
            style={{
              background: isDark ? '#111827' : '#f1f5f9',
              border:     `1px solid ${isDark ? '#374151' : '#cbd5e1'}`,
            }}
          />
        </ReactFlow>
      )}
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export { CanvasInner as Canvas }