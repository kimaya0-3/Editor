import { useCallback } from 'react'
import { useProjectStore } from '../../store/projectStore'
import type { TraxSecurityZone, TraxZoneExposure } from '../../types/index'

interface ZoneEditorProps {
  zone:   TraxSecurityZone
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
    transition:   'border-color 0.15s',
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
    minHeight:    '72px',
    boxSizing:    'border-box' as const,
    transition:   'border-color 0.15s',
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

  checkRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    padding:    '6px 0',
    cursor:     'pointer',
    userSelect: 'none' as const,
  },

  checkLabel: {
    fontSize: '13px',
    color:    isDark ? '#cbd5e1' : '#334155',
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

// ─── ZoneEditor ───────────────────────────────────────────────────────────────

export const ZoneEditor = ({ zone, isDark }: ZoneEditorProps) => {
  const updateZone = useProjectStore((s) => s.updateZone)
  const f          = makeFieldStyles(isDark)

  const patch = useCallback(
    (partial: Partial<TraxSecurityZone>) => updateZone(zone.zone_id, partial),
    [updateZone, zone.zone_id],
  )

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Identity</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={f.wrapper}>
            <label style={f.label}>Zone ID</label>
            <input
              style={{ ...f.input, opacity: 0.5, cursor: 'not-allowed' }}
              value={zone.zone_id}
              readOnly
            />
          </div>

          <div style={f.wrapper}>
            <label style={f.label}>Name</label>
            <input
              style={f.input}
              value={zone.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Zone name"
            />
          </div>

          <div style={f.wrapper}>
            <label style={f.label}>Description</label>
            <textarea
              style={f.textarea}
              value={zone.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Optional description…"
            />
          </div>

        </div>
      </div>

      {/* ── Type ───────────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Zone Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={f.wrapper}>
            <label style={f.label}>Type</label>
            <select
              style={f.select}
              value={zone.TypeOf?.type ?? ''}
              onChange={(e) => {
                const type = e.target.value as 'Host' | 'Network' | 'Proximity' | ''
                const nameMap: Record<string, string> = {
                  Host:      'General Host Zone',
                  Network:   'Network Segment',
                  Proximity: 'Proximity Zone',
                }
                patch({
                  TypeOf: type
                    ? { type, name: nameMap[type] ?? type }
                    : undefined,
                  isHostZone:      type === 'Host',
                  isNetworkZone:   type === 'Network',
                  isProximityZone: type === 'Proximity',
                })
              }}
            >
              <option value="">— Select type —</option>
              <option value="Host">Host Zone</option>
              <option value="Network">Network Zone</option>
              <option value="Proximity">Proximity Zone</option>
            </select>
          </div>

          <div style={f.wrapper}>
            <label style={f.label}>Variant</label>
            <input
              style={f.input}
              value={zone.Variant?.name ?? ''}
              onChange={(e) =>
                patch({ Variant: e.target.value ? { name: e.target.value } : undefined })
              }
              placeholder="e.g. Kubernetes cluster"
            />
          </div>

        </div>
      </div>

      {/* ── Flags ──────────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Flags</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(
            [
              { key: 'external',          label: 'External'          },
              { key: 'isNetworkZone',     label: 'Network Zone'      },
              { key: 'isProximityZone',   label: 'Proximity Zone'    },
              { key: 'isHostZone',        label: 'Host Zone'         },
              { key: 'isStructuringBox',  label: 'Structuring Box'   },
              { key: 'isTopSecurityZone', label: 'Top Security Zone' },
              { key: 'isVisible',         label: 'Visible'           },
            ] as { key: keyof TraxSecurityZone; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} style={f.checkRow}>
              <input
                type="checkbox"
                checked={!!zone[key]}
                onChange={(e) => patch({ [key]: e.target.checked })}
                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
              />
              <span style={f.checkLabel}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Zone Exposures ─────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>
          Zone Exposures ({zone.ZoneExposures?.length ?? 0})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(zone.ZoneExposures ?? []).map((exp, i) => (
            <ExposureRow
              key={i}
              index={i}
              exp={exp}
              isDark={isDark}
              f={f}
              onChange={(partial) => {
                const updated = [...(zone.ZoneExposures ?? [])]
                updated[i]   = { ...updated[i], ...partial }
                patch({ ZoneExposures: updated })
              }}
              onDelete={() => {
                const updated = (zone.ZoneExposures ?? []).filter((_, idx) => idx !== i)
                patch({ ZoneExposures: updated })
              }}
            />
          ))}

          <button
            onClick={() =>
              patch({
                ZoneExposures: [
                  ...(zone.ZoneExposures ?? []),
                  {
                    rating:           'NoRating',
                    zoneExposureType: 'Network',
                    description:      '',
                  } as TraxZoneExposure,
                ],
              })
            }
            style={{
              padding:      '7px 12px',
              borderRadius: '7px',
              border:       `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
              background:   'transparent',
              color:        isDark ? '#475569' : '#94a3b8',
              fontSize:     '12px',
              cursor:       'pointer',
              fontFamily:   'sans-serif',
            }}
          >
            + Add Exposure
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── ExposureRow ──────────────────────────────────────────────────────────────

interface ExposureRowProps {
  index:    number
  exp:      TraxZoneExposure
  isDark:   boolean
  f:        ReturnType<typeof makeFieldStyles>
  onChange: (partial: Partial<TraxZoneExposure>) => void
  onDelete: () => void
}

const ExposureRow = ({ index, exp, isDark, f, onChange, onDelete }: ExposureRowProps) => (
  <div style={{
    padding:       '10px 12px',
    borderRadius:  '8px',
    border:        `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:    isDark ? '#0b1120' : '#f8fafc',
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  }}>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#64748b' : '#94a3b8' }}>
        Exposure {index + 1}
      </span>
      <button
        onClick={onDelete}
        style={{
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          color:      isDark ? '#475569' : '#94a3b8',
          fontSize:   '13px',
          padding:    '0 2px',
          lineHeight: 1,
        }}
        title="Remove exposure"
      >
        ✕
      </button>
    </div>

    <div style={f.wrapper}>
      <label style={f.label}>Type</label>
      <select
        style={f.select}
        value={exp.zoneExposureType}
        onChange={(e) =>
          onChange({ zoneExposureType: e.target.value as TraxZoneExposure['zoneExposureType'] })
        }
      >
        <option value="Network">Network</option>
        <option value="Proximity">Proximity</option>
        <option value="Host">Host</option>
      </select>
    </div>

    <div style={f.wrapper}>
      <label style={f.label}>Rating</label>
      <select
        style={f.select}
        value={exp.rating}
        onChange={(e) =>
          onChange({ rating: e.target.value as TraxZoneExposure['rating'] })
        }
      >
        <option value="NoRating">No Rating</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Incomplete">Incomplete</option>
      </select>
    </div>

    <div style={f.wrapper}>
      <label style={f.label}>Description</label>
      <textarea
        style={{ ...f.textarea, minHeight: '52px' }}
        value={exp.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Optional…"
      />
    </div>

  </div>
)