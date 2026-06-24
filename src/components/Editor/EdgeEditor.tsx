// src/components/Editor/EdgeEditor.tsx
import { useCallback } from 'react'
import { useProjectStore } from '../../store/projectStore'
import type { TraxInterSWCommunication } from '../../types/index'

interface EdgeEditorProps {
  comm:   TraxInterSWCommunication
  isDark: boolean
}

// ─── Shared field styles ──────────────────────────────────────────────────────

const makeFieldStyles = (isDark: boolean) => ({
  wrapper: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           '4px',
  },
  label: {
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color:         isDark ? '#475569' : '#94a3b8',
  },
  input: {
    width:        '100%',
    padding:      '7px 10px',
    borderRadius: '7px',
    border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    outline:      'none',
    boxSizing:    'border-box' as const,
  },
  textarea: {
    width:        '100%',
    padding:      '7px 10px',
    borderRadius: '7px',
    border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    outline:      'none',
    resize:       'vertical' as const,
    minHeight:    '64px',
    boxSizing:    'border-box' as const,
  },
  select: {
    width:        '100%',
    padding:      '7px 10px',
    borderRadius: '7px',
    border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    outline:      'none',
    cursor:       'pointer',
    boxSizing:    'border-box' as const,
  },
  sectionTitle: {
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color:         isDark ? '#3b82f6' : '#2563eb',
    paddingBottom: '8px',
    borderBottom:  `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
    marginBottom:  '12px',
  },
})

const RATINGS = [
  { value: 'NoRating',   label: 'No Rating'  },
  { value: 'Low',        label: 'Low'         },
  { value: 'Medium',     label: 'Medium'      },
  { value: 'High',       label: 'High'        },
  { value: 'Incomplete', label: 'Incomplete'  },
]

// ─── EdgeEditor ───────────────────────────────────────────────────────────────

export const EdgeEditor = ({ comm, isDark }: EdgeEditorProps) => {
  const updateCommunication = useProjectStore((s) => s.updateCommunication)
  const f                   = makeFieldStyles(isDark)

  const patch = useCallback(
    (partial: Partial<TraxInterSWCommunication>) =>
      updateCommunication(comm.communication_id, partial),
    [updateCommunication, comm.communication_id],
  )

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Communication</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Communication ID — read-only */}
          <div style={f.wrapper}>
            <label style={f.label}>Communication ID</label>
            <input
              style={{ ...f.input, opacity: 0.5, cursor: 'not-allowed' }}
              value={comm.communication_id}
              readOnly
            />
          </div>

          {/* Source — read-only */}
          {comm.SourceComponent && (
            <div style={f.wrapper}>
              <label style={f.label}>Source Component</label>
              <input
                style={{ ...f.input, opacity: 0.5, cursor: 'not-allowed' }}
                value={comm.SourceComponent.subUnit_id}
                readOnly
              />
            </div>
          )}

          {/* Target interface — read-only */}
          <div style={f.wrapper}>
            <label style={f.label}>Target Interface</label>
            <input
              style={{ ...f.input, opacity: 0.5, cursor: 'not-allowed' }}
              value={comm.TargetInterface.interface_id}
              readOnly
            />
          </div>

          {/* Name */}
          <div style={f.wrapper}>
            <label style={f.label}>Name</label>
            <input
              style={f.input}
              value={comm.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Communication name"
            />
          </div>

          {/* Description */}
          <div style={f.wrapper}>
            <label style={f.label}>Description</label>
            <textarea
              style={f.textarea}
              value={comm.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Optional description…"
            />
          </div>

        </div>
      </div>

      {/* ── Exposure ───────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Exposure</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Exposure rating */}
          <div style={f.wrapper}>
            <label style={f.label}>Exposure Rating</label>
            <select
              style={f.select}
              value={comm.specificExposureRating_C}
              onChange={(e) =>
                patch({
                  specificExposureRating_C:
                    e.target.value as TraxInterSWCommunication['specificExposureRating_C'],
                })
              }
            >
              {RATINGS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Exposure comment */}
          <div style={f.wrapper}>
            <label style={f.label}>Exposure Comment</label>
            <textarea
              style={{ ...f.textarea, minHeight: '52px' }}
              value={comm.specificExposureComment_C ?? ''}
              onChange={(e) =>
                patch({ specificExposureComment_C: e.target.value || undefined })
              }
              placeholder="Optional comment…"
            />
          </div>

        </div>
      </div>

      {/* ── Protocol & Flags ───────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Protocol & Flags</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Protocol */}
          <div style={f.wrapper}>
            <label style={f.label}>Protocol</label>
            <input
              style={f.input}
              value={comm.ProtocolType?.name ?? ''}
              onChange={(e) =>
                patch({
                  ProtocolType: e.target.value ? { name: e.target.value } : undefined,
                })
              }
              placeholder="e.g. HTTPS, MQTT, S7…"
            />
          </div>

          {/* Protocol other */}
          <div style={f.wrapper}>
            <label style={f.label}>Protocol (other)</label>
            <input
              style={f.input}
              value={comm.protocolOther ?? ''}
              onChange={(e) =>
                patch({ protocolOther: e.target.value || undefined })
              }
              placeholder="Free-text protocol name…"
            />
          </div>

          {/* Via untrusted zones checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={comm.viaUntrustedZones}
              onChange={(e) => patch({ viaUntrustedZones: e.target.checked })}
              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#334155' }}>
              Via Untrusted Zones
            </span>
          </label>

        </div>
      </div>

    </div>
  )
}