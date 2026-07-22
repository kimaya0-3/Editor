import type { NodeProps, Node } from '@xyflow/react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'
import type { ZoneNodeData } from '../../utils/transformers'

type ZoneNodeType = Node<ZoneNodeData, 'zoneNode'>

const zoneInterfaceTypeColor: Record<string, string> = {
  Network:   '#3b82f6',
  Proximity: '#8b5cf6',
  Host:      '#10b981',
}

export const ZoneNode = ({ data }: NodeProps<ZoneNodeType>) => {
  const theme          = useProjectStore((s) => s.theme)
  const selectedZoneId = useProjectStore((s) => s.selectedZoneId)
  const editorMode     = useProjectStore((s) => s.editorMode)

  const isDark     = theme === 'dark'
  const isSelected = selectedZoneId === data.zone_id
  const showConnectionCues = editorMode === 'addEdge'

  return (
    <>
      <NodeResizer
        isVisible={isSelected}
        minWidth={300}
        minHeight={200}
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
          width:        '100%',
          height:       '100%',
          padding:      '16px',
          borderRadius: '12px',
          background:   isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)',
          border: `2px solid ${
            isSelected ? '#3b82f6' : isDark ? '#1e293b' : '#e2e8f0'
          }`,
          boxShadow: isSelected
            ? '0 0 0 4px rgba(59,130,246,0.2)'
            : isDark
              ? '0 4px 24px rgba(0,0,0,0.4)'
              : '0 4px 24px rgba(0,0,0,0.08)',
          cursor:     'pointer',
          transition: 'border 0.15s, box-shadow 0.15s',
          fontFamily: 'sans-serif',
          boxSizing:  'border-box',
          overflow:   'hidden',
          position:   'relative',
        }}
      >
        {/* Zone Type Badge */}
        <div style={{
          display:       'inline-block',
          fontSize:      '11px',
          fontWeight:    600,
          padding:       '2px 8px',
          borderRadius:  '999px',
          marginBottom:  '10px',
          background:    isDark ? '#1e3a5f' : '#dbeafe',
          color:         isDark ? '#60a5fa' : '#1d4ed8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {data.zone_type ?? 'Zone'}
        </div>

        {/* Zone Name */}
        <div style={{
          fontSize:     '15px',
          fontWeight:   700,
          color:        isDark ? '#f1f5f9' : '#0f172a',
          marginBottom: '8px',
        }}>
          {data.label}
        </div>

        {/* Zone ID */}
        <div style={{
          fontSize:     '11px',
          color:        isDark ? '#475569' : '#94a3b8',
          fontFamily:   'monospace',
          marginBottom: '10px',
        }}>
          {data.zone_id}
        </div>

        {/* Footer Stats */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {data.interface_count > 0 && (
            <span style={{
              fontSize:     '11px',
              padding:      '2px 8px',
              borderRadius: '999px',
              background:   isDark ? '#1e293b' : '#f1f5f9',
              color:        isDark ? '#94a3b8' : '#64748b',
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '6px',
            }}>
              <span>
                {data.interface_count} interface{data.interface_count !== 1 ? 's' : ''}
              </span>
              <span style={{ display: 'inline-flex', gap: '4px' }}>
                {data.interface_types.map((type) => (
                  <span
                    key={type}
                    title={type}
                    style={{
                      width:        '7px',
                      height:       '7px',
                      borderRadius: '50%',
                      background:   zoneInterfaceTypeColor[type] ?? '#94a3b8',
                    }}
                  />
                ))}
              </span>
            </span>
          )}
          {data.exposure_count > 0 && (
            <span style={{
              fontSize:     '11px',
              padding:      '2px 8px',
              borderRadius: '999px',
              background:   isDark ? '#450a0a' : '#fee2e2',
              color:        isDark ? '#f87171' : '#dc2626',
            }}>
              ⚠ {data.exposure_count} exposure{data.exposure_count !== 1 ? 's' : ''}
            </span>
          )}
          {data.child_count > 0 && (
            <span style={{
              fontSize:     '11px',
              padding:      '2px 8px',
              borderRadius: '999px',
              background:   isDark ? '#1e293b' : '#f1f5f9',
              color:        isDark ? '#94a3b8' : '#64748b',
            }}>
              ⬡ {data.child_count} sub-zone{data.child_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
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