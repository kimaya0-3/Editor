import { useEffect, useRef, useState } from 'react'
import { AppShell }        from './components/AppShell/AppShell'
import { useProjectStore } from './store/projectStore'

// ─── FileLoader ───────────────────────────────────────────────────────────────

const FileLoader = () => {
  const loadProject = useProjectStore((s) => s.loadProject)
  const newProject  = useProjectStore((s) => s.newProject)
  const isLoading   = useProjectStore((s) => s.isLoading)
  const error       = useProjectStore((s) => s.error)
  const theme       = useProjectStore((s) => s.theme)
  const isDark      = theme === 'dark'

  const bg          = isDark ? '#030712' : '#f8fafc'
  const cardBg      = isDark ? '#0f172a' : '#ffffff'
  const border      = isDark ? '#1e293b' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textMuted   = isDark ? '#64748b' : '#94a3b8'
  const panelBg     = isDark ? '#0a1628' : '#f0f6ff'
  const panelBorder = isDark ? '#1e3a5f' : '#bfdbfe'

  // ── State ──────────────────────────────────────────────────────────────────
  // null  = no JSON chosen yet (initial state)
  // File  = JSON chosen, waiting for layout decision
  const [pendingJson,   setPendingJson]   = useState<File | null>(null)
  const [layoutFile,    setLayoutFile]    = useState<File | null>(null)
  const [layoutDragging, setLayoutDragging] = useState(false)

  const jsonInputRef   = useRef<HTMLInputElement>(null)
  const layoutInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleJsonChosen = (file: File) => {
    setPendingJson(file)
    setLayoutFile(null)
  }

  const handleLayoutChosen = (file: File) => {
    setLayoutFile(file)
  }

  const handleLoad = () => {
    if (!pendingJson) return
    loadProject(pendingJson, layoutFile ?? undefined)
  }

  const handleCancel = () => {
    setPendingJson(null)
    setLayoutFile(null)
    // Reset file inputs so the same file can be re-selected
    if (jsonInputRef.current)   jsonInputRef.current.value   = ''
    if (layoutInputRef.current) layoutInputRef.current.value = ''
  }

  // Layout drop zone
  const handleLayoutDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setLayoutDragging(true)
  }
  const handleLayoutDragLeave = () => setLayoutDragging(false)
  const handleLayoutDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setLayoutDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleLayoutChosen(file)
  }

  // ── Card shared style ──────────────────────────────────────────────────────

  const cardStyle = (hovered: boolean): React.CSSProperties => ({
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '10px',
    width:          '180px',
    padding:        '28px 20px',
    borderRadius:   '12px',
    background:     cardBg,
    border:         `1px solid ${hovered ? '#3b82f6' : border}`,
    boxShadow:      hovered ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
    color:          textPrimary,
    cursor:         'pointer',
    transition:     'border-color 0.15s, box-shadow 0.15s',
  })

  // ── Hover state for cards ──────────────────────────────────────────────────
  const [newHovered,  setNewHovered]  = useState(false)
  const [openHovered, setOpenHovered] = useState(false)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      width:          '100vw',
      height:         '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      background:     bg,
      fontFamily:     'sans-serif',
      gap:            '32px',
    }}>

      {/* ── Brand ── */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>
          TRA-X <span style={{ color: '#3b82f6' }}>Editor</span>
        </div>
        <div style={{ fontSize: '14px', color: textMuted }}>
          {pendingJson
            ? 'Optionally attach a layout file, then click Load'
            : 'Start a new project or open an existing TRA-X JSON file'
          }
        </div>
      </div>

      {/* ── Step 1 — Action cards (always visible) ── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>

        {/* New Project */}
        <button
          onClick={newProject}
          style={cardStyle(newHovered)}
          onMouseEnter={() => setNewHovered(true)}
          onMouseLeave={() => setNewHovered(false)}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9"  y1="14" x2="15" y2="14"/>
          </svg>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>New Project</div>
          <div style={{ fontSize: '12px', color: textMuted, textAlign: 'center', lineHeight: 1.4 }}>
            Start with a blank canvas
          </div>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', background: border, margin: '8px 0' }} />

        {/* Open Project — picks the JSON */}
        <label
          style={cardStyle(openHovered)}
          onMouseEnter={() => setOpenHovered(true)}
          onMouseLeave={() => setOpenHovered(false)}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke={pendingJson ? '#22c55e' : '#3b82f6'}
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {pendingJson ? (
              // Checkmark when JSON is chosen
              <>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <polyline points="9 12 11 14 15 10"/>
              </>
            ) : (
              // Upload folder icon
              <>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <line x1="12" y1="11" x2="12" y2="17"/>
                <polyline points="9 14 12 11 15 14"/>
              </>
            )}
          </svg>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {pendingJson ? 'JSON Selected ✓' : 'Open Project'}
          </div>
          <div style={{
            fontSize:   '12px',
            color:      pendingJson ? '#22c55e' : textMuted,
            textAlign:  'center',
            lineHeight: 1.4,
            maxWidth:   '140px',
            overflow:   'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {pendingJson ? pendingJson.name : 'Load a TRA-X JSON file'}
          </div>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleJsonChosen(file)
            }}
          />
        </label>
      </div>

      {/* ── Step 2 — Layout sidecar panel (appears after JSON is chosen) ── */}
      {pendingJson && (
        <div style={{
          width:        '400px',
          borderRadius: '12px',
          background:   panelBg,
          border:       `1px solid ${panelBorder}`,
          padding:      '20px 24px',
          display:      'flex',
          flexDirection:'column',
          gap:          '14px',
        }}>

          {/* Panel header */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
              Attach a layout file{' '}
              <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span>
            </div>
            <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.5 }}>
              Drop a <code style={{ fontSize: '11px', background: isDark ? '#1e293b' : '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>.layout.json</code> file
              to restore saved node positions and canvas settings.
            </div>
          </div>

          {/* Layout drop zone */}
          <div
            onClick={() => layoutInputRef.current?.click()}
            onDragOver={handleLayoutDragOver}
            onDragLeave={handleLayoutDragLeave}
            onDrop={handleLayoutDrop}
            style={{
              borderRadius:   '8px',
              border:         `2px dashed ${layoutDragging ? '#3b82f6' : layoutFile ? '#22c55e' : (isDark ? '#334155' : '#cbd5e1')}`,
              background:     layoutDragging
                                ? (isDark ? '#0f2040' : '#eff6ff')
                                : layoutFile
                                  ? (isDark ? '#052e16' : '#f0fdf4')
                                  : 'transparent',
              padding:        '16px',
              display:        'flex',
              alignItems:     'center',
              gap:            '12px',
              cursor:         'pointer',
              transition:     'all 0.15s',
            }}
          >
            {/* Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke={layoutFile ? '#22c55e' : layoutDragging ? '#3b82f6' : textMuted}
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {layoutFile ? (
                // Check circle
                <>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="9 12 11 14 15 10"/>
                </>
              ) : (
                // Upload icon
                <>
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </>
              )}
            </svg>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {layoutFile ? (
                <>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>
                    Layout attached ✓
                  </div>
                  <div style={{
                    fontSize:     '12px',
                    color:        textMuted,
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                  }}>
                    {layoutFile.name}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>
                    {layoutDragging ? 'Drop it!' : 'Drop layout file or click to browse'}
                  </div>
                  <div style={{ fontSize: '12px', color: textMuted }}>
                    Accepts <code style={{ fontSize: '11px' }}>.json</code> layout files
                  </div>
                </>
              )}
            </div>

            {/* Clear button */}
            {layoutFile && (
              <button
                onClick={(e) => { e.stopPropagation(); setLayoutFile(null) }}
                style={{
                  background:   'none',
                  border:       'none',
                  cursor:       'pointer',
                  color:        textMuted,
                  fontSize:     '16px',
                  lineHeight:   1,
                  padding:      '2px 4px',
                  borderRadius: '4px',
                }}
                title="Remove layout file"
              >
                ✕
              </button>
            )}
          </div>

          {/* Hidden layout input */}
          <input
            ref={layoutInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleLayoutChosen(file)
              // Reset so same file can be re-selected
              if (layoutInputRef.current) layoutInputRef.current.value = ''
            }}
          />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>

            {/* Cancel */}
            <button
              onClick={handleCancel}
              style={{
                padding:      '8px 16px',
                borderRadius: '8px',
                border:       `1px solid ${border}`,
                background:   'transparent',
                color:        textMuted,
                fontSize:     '13px',
                cursor:       'pointer',
                transition:   'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
            >
              Cancel
            </button>

            {/* Load */}
            <button
              onClick={handleLoad}
              disabled={isLoading}
              style={{
                padding:      '8px 20px',
                borderRadius: '8px',
                border:       'none',
                background:   isLoading ? '#1e40af' : '#3b82f6',
                color:        '#ffffff',
                fontSize:     '13px',
                fontWeight:   600,
                cursor:       isLoading ? 'not-allowed' : 'pointer',
                transition:   'background 0.15s',
                opacity:      isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!isLoading) (e.currentTarget.style.background = '#2563eb') }}
              onMouseLeave={(e) => { if (!isLoading) (e.currentTarget.style.background = '#3b82f6') }}
            >
              {isLoading
                ? 'Loading…'
                : layoutFile
                  ? 'Load with Layout'
                  : 'Load without Layout'
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Status messages ── */}
      {isLoading && !pendingJson && (
        <div style={{ color: isDark ? '#60a5fa' : '#2563eb', fontSize: '13px' }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{
          color:        '#ef4444',
          fontSize:     '13px',
          maxWidth:     '400px',
          textAlign:    'center',
          padding:      '12px',
          borderRadius: '8px',
          background:   isDark ? '#450a0a' : '#fee2e2',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ─── AutoSaveProvider ─────────────────────────────────────────────────────────

const AutoSaveProvider = () => {
  const project       = useProjectStore((s) => s.project)
  const diagramLayout = useProjectStore((s) => s.diagramLayout)
  const loadAutosave  = useProjectStore((s) => s.loadAutosave)
  const autoSave      = useProjectStore((s) => s.autoSave)

  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    if (!project) loadAutosave()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (project) autoSave()
  }, [project, diagramLayout]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const project = useProjectStore((s) => s.project)

  return (
    <>
      <AutoSaveProvider />
      {project ? <AppShell /> : <FileLoader />}
    </>
  )
}