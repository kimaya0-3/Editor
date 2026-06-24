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
  const isDark     = theme === 'dark'

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

      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />

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