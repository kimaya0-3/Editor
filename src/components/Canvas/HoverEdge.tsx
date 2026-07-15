import { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getStraightPath,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'

// ─── Path selector ────────────────────────────────────────────────────────────

type PathArgs = {
  sourceX:        number
  sourceY:        number
  sourcePosition: EdgeProps['sourcePosition']
  targetX:        number
  targetY:        number
  targetPosition: EdgeProps['targetPosition']
}

// All three path functions return [path, labelX, labelY, offsetX, offsetY]
type PathResult = [
  path:    string,
  labelX:  number,
  labelY:  number,
  offsetX: number,
  offsetY: number,
]

const getPath = (type: string | undefined, args: PathArgs): PathResult => {
  switch (type) {
    case 'straight':
      return getStraightPath(args) as PathResult

    case 'step':
      return getSmoothStepPath({ ...args, borderRadius: 0 }) as PathResult

    case 'smoothstep':
      return getSmoothStepPath({ ...args, borderRadius: 8 }) as PathResult

    case 'default':
    case 'animated':
    default:
      return getBezierPath(args) as PathResult
  }
}

// ─── HoverEdge ────────────────────────────────────────────────────────────────

export const HoverEdge = ({
  id,
  type,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  data,
}: EdgeProps) => {
  const [hovered, setHovered] = useState(false)
  const theme  = useProjectStore((s) => s.theme)
  const isDark = theme === 'dark'

  const parallelOffset = typeof data?.parallelOffset === 'number'
    ? data.parallelOffset
    : 0

  const parallelTotal = typeof data?.parallelTotal === 'number'
    ? data.parallelTotal
    : 1

  const parallelPixels = parallelTotal > 1 ? parallelOffset * 10 : 0

  const getOffsetPathArgs = (): PathArgs => {
    if (parallelPixels === 0) {
      return {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      }
    }

    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len

    return {
      sourceX: sourceX + nx * parallelPixels,
      sourceY: sourceY + ny * parallelPixels,
      sourcePosition,
      targetX: targetX + nx * parallelPixels,
      targetY: targetY + ny * parallelPixels,
      targetPosition,
    }
  }

  // Destructure all 5 elements — labelX/labelY are what we need for positioning
  const [edgePath, labelX, labelY] = getPath(type, getOffsetPathArgs())

  return (
    <>
      {/* 1. Visible edge line */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          opacity:     hovered ? 1 : (style?.opacity as number ?? 0.55),
          strokeWidth: hovered ? 2 : (style?.strokeWidth as number ?? 1),
          transition:  'opacity 0.15s, stroke-width 0.15s',
        }}
        markerEnd={markerEnd}
      />

      {/* 2. Wide invisible hover target — after BaseEdge in SVG paint order */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      {/* 3. Hover label — rendered in HTML overlay, guaranteed above SVG */}
      {hovered && label && (
        <EdgeLabelRenderer>
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              position:      'absolute',
              transform:     `translate(-50%, -100%) translate(${labelX}px, ${labelY - 6}px)`,
              pointerEvents: 'all',
              zIndex:        9999,
              fontSize:      '11px',
              fontWeight:    500,
              padding:       '3px 8px',
              borderRadius:  '6px',
              background:    isDark ? '#1e293b' : '#ffffff',
              color:         isDark ? '#f1f5f9' : '#0f172a',
              border:        `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              boxShadow:     '0 2px 8px rgba(0,0,0,0.15)',
              whiteSpace:    'nowrap',
            }}
            className="nodrag nopan"
          >
            {label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}