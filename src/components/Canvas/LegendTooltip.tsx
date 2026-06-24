import { useState } from 'react'
import { interfaceTypeColor, surfaceTypeLabel } from '../../utils/transformers'

// ─── LegendTooltip ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface LegendTooltipProps {
  isDark: boolean
}

export const LegendTooltip = ({ isDark }: LegendTooltipProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{
      position: 'fixed',
      bottom:   '80px',
      right:    '16px',
      zIndex:   1000,
    }}>

      {/* ── Tooltip card ──────────────────────────────────────────────────── */}
      {visible && (
        <div style={{
          position:     'absolute',
          bottom:       '40px',
          right:        0,
          width:        '270px',
          background:   isDark ? '#0f172a' : '#ffffff',
          border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          borderRadius: '10px',
          padding:      '14px 16px',
          boxShadow:    isDark
            ? '0 8px 32px rgba(0,0,0,0.6)'
            : '0 8px 32px rgba(0,0,0,0.12)',
        }}>

          {/* Title */}
          <div style={{
            fontSize:      '11px',
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color:         isDark ? '#475569' : '#94a3b8',
            marginBottom:  '10px',
          }}>
            Interface Type Legend
          </div>

          {/* Entries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {Object.entries(surfaceTypeLabel).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width:        '9px',
                  height:       '9px',
                  borderRadius: '50%',
                  flexShrink:   0,
                  background:   interfaceTypeColor[key] ?? '#94a3b8',
                }} />
                <span style={{
                  fontSize:   '12px',
                  color:      isDark ? '#94a3b8' : '#475569',
                  lineHeight: 1.4,
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Arrow pointing down toward the button */}
          <div style={{
            position:   'absolute',
            bottom:     '-6px',
            right:      '13px',
            width:      '11px',
            height:     '11px',
            background: isDark ? '#0f172a' : '#ffffff',
            border:     `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            borderTop:  'none',
            borderLeft: 'none',
            transform:  'rotate(45deg)',
          }} />
        </div>
      )}

      {/* ── ? Button ──────────────────────────────────────────────────────── */}
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   '50%',
          border:         `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          background:     isDark ? '#0f172a' : '#ffffff',
          color:          isDark ? '#94a3b8' : '#64748b',
          fontSize:       '14px',
          fontWeight:     700,
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      isDark
            ? '0 2px 8px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          transition:     'all 0.15s',
        }}
      >
        ?
      </button>
    </div>
  )
}