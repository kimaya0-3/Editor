import { useCallback, useState } from 'react'
import { useProjectStore } from '../../store/projectStore'

interface EntityPaletteProps {
  isDark: boolean
}

// ─── Palette item config ──────────────────────────────────────────────────────

const PALETTE_ITEMS = [
  {
    mode:  'addZone'      as const,
    label: 'Add Zone',
    hint:  'Click anywhere on the canvas to place a new security zone.',
    sub:   'Click canvas to place',
    icon:  (active: boolean, isDark: boolean) => (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path
          d="M7.5 1L13.5 4.25V10.75L7.5 14L1.5 10.75V4.25L7.5 1Z"
          stroke={active ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#64748b' : '#94a3b8')}
          strokeWidth="1.4"
          fill={active ? (isDark ? '#1e40af33' : '#bfdbfe88') : 'none'}
        />
      </svg>
    ),
  },
  {
    mode:  'addComponent' as const,
    label: 'Add Component',
    hint:  'Click inside an existing zone to place a component there.',
    sub:   'Click inside a zone',
    icon:  (active: boolean, isDark: boolean) => (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect
          x="1.5" y="3.5" width="12" height="8" rx="1.5"
          stroke={active ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#64748b' : '#94a3b8')}
          strokeWidth="1.4"
          fill={active ? (isDark ? '#1e40af33' : '#bfdbfe88') : 'none'}
        />
        <path
          d="M5 3.5V2M10 3.5V2"
          stroke={active ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#64748b' : '#94a3b8')}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    mode:  'addEdge'      as const,
    label: 'Add Communication',
    hint:  'Drag from one node handle to another to create a communication link.',
    sub:   'Drag between nodes',
    icon:  (active: boolean, isDark: boolean) => (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle
          cx="2.5" cy="7.5" r="1.5"
          fill={active ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#64748b' : '#94a3b8')}
        />
        <circle
          cx="12.5" cy="7.5" r="1.5"
          fill={active ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#64748b' : '#94a3b8')}
        />
        <path
          d="M4 7.5h7M9 5.5l2 2-2 2"
          stroke={active ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#64748b' : '#94a3b8')}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

// ─── Token helper ─────────────────────────────────────────────────────────────

const tk = (isDark: boolean) => ({
  bg:          isDark ? '#0b1120' : '#ffffff',
  bgSubtle:    isDark ? '#111827' : '#f8fafc',
  bgActive:    isDark ? '#1e3a5f' : '#eff6ff',
  bgIcon:      isDark ? '#1e293b' : '#f1f5f9',
  bgIconActive:isDark ? '#1e40af' : '#dbeafe',
  border:      isDark ? '#1e293b' : '#e2e8f0',
  borderActive:isDark ? '#3b82f6' : '#93c5fd',
  textPrimary: isDark ? '#e2e8f0' : '#0f172a',
  textSub:     isDark ? '#64748b' : '#94a3b8',
  textActive:  isDark ? '#93c5fd' : '#1d4ed8',
  hintBg:      isDark ? '#0f2040' : '#eff6ff',
  hintBorder:  isDark ? '#1e3a5f' : '#bfdbfe',
  hintText:    isDark ? '#7dd3fc' : '#1d4ed8',
})

// ─── PaletteButton ────────────────────────────────────────────────────────────

interface PaletteButtonProps {
  mode:      typeof PALETTE_ITEMS[number]['mode']
  label:     string
  sub:       string
  icon:      (active: boolean, isDark: boolean) => React.ReactNode
  isActive:  boolean
  isDisabled:boolean
  isDark:    boolean
  onClick:   () => void
}

const PaletteButton = ({
   label, sub, icon, isActive, isDisabled, isDark, onClick,
}: PaletteButtonProps) => {
  const [hovered, setHovered] = useState(false)
  const tokens = tk(isDark)

  const bg = isActive
    ? tokens.bgActive
    : hovered
      ? (isDark ? '#161f30' : '#f1f5f9')
      : tokens.bgSubtle

  const border = isActive
    ? tokens.borderActive
    : hovered
      ? (isDark ? '#334155' : '#cbd5e1')
      : tokens.border

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isDisabled ? 'Load a project first' : label}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '10px',
        padding:     '9px 11px',
        borderRadius:'8px',
        border:      `1px solid ${border}`,
        background:  bg,
        color:       isActive ? tokens.textActive : tokens.textSub,
        cursor:      isDisabled ? 'not-allowed' : 'pointer',
        opacity:     isDisabled ? 0.4 : 1,
        transition:  'all 0.15s ease',
        textAlign:   'left',
        width:       '100%',
        fontFamily:  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Icon chip */}
      <span style={{
        width:          '30px',
        height:         '30px',
        borderRadius:   '7px',
        background:     isActive ? tokens.bgIconActive : tokens.bgIcon,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        transition:     'background 0.15s ease',
        boxShadow:      isActive
          ? `0 0 0 1px ${isDark ? '#1d4ed8' : '#93c5fd'}`
          : 'none',
      }}>
        {icon(isActive, isDark)}
      </span>

      {/* Labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        <span style={{
          fontSize:   '12px',
          fontWeight: 600,
          lineHeight: 1.3,
          color:      isActive
            ? tokens.textActive
            : (isDark ? tokens.textPrimary : '#334155'),
        }}>
          {label}
        </span>
        <span style={{
          fontSize:   '10px',
          lineHeight: 1.3,
          color:      tokens.textSub,
        }}>
          {sub}
        </span>
      </div>

      {/* Active indicator */}
      {isActive && (
        <span style={{
          width:        '6px',
          height:       '6px',
          borderRadius: '50%',
          background:   isDark ? '#3b82f6' : '#2563eb',
          flexShrink:   0,
          boxShadow:    `0 0 6px ${isDark ? '#3b82f6' : '#2563eb'}`,
        }} />
      )}
    </button>
  )
}

// ─── EntityPalette ────────────────────────────────────────────────────────────

export const EntityPalette = ({ isDark }: EntityPaletteProps) => {
  const editorMode    = useProjectStore((s) => s.editorMode)
  const setEditorMode = useProjectStore((s) => s.setEditorMode)
  const project       = useProjectStore((s) => s.project)
  const tokens        = tk(isDark)

  const toggle = useCallback(
    (mode: typeof PALETTE_ITEMS[number]['mode']) => {
      setEditorMode(editorMode === mode ? 'idle' : mode)
    },
    [editorMode, setEditorMode],
  )

  const cancel = useCallback(() => setEditorMode('idle'), [setEditorMode])

  const activeItem = PALETTE_ITEMS.find((i) => i.mode === editorMode)

  return (
    <div style={{
      padding:       '14px 14px',
      display:       'flex',
      flexDirection: 'column',
      gap:           '5px',
    }}>

      {/* ── Section label ─────────────────────────────────────────────── */}
      <div style={{
        fontSize:      '10px',
        fontWeight:    700,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color:         tokens.textSub,
        marginBottom:  '6px',
        paddingLeft:   '2px',
      }}>
        Add to Diagram
      </div>

      {/* ── Tool buttons ──────────────────────────────────────────────── */}
      {PALETTE_ITEMS.map(({ mode, icon, label, sub }) => (
        <PaletteButton
          key={mode}
          mode={mode}
          label={label}
          sub={sub}
          icon={icon}
          isActive={editorMode === mode}
          isDisabled={!project}
          isDark={isDark}
          onClick={() => toggle(mode)}
        />
      ))}

      {/* ── Contextual hint ───────────────────────────────────────────── */}
      {activeItem && (
        <div style={{
          marginTop:     '6px',
          padding:       '11px 13px',
          borderRadius:  '8px',
          background:    tokens.hintBg,
          border:        `1px solid ${tokens.hintBorder}`,
          display:       'flex',
          flexDirection: 'column',
          gap:           '10px',
        }}>

          {/* Hint text */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            {/* Info icon */}
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ flexShrink: 0, marginTop: '1px' }}
            >
              <circle cx="7" cy="7" r="6" stroke={tokens.hintText} strokeWidth="1.3"/>
              <path
                d="M7 6.5V10M7 4.5V5"
                stroke={tokens.hintText}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p style={{
              margin:     0,
              fontSize:   '11px',
              color:      tokens.hintText,
              lineHeight: 1.6,
            }}>
              {activeItem.hint}
            </p>
          </div>

          {/* Cancel button */}
          <CancelButton isDark={isDark} onClick={cancel} />
        </div>
      )}
    </div>
  )
}

// ─── CancelButton ─────────────────────────────────────────────────────────────

const CancelButton = ({ isDark, onClick }: { isDark: boolean; onClick: () => void }) => {
  const [hovered, setHovered] = useState(false)
  const tokens = tk(isDark)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '5px',
        padding:      '5px 10px',
        borderRadius: '6px',
        border:       `1px solid ${hovered
          ? (isDark ? '#475569' : '#94a3b8')
          : tokens.hintBorder}`,
        background:   hovered
          ? (isDark ? '#1e293b' : '#e2e8f0')
          : 'transparent',
        color:        hovered
          ? (isDark ? '#e2e8f0' : '#334155')
          : tokens.textSub,
        fontSize:     '11px',
        fontWeight:   500,
        cursor:       'pointer',
        alignSelf:    'flex-start',
        fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        transition:   'all 0.15s ease',
      }}
    >
      {/* X icon */}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d="M1 1l8 8M9 1L1 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      Cancel
    </button>
  )
}