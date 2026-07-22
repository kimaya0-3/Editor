import type { NodeProps, Node } from '@xyflow/react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'
import type { ComponentNodeData } from '../../utils/transformers'
import { interfaceTypeColor } from '../../utils/transformers'

// ─── ComponentNode ────────────────────────────────────────────────────────────
// Canvas card for a SW component.
// ─────────────────────────────────────────────────────────────────────────────

type ComponentNodeType = Node<ComponentNodeData, 'componentNode'>

export const ComponentNode = ({ data, selected }: NodeProps<ComponentNodeType>) => {
  const theme      = useProjectStore((s) => s.theme)
  const selectedId = useProjectStore((s) => s.selectedComponentId)
  const editorMode = useProjectStore((s) => s.editorMode)
  const isDark     = theme === 'dark'
  const showConnectionCues = editorMode === 'addEdge'

  const isInScope  = data.scope === 'In_Scope'
  const isSelected = selectedId === data.subUnit_id

  const scopeBg   = isInScope
    ? (isDark ? '#166534' : '#dcfce7')
    : (isDark ? '#1e293b' : '#f1f5f9')
  const scopeText = isInScope
    ? (isDark ? '#4ade80' : '#16a34a')
    : (isDark ? '#64748b' : '#94a3b8')

  const uniqueSurfaceTypes = Array.from(
    new Set(data.interfaces.map((i) => i.surfaceType).filter(Boolean))
  )

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={80}
        lineStyle={{ borderColor: '#3b82f6' }}
        handleStyle={{ borderColor: '#3b82f6', background: '#1d4ed8' }}
      />

      <ConnectionCue
        show={showConnectionCues}
        type="target"
        position={Position.Top}
        side="top"
      />
      <ConnectionCue
        show={showConnectionCues}
        type="source"
        position={Position.Bottom}
        side="bottom"
      />
      <ConnectionCue
        show={showConnectionCues}
        type="target"
        position={Position.Left}
        side="left"
      />
      <ConnectionCue
        show={showConnectionCues}
        type="source"
        position={Position.Right}
        side="right"
      />

      <div
        style={{
          width:         '100%',
          height:        '100%',
          padding:       '12px',
          borderRadius:  '10px',
          background:    isDark ? '#0f172a' : '#ffffff',
          border:        isSelected
            ? '1.5px solid #3b82f6'
            : `1.5px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          boxShadow: isSelected
            ? '0 0 0 3px rgba(59,130,246,0.2)'
            : isDark
              ? '0 2px 12px rgba(0,0,0,0.4)'
              : '0 2px 12px rgba(0,0,0,0.06)',
          fontFamily:    'sans-serif',
          boxSizing:     'border-box',
          overflow:      'hidden',
          cursor:        'pointer',
          transition:    'border 0.15s, box-shadow 0.15s',
          display:       'flex',
          flexDirection: 'column',
          position:      'relative',
        }}
      >
        {/* ── Scope badge ─────────────────────────────────────────────────── */}
        <div style={{
          display:       'inline-block',
          alignSelf:     'flex-start',
          fontSize:      '10px',
          fontWeight:    600,
          padding:       '1px 7px',
          borderRadius:  '999px',
          marginBottom:  '8px',
          background:    scopeBg,
          color:         scopeText,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}>
          {isInScope ? 'In Scope' : 'Out of Scope'}
        </div>

        {/* ── Component name ──────────────────────────────────────────────── */}
        <div style={{
          fontSize:     '13px',
          fontWeight:   700,
          color:        isDark ? '#f1f5f9' : '#0f172a',
          marginBottom: '4px',
          lineHeight:   1.3,
        }}>
          {data.label}
        </div>

        {/* ── Component ID · Zone ID ──────────────────────────────────────── */}
        <div style={{
          fontSize:     '10px',
          color:        isDark ? '#475569' : '#94a3b8',
          fontFamily:   'monospace',
          marginBottom: '8px',
        }}>
          {data.subUnit_id} · {data.zone_id}
        </div>

        {/* ── Interface summary footer ─────────────────────────────────────── */}
        {data.interface_count > 0 && (
          <div style={{
            marginTop:  'auto',
            borderTop:  `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
            paddingTop: '8px',
            display:    'flex',
            alignItems: 'center',
            gap:        '5px',
          }}>
            {/* Colored dot per unique surface type */}
            {uniqueSurfaceTypes.map((surfaceType) => (
              <div
                key={surfaceType}
                title={surfaceType}
                style={{
                  width:        '7px',
                  height:       '7px',
                  borderRadius: '50%',
                  flexShrink:   0,
                  background:   interfaceTypeColor[surfaceType] ?? '#94a3b8',
                }}
              />
            ))}

            {/* Interface count */}
            <span style={{
              fontSize:   '10px',
              color:      isDark ? '#475569' : '#94a3b8',
              marginLeft: '3px',
            }}>
              {data.interface_count} interface{data.interface_count !== 1 ? 's' : ''}
            </span>

            {/* Click hint */}
            <span style={{
              fontSize:   '10px',
              color:      isDark ? '#334155' : '#cbd5e1',
              marginLeft: 'auto',
            }}>
              click →
            </span>
          </div>
        )}
      </div>
    </>
  )
}

const ConnectionCue = ({
  show,
  type,
  position,
  side,
}: {
  show: boolean
  type: 'source' | 'target'
  position: Position
  side: 'top' | 'bottom' | 'left' | 'right'
}) => {
  if (!show) {
    return <Handle type={type} position={position} style={{ opacity: 0 }} />
  }

  const commonBadgeStyle: React.CSSProperties = {
    position:        'absolute',
    width:           '4px',
    height:          '4px',
    borderRadius:    '999px',
    background:      'rgba(37,99,235,0.9)',
    color:           '#ffffff',
    fontSize:        '4px',
    fontWeight:      700,
    lineHeight:      '4px',
    textAlign:       'center',
    boxShadow:       '0 1px 2px rgba(37,99,235,0.12)',
    pointerEvents:   'none',
    zIndex:          3,
  }

  const badgePosition: React.CSSProperties =
    side === 'top'
      ? { top: '-9px', left: '50%', transform: 'translateX(-50%)' }
      : side === 'bottom'
        ? { bottom: '-9px', left: '50%', transform: 'translateX(-50%)' }
        : side === 'left'
          ? { left: '-9px', top: '50%', transform: 'translateY(-50%)' }
          : { right: '-9px', top: '50%', transform: 'translateY(-50%)' }

  const handleStyle: React.CSSProperties = {
    width:        side === 'left' || side === 'right' ? '16px' : '100%',
    height:       side === 'top' || side === 'bottom' ? '16px' : '100%',
    borderRadius: '999px',
    background:   'rgba(37,99,235,0.02)',
    border:       '1px solid rgba(37,99,235,0.06)',
    boxShadow:    '0 0 0 1px rgba(37,99,235,0.02)',
    opacity:      1,
    zIndex:       4,
  }

  const stripStyle: React.CSSProperties =
    side === 'top'
      ? { top: '-6px', left: 0, transform: 'none' }
      : side === 'bottom'
        ? { bottom: '-6px', left: 0, transform: 'none' }
        : side === 'left'
          ? { left: '-6px', top: 0, transform: 'none' }
          : { right: '-6px', top: 0, transform: 'none' }

  return (
    <>
      <Handle type={type} position={position} style={{ ...handleStyle, ...stripStyle }} />
      <div style={{ ...commonBadgeStyle, ...badgePosition }}>+</div>
    </>
  )
}