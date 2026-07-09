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

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPOSURE_TYPES = ['Network', 'Proximity', 'Host'] as const
type ExposureType = typeof EXPOSURE_TYPES[number]

const RATINGS = [
  { value: 'NoRating',   label: 'No Rating'  },
  { value: 'Low',        label: 'Low'         },
  { value: 'Medium',     label: 'Medium'      },
  { value: 'High',       label: 'High'        },
  { value: 'Incomplete', label: 'Incomplete'  },
] as const

// Colour accent per exposure type — used for the left border stripe
const TYPE_COLOR: Record<ExposureType, { border: string; label: string }> = {
  Network:   { border: '#3b82f6', label: '#60a5fa' },
  Proximity: { border: '#f59e0b', label: '#fbbf24' },
  Host:      { border: '#10b981', label: '#34d399' },
}

// ─── ZoneEditor ───────────────────────────────────────────────────────────────

export const ZoneEditor = ({ zone, isDark }: ZoneEditorProps) => {
  const updateZone = useProjectStore((s) => s.updateZone)
  const f          = makeFieldStyles(isDark)

  const patch = useCallback(
    (partial: Partial<TraxSecurityZone>) => updateZone(zone.zone_id, partial),
    [updateZone, zone.zone_id],
  )

  // ── Exposure helpers ───────────────────────────────────────────────────────

  /** Return the single exposure entry for a given type, or undefined. */
  const getExposure = (type: ExposureType): TraxZoneExposure | undefined =>
    (zone.ZoneExposures ?? []).find((e) => e.zoneExposureType === type)

  /**
   * Toggle a type on/off, or update a field within an existing entry.
   * Keeps at most one entry per type and auto-derives the three is*Zone flags
   * so the exported JSON stays consistent with real TRA-X data.
   */
  const patchExposure = (
    type:    ExposureType,
    partial: Partial<TraxZoneExposure> | null,   // null = remove
  ) => {
    const existing = (zone.ZoneExposures ?? []).filter(
      (e) => e.zoneExposureType !== type,
    )

    const nextExposures = partial === null
      ? existing
      : [
          ...existing,
          {
            rating:           getExposure(type)?.rating      ?? 'NoRating',
            zoneExposureType: type,
            description:      getExposure(type)?.description ?? '',
            ...partial,
          } as TraxZoneExposure,
        ]

    // Derive the three is*Zone flags from the resulting exposure list
    patch({
      ZoneExposures:   nextExposures,
      isNetworkZone:   nextExposures.some((e) => e.zoneExposureType === 'Network'),
      isProximityZone: nextExposures.some((e) => e.zoneExposureType === 'Proximity'),
      isHostZone:      nextExposures.some((e) => e.zoneExposureType === 'Host'),
    })
  }

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

      {/* ── Zone Type ──────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Zone Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={f.wrapper}>
            <label style={f.label}>Variant</label>
            <input
              style={f.input}
              value={zone.Variant?.name ?? ''}
              onChange={(e) =>
                patch({ Variant: e.target.value ? { name: e.target.value } : undefined })
              }
              placeholder="e.g. Kubernetes cluster, Unspecified…"
            />
          </div>

        </div>
      </div>

      {/* ── Settings ───────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Settings</div>
        <label style={f.checkRow}>
          <input
            type="checkbox"
            checked={!!zone.external}
            onChange={(e) => patch({ external: e.target.checked })}
            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
          />
          <span style={f.checkLabel}>External Zone</span>
        </label>
      </div>

      {/* ── Zone Exposures ─────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Zone Exposures</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {EXPOSURE_TYPES.map((type) => (
            <ExposureCard
              key={type}
              type={type}
              exposure={getExposure(type)}
              isDark={isDark}
              f={f}
              onToggle={(enabled) =>
                enabled
                  ? patchExposure(type, { rating: 'NoRating', description: '' })
                  : patchExposure(type, null)
              }
              onChange={(partial) => patchExposure(type, partial)}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── ExposureCard ─────────────────────────────────────────────────────────────

interface ExposureCardProps {
  type:      ExposureType
  exposure:  TraxZoneExposure | undefined   // undefined = not assigned
  isDark:    boolean
  f:         ReturnType<typeof makeFieldStyles>
  onToggle:  (enabled: boolean) => void
  onChange:  (partial: Partial<TraxZoneExposure>) => void
}

const ExposureCard = ({
  type, exposure, isDark, f, onToggle, onChange,
}: ExposureCardProps) => {
  const enabled = exposure !== undefined
  const colors  = TYPE_COLOR[type]

  return (
    <div style={{
      borderRadius: '8px',
      border:       `1px solid ${
        enabled
          ? (isDark ? colors.border + '55' : colors.border + '44')
          : (isDark ? '#1e293b' : '#e2e8f0')
      }`,
      background:  isDark ? '#0b1120' : '#f8fafc',
      overflow:    'hidden',
      transition:  'border-color 0.15s',
    }}>

      {/* ── Header row — always visible ───────────────────────────────── */}
      <label style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '10px',
        padding:    '10px 12px',
        cursor:     'pointer',
        userSelect: 'none',
        borderLeft: `3px solid ${enabled ? colors.border : 'transparent'}`,
        transition: 'border-color 0.15s',
      }}>
        {/* Toggle checkbox */}
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }}
        />

        {/* Type label */}
        <span style={{
          fontSize:   '12px',
          fontWeight: 600,
          color:      enabled
            ? (isDark ? colors.label : colors.border)
            : (isDark ? '#475569'    : '#94a3b8'),
          transition: 'color 0.15s',
          flex:       1,
        }}>
          {type}
        </span>

        {/* Rating pill — shown inline when enabled */}
        {enabled && exposure && (
          <RatingPill rating={exposure.rating} isDark={isDark} />
        )}

        {/* Unassigned badge */}
        {!enabled && (
          <span style={{
            fontSize:  '10px',
            color:     isDark ? '#334155' : '#cbd5e1',
            fontStyle: 'italic',
          }}>
            not assigned
          </span>
        )}
      </label>

      {/* ── Expanded fields — only when enabled ───────────────────────── */}
      {enabled && exposure && (
        <div style={{
          padding:       '10px 12px 12px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '8px',
          borderTop:     `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
        }}>

          {/* Rating select */}
          <div style={f.wrapper}>
            <label style={f.label}>Rating</label>
            <select
              style={f.select}
              value={exposure.rating}
              onChange={(e) =>
                onChange({ rating: e.target.value as TraxZoneExposure['rating'] })
              }
            >
              {RATINGS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={f.wrapper}>
            <label style={f.label}>Description</label>
            <textarea
              style={{ ...f.textarea, minHeight: '52px' }}
              value={exposure.description ?? ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Optional…"
            />
          </div>

        </div>
      )}
    </div>
  )
}

// ─── RatingPill ───────────────────────────────────────────────────────────────

const RATING_COLORS: Record<string, {
  bg: string; darkBg: string; color: string; darkColor: string
}> = {
  NoRating:   { bg: '#f1f5f9', darkBg: '#1e293b', color: '#64748b', darkColor: '#475569' },
  Low:        { bg: '#dcfce7', darkBg: '#1e3a2f', color: '#16a34a', darkColor: '#4ade80' },
  Medium:     { bg: '#fef9c3', darkBg: '#3b2d00', color: '#ca8a04', darkColor: '#facc15' },
  High:       { bg: '#fee2e2', darkBg: '#450a0a', color: '#dc2626', darkColor: '#f87171' },
  Incomplete: { bg: '#fef3c7', darkBg: '#3b2000', color: '#b45309', darkColor: '#fbbf24' },
}

const RatingPill = ({ rating, isDark }: { rating: string; isDark: boolean }) => {
  const c = RATING_COLORS[rating] ?? RATING_COLORS.NoRating
  return (
    <span style={{
      fontSize:     '10px',
      fontWeight:   600,
      padding:      '2px 8px',
      borderRadius: '999px',
      background:   isDark ? c.darkBg    : c.bg,
      color:        isDark ? c.darkColor : c.color,
      whiteSpace:   'nowrap',
    }}>
      {rating === 'NoRating' ? 'No Rating' : rating}
    </span>
  )
}