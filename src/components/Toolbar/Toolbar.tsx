import { useRef, useState, useEffect } from 'react'
import { useProjectStore }              from '../../store/projectStore'
import { useExport }                    from '../../hooks/useExport'
import { SearchBar }                    from './SearchBar'
import type { CanvasSettings }          from '../../types/index'

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icons = {
  New: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9"  y1="15" x2="15" y2="15" />
    </svg>
  ),
  Import: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ImportLayout: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  ),
  Export: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Close: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  ),
  Horizontal: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2"  y="5" width="6" height="14" rx="1" />
      <rect x="9"  y="5" width="6" height="14" rx="1" />
      <rect x="16" y="5" width="6" height="14" rx="1" />
    </svg>
  ),
  Vertical: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2"  width="14" height="6" rx="1" />
      <rect x="5" y="9"  width="14" height="6" rx="1" />
      <rect x="5" y="16" width="14" height="6" rx="1" />
    </svg>
  ),
  Bezier: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20 C6 4, 18 4, 21 20" />
    </svg>
  ),
  Smooth: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20 Q12 4 21 20" />
    </svg>
  ),
  Straight: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  Step: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 18 3 6 12 6 12 18 21 18" />
    </svg>
  ),
  Animated: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 Q6 6 9 12 T15 12 T21 12" />
    </svg>
  ),
  Sun: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"     x2="12" y2="3"     />
      <line x1="12" y1="21"    x2="12" y2="23"    />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  ),
  Moon: () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
}

// ─── IconImage ────────────────────────────────────────────────────────────────

const IconImage = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

// ─── ToolbarSeparator ─────────────────────────────────────────────────────────

const ToolbarSeparator = ({ isDark }: { isDark: boolean }) => (
  <div style={{
    width:      '1px',
    height:     '20px',
    background: isDark ? '#1e293b' : '#e2e8f0',
    margin:     '0 6px',
    flexShrink: 0,
  }} />
)

// ─── ToolbarLabel ─────────────────────────────────────────────────────────────

const ToolbarLabel = ({ label, isDark }: { label: string; isDark: boolean }) => (
  <span style={{
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color:         isDark ? '#334155' : '#94a3b8',
    fontFamily:    'sans-serif',
    marginRight:   '2px',
    whiteSpace:    'nowrap',
    userSelect:    'none',
  }}>
    {label}
  </span>
)

// ─── ToolbarButton ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  label:     string
  icon:      React.ReactNode
  active:    boolean
  isDark:    boolean
  onClick:   () => void
  disabled?: boolean
  title?:    string
  danger?:   boolean
}

const ToolbarButton = ({
  label, icon, active, isDark, onClick, disabled, title, danger,
}: ToolbarButtonProps) => {
  const [hovered, setHovered] = useState(false)

  const getBg = () => {
    if (danger)  return isDark ? '#450a0a' : '#fee2e2'
    if (active)  return isDark ? '#1e3a5f' : '#dbeafe'
    if (hovered) return isDark ? '#1e293b' : '#f1f5f9'
    return 'transparent'
  }

  const getBorder = () => {
    if (danger)  return isDark ? '#7f1d1d' : '#fca5a5'
    if (active)  return isDark ? '#3b82f6' : '#2563eb'
    if (hovered) return isDark ? '#334155' : '#e2e8f0'
    return 'transparent'
  }

  const getColor = () => {
    if (danger) return isDark ? '#f87171' : '#dc2626'
    if (active) return isDark ? '#60a5fa' : '#1d4ed8'
    return        isDark ? '#94a3b8' : '#64748b'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      onMouseEnter={() => { if (!disabled) setHovered(true)  }}
      onMouseLeave={() => {                setHovered(false) }}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '5px',
        padding:      '4px 9px',
        borderRadius: '5px',
        border:       `1px solid ${getBorder()}`,
        background:   getBg(),
        color:        getColor(),
        fontSize:     '11px',
        fontWeight:   active ? 600 : 400,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        opacity:      disabled ? 0.35 : 1,
        transition:   'all 0.12s',
        whiteSpace:   'nowrap',
        fontFamily:   'sans-serif',
        lineHeight:   1,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── DropdownItem ─────────────────────────────────────────────────────────────

const DropdownItem = ({
  label, icon, isDark, onClick,
}: {
  label:   string
  icon:    React.ReactNode
  isDark:  boolean
  onClick: () => void
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:        '100%',
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        padding:      '7px 10px',
        borderRadius: '6px',
        border:       'none',
        background:   hovered
          ? (isDark ? '#1e293b' : '#f1f5f9')
          : 'transparent',
        color:        isDark ? '#94a3b8' : '#64748b',
        fontSize:     '12px',
        fontWeight:   400,
        cursor:       'pointer',
        textAlign:    'left',
        whiteSpace:   'nowrap',
        fontFamily:   'sans-serif',
        transition:   'background 0.1s, color 0.1s',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── ExportDropdown ───────────────────────────────────────────────────────────

interface ExportDropdownProps {
  isDark:             boolean
  disabled:           boolean
  onExportJson:       () => void
  onExportJsonLayout: () => void
  onExportPng:        () => void
  onExportJpeg:       () => void
}

const ExportDropdown = ({
  isDark,
  disabled,
  onExportJson,
  onExportJsonLayout,
  onExportPng,
  onExportJpeg,
}: ExportDropdownProps) => {
  const [open,    setOpen]    = useState(false)
  const [hovered, setHovered] = useState(false)
  const wrapperRef            = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 46, left: 0 })

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return

    const updatePos = () => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return
      setDropdownPos({ top: rect.bottom + 6, left: rect.left })
    }

    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)

    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  const getBg = () => {
    if (hovered) return isDark ? '#1e293b' : '#f1f5f9'
    if (open)    return isDark ? '#1e3a5f' : '#dbeafe'
    return 'transparent'
  }

  const getBorder = () => {
    if (open)    return isDark ? '#3b82f6' : '#2563eb'
    if (hovered) return isDark ? '#334155' : '#e2e8f0'
    return 'transparent'
  }

  const getColor = () => {
    if (open) return isDark ? '#60a5fa' : '#1d4ed8'
    return isDark ? '#94a3b8' : '#64748b'
  }

  const items: {
    label:    string
    icon:     React.ReactNode
    onClick:  () => void
    divider?: boolean
  }[] = [
    {
      label:   'Export JSON',
      icon:    <Icons.Export />,
      onClick: () => { onExportJson(); setOpen(false) },
    },
    {
      label:   'Export JSON + Layout',
      icon:    <Icons.ImportLayout />,
      onClick: () => { onExportJsonLayout(); setOpen(false) },
      divider: true,
    },
    {
      label:   'Export PNG',
      icon:    <IconImage />,
      onClick: () => { onExportPng(); setOpen(false) },
    },
    {
      label:   'Export JPEG',
      icon:    <IconImage />,
      onClick: () => { onExportJpeg(); setOpen(false) },
    },
  ]

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>

      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => { if (!disabled) setHovered(true)  }}
        onMouseLeave={() => {                setHovered(false) }}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '5px',
          padding:      '4px 9px',
          borderRadius: '5px',
          border:       `1px solid ${getBorder()}`,
          background:   getBg(),
          color:        getColor(),
          fontSize:     '11px',
          fontWeight:   open ? 600 : 400,
          cursor:       disabled ? 'not-allowed' : 'pointer',
          opacity:      disabled ? 0.35 : 1,
          transition:   'all 0.12s',
          whiteSpace:   'nowrap',
          fontFamily:   'sans-serif',
          lineHeight:   1,
        }}
      >
        <Icons.Export />
        Export
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            marginLeft: '1px',
            transition: 'transform 0.15s',
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position:      'fixed',
          top:           `${dropdownPos.top}px`,
          left:          `${dropdownPos.left}px`,
          minWidth:      '190px',
          background:    isDark ? '#0f172a' : '#ffffff',
          border:        `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          borderRadius:  '10px',
          boxShadow:     isDark
            ? '0 8px 32px rgba(0,0,0,0.6)'
            : '0 8px 32px rgba(0,0,0,0.12)',
          zIndex:        999999,
          padding:       '6px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '2px',
        }}>
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && i > 0 && (
                <div style={{
                  height:     '1px',
                  background: isDark ? '#1e293b' : '#f1f5f9',
                  margin:     '4px 0',
                }} />
              )}
              <DropdownItem
                label={item.label}
                icon={item.icon}
                isDark={isDark}
                onClick={item.onClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── EdgeStyleDropdown ───────────────────────────────────────────────────────

interface EdgeStyleDropdownProps {
  isDark: boolean
  disabled: boolean
  value: CanvasSettings['edgeStyle']
  onChange: (style: CanvasSettings['edgeStyle']) => void
}

const EdgeStyleDropdown = ({ isDark, disabled, value, onChange }: EdgeStyleDropdownProps) => {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 46, left: 0 })

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return

    const updatePos = () => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return
      setDropdownPos({ top: rect.bottom + 6, left: rect.left })
    }

    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)

    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  const getBg = () => {
    if (hovered) return isDark ? '#1e293b' : '#f1f5f9'
    if (open) return isDark ? '#1e3a5f' : '#dbeafe'
    return 'transparent'
  }

  const getBorder = () => {
    if (open) return isDark ? '#3b82f6' : '#2563eb'
    if (hovered) return isDark ? '#334155' : '#e2e8f0'
    return 'transparent'
  }

  const getColor = () => {
    if (open) return isDark ? '#60a5fa' : '#1d4ed8'
    return isDark ? '#94a3b8' : '#64748b'
  }

  const selectedLabel = {
    default: 'Bezier',
    smoothstep: 'Smooth',
    straight: 'Straight',
    step: 'Step',
    animated: 'Animated',
  }[value]

  const items: Array<{
    label: string
    icon: React.ReactNode
    value: CanvasSettings['edgeStyle']
    description: string
  }> = [
    { label: 'Bezier', icon: <Icons.Bezier />, value: 'default', description: 'Smooth curved connections' },
    { label: 'Smooth', icon: <Icons.Smooth />, value: 'smoothstep', description: 'Rounded right-angle connections' },
    { label: 'Straight', icon: <Icons.Straight />, value: 'straight', description: 'Direct straight line connections' },
    { label: 'Step', icon: <Icons.Step />, value: 'step', description: 'Hard right-angle connections' },
    { label: 'Animated', icon: <Icons.Animated />, value: 'animated', description: 'Flowing animated connections' },
  ]

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => { if (!disabled) setHovered(true) }}
        onMouseLeave={() => { setHovered(false) }}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '5px',
          padding:      '4px 9px',
          borderRadius: '5px',
          border:       `1px solid ${getBorder()}`,
          background:   getBg(),
          color:        getColor(),
          fontSize:     '11px',
          fontWeight:   open ? 600 : 400,
          cursor:       disabled ? 'not-allowed' : 'pointer',
          opacity:      disabled ? 0.35 : 1,
          transition:   'all 0.12s',
          whiteSpace:   'nowrap',
          fontFamily:   'sans-serif',
          lineHeight:   1,
        }}
      >
        {selectedLabel}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            marginLeft: '1px',
            transition: 'transform 0.15s',
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div style={{
          position:      'fixed',
          top:           `${dropdownPos.top}px`,
          left:          `${dropdownPos.left}px`,
          minWidth:      '240px',
          background:    isDark ? '#0f172a' : '#ffffff',
          border:        `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          borderRadius:  '10px',
          boxShadow:     isDark
            ? '0 8px 32px rgba(0,0,0,0.6)'
            : '0 8px 32px rgba(0,0,0,0.12)',
          zIndex:        999999,
          padding:       '6px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '2px',
        }}>
          {items.map((item) => {
            const active = value === item.value
            return (
              <button
                key={item.value}
                onClick={() => {
                  onChange(item.value)
                  setOpen(false)
                }}
                style={{
                  width:        '100%',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '8px',
                  padding:      '7px 10px',
                  borderRadius: '6px',
                  border:       'none',
                  background:   active
                    ? (isDark ? '#1e3a5f' : '#dbeafe')
                    : 'transparent',
                  color:        active ? (isDark ? '#60a5fa' : '#1d4ed8') : (isDark ? '#94a3b8' : '#64748b'),
                  fontSize:     '12px',
                  fontWeight:   active ? 600 : 400,
                  cursor:       'pointer',
                  textAlign:    'left',
                  whiteSpace:   'nowrap',
                  fontFamily:   'sans-serif',
                  transition:   'background 0.1s, color 0.1s',
                }}
              >
                {item.icon}
                <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <span>{item.label}</span>
                  <span style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>
                    {item.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface ToolbarProps {
  onLayoutChange: () => void
}

export const Toolbar = ({ onLayoutChange }: ToolbarProps) => {
  const theme                = useProjectStore((s) => s.theme)
  const project              = useProjectStore((s) => s.project)
  const settings             = useProjectStore((s) => s.diagramLayout.settings)
  const updateCanvasSettings = useProjectStore((s) => s.updateCanvasSettings)
  const toggleTheme          = useProjectStore((s) => s.toggleTheme)
  const newProject           = useProjectStore((s) => s.newProject)
  const loadProject          = useProjectStore((s) => s.loadProject)
  const importLayout         = useProjectStore((s) => s.importLayout)
  const clearProject         = useProjectStore((s) => s.clearProject)

  const {
    exportTraxJson,
    exportJson:  exportJsonLayout,
    exportImage,
  } = useExport()

  const projectInputRef = useRef<HTMLInputElement>(null)
  const layoutInputRef  = useRef<HTMLInputElement>(null)

  const isDark     = theme === 'dark'
  const hasProject = !!project

  // ── Handlers ────────────────────────────────────────────────────────────────

  const setAlgorithm = (algo: CanvasSettings['layoutAlgorithm']) => {
    updateCanvasSettings({ layoutAlgorithm: algo })
    onLayoutChange()
  }

  const setEdgeStyle = (style: CanvasSettings['edgeStyle']) => {
    updateCanvasSettings({ edgeStyle: style })
  }

  const handleNewProject = () => {
    if (hasProject) {
      const ok = window.confirm('Start a new project? Any unsaved changes will be lost.')
      if (!ok) return
    }
    newProject()
  }

  const handleImport = () => {
    if (hasProject) {
      const ok = window.confirm('Open a file? Your current project will be replaced.')
      if (!ok) return
    }
    projectInputRef.current?.click()
  }

  const handleClose = () => {
    const ok = window.confirm(
      'Close this project and return to the start screen? Unsaved changes will be lost.'
    )
    if (ok) clearProject()
  }

  const onProjectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const projectFile = files.find(
      (f) => f.name.endsWith('.json') && !f.name.endsWith('.layout.json')
    )
    const layoutFile = files.find((f) => f.name.endsWith('.layout.json'))

    if (!projectFile) {
      console.warn('[Toolbar] No project .json file found in selection')
      return
    }
    await loadProject(projectFile, layoutFile)
  }

  const onLayoutFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await importLayout(file)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '2px',
      padding:    '0 12px',
      height:     '40px',
      background: isDark ? '#0f172a' : '#ffffff',
      borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
      flexShrink: 0,
      overflowX:  'auto',
      overflowY:  'visible',    // ← allow dropdown to escape vertically
      position:   'relative',   // ← establish stacking context
      zIndex:     100,          // ← sit above canvas content
    }}>

      {/* ── Hidden file inputs ─────────────────────────────────────────── */}
      <input
        ref={projectInputRef}
        type="file"
        accept=".json"
        multiple
        style={{ display: 'none' }}
        onChange={onProjectFileChange}
      />
      <input
        ref={layoutInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={onLayoutFileChange}
      />

      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div style={{
        fontSize:      '12px',
        fontWeight:    700,
        color:         isDark ? '#f1f5f9' : '#0f172a',
        marginRight:   '6px',
        whiteSpace:    'nowrap',
        fontFamily:    'sans-serif',
        letterSpacing: '-0.2px',
        flexShrink:    0,
      }}>
        TRA-X <span style={{ color: '#3b82f6', fontWeight: 500 }}>Editor</span>
      </div>

      <ToolbarSeparator isDark={isDark} />

      {/* ── Project actions ───────────────────────────────────────────── */}
      <ToolbarButton
        label="New"
        icon={<Icons.New />}
        active={false}
        isDark={isDark}
        onClick={handleNewProject}
        title="Start a new blank project"
      />
      <ToolbarButton
        label="Import"
        icon={<Icons.Import />}
        active={false}
        isDark={isDark}
        onClick={handleImport}
        title="Select .json — hold Ctrl/Cmd to also select .layout.json"
      />

      {hasProject && (
        <>
          <ToolbarButton
            label="Import Layout"
            icon={<Icons.ImportLayout />}
            active={false}
            isDark={isDark}
            onClick={() => layoutInputRef.current?.click()}
            title="Load a .layout.json without replacing project data"
          />
          <ExportDropdown
            isDark={isDark}
            disabled={!hasProject}
            onExportJson={exportTraxJson}
            onExportJsonLayout={exportJsonLayout}
            onExportPng={() => exportImage('png')}
            onExportJpeg={() => exportImage('jpeg')}
          />
          <ToolbarButton
            label="Close"
            icon={<Icons.Close />}
            active={false}
            isDark={isDark}
            danger
            onClick={handleClose}
            title="Close project and return to start screen"
          />
        </>
      )}

      <ToolbarSeparator isDark={isDark} />

      {/* ── Layout algorithm ──────────────────────────────────────────── */}
      <ToolbarLabel label="Layout" isDark={isDark} />
      <ToolbarButton
        label="Horizontal"
        icon={<Icons.Horizontal />}
        active={settings.layoutAlgorithm === 'horizontal'}
        isDark={isDark}
        disabled={!hasProject}
        onClick={() => setAlgorithm('horizontal')}
        title="Arrange zones left to right"
      />
      <ToolbarButton
        label="Vertical"
        icon={<Icons.Vertical />}
        active={settings.layoutAlgorithm === 'vertical'}
        isDark={isDark}
        disabled={!hasProject}
        onClick={() => setAlgorithm('vertical')}
        title="Arrange zones top to bottom"
      />

      <ToolbarSeparator isDark={isDark} />

      {/* ── Edge style ────────────────────────────────────────────────── */}
      <ToolbarLabel label="Edges" isDark={isDark} />
      <EdgeStyleDropdown
        isDark={isDark}
        disabled={!hasProject}
        value={settings.edgeStyle}
        onChange={setEdgeStyle}
      />

      <ToolbarSeparator isDark={isDark} />

      {/* ── Search ────────────────────────────────────────────────────── */}
      {hasProject && (
        <div style={{
          marginLeft:  'auto',
          marginRight: '8px',
          flexShrink:  0,
        }}>
          <SearchBar />
        </div>
      )}

      {/* ── Theme toggle ──────────────────────────────────────────────── */}
      <div style={{ marginLeft: hasProject ? '0' : 'auto' }}>
        <ToolbarButton
          label={isDark ? 'Light' : 'Dark'}
          icon={isDark ? <Icons.Sun /> : <Icons.Moon />}
          active={false}
          isDark={isDark}
          onClick={toggleTheme}
          title="Toggle light / dark mode"
        />
      </div>

    </div>
  )
}