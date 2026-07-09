import type { NodeProps, Node } from '@xyflow/react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'
import type { ZoneNodeData } from '../../utils/transformers'

type ZoneNodeType = Node<ZoneNodeData, 'zoneNode'>

export const ZoneNode = ({ data, selected }: NodeProps<ZoneNodeType>) => {
  const theme          = useProjectStore((s) => s.theme)
  const selectedZoneId = useProjectStore((s) => s.selectedZoneId)

  const isDark     = theme === 'dark'
  const isSelected = selectedZoneId === data.zone_id

  return (
    <>
      <NodeResizer
        isVisible={isSelected}
        minWidth={300}
        minHeight={200}
        lineStyle={{ borderColor: '#3b82f6' }}
        handleStyle={{ borderColor: '#3b82f6', background: '#1d4ed8' }}
      />

      {/* 4 handles — all invisible, ReactFlow picks shortest path */}
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />

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
          cursor:     'grab',
          transition: 'border 0.15s, box-shadow 0.15s',
          fontFamily: 'sans-serif',
          boxSizing:  'border-box',
          overflow:   'hidden',
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