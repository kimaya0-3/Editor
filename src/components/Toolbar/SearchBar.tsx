import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal }    from 'react-dom'
import { useReactFlow }    from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'
import type {
  TraxSecurityZone,
  TraxSWComponent,
  TraxLogicalInterface,
  TraxInterSWCommunication,
  TraxZoneCommunication,
} from '../../types/index.ts'
import { SoftwareAttackSurfaceType } from '../../types/index.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultKind = 'zone' | 'component' | 'interface' | 'communication'

interface SearchResult {
  id:              string
  kind:            ResultKind
  label:           string
  subLabel:        string
  nodeId:          string
  componentId?:    string
  surfaceType?:    string
  commKind?:       'inter' | 'zone'   // which flavour of communication
  sourceNodeId?:   string             // for panning — pan to source node
  targetNodeId?:   string             // for panning — pan to target node
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KIND_ORDER: ResultKind[] = ['zone', 'component', 'interface', 'communication']

const KIND_META: Record<ResultKind, {
  label:     string
  color:     string
  bg:        string
  darkBg:    string
  darkColor: string
}> = {
  zone: {
    label:     'Zones',
    color:     '#1d4ed8',
    bg:        '#dbeafe',
    darkBg:    '#1e3a5f',
    darkColor: '#60a5fa',
  },
  component: {
    label:     'Components',
    color:     '#16a34a',
    bg:        '#dcfce7',
    darkBg:    '#1e3a2f',
    darkColor: '#4ade80',
  },
  interface: {
    label:     'Interfaces',
    color:     '#7c3aed',
    bg:        '#ede9fe',
    darkBg:    '#2e1065',
    darkColor: '#a78bfa',
  },
  communication: {
    label:     'Communications',
    color:     '#b45309',
    bg:        '#fef3c7',
    darkBg:    '#3b2000',
    darkColor: '#fbbf24',
  },
}

const SURFACE_COLOR: Record<string, string> = {
  [SoftwareAttackSurfaceType.NetworkInterfaceAPI]:             '#3b82f6',
  [SoftwareAttackSurfaceType.UserInterfaceOverNetwork]:        '#8b5cf6',
  [SoftwareAttackSurfaceType.UserInterfaceFromProximity]:      '#f59e0b',
  [SoftwareAttackSurfaceType.TechnicalInterfaceFromProximity]: '#10b981',
  [SoftwareAttackSurfaceType.DependencyOnHost]:                '#ef4444',
  [SoftwareAttackSurfaceType.Undetermined]:                    '#94a3b8',
}

// ─── Highlight ────────────────────────────────────────────────────────────────

const Highlight = ({
  text, query, isDark,
}: {
  text: string; query: string; isDark: boolean
}) => {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{
        background:   isDark ? '#854d0e' : '#fef08a',
        color:        isDark ? '#fde68a' : '#713f12',
        borderRadius: '2px',
        padding:      '0 1px',
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

export const SearchBar = () => {
  const project              = useProjectStore((s) => s.project)
  const theme                = useProjectStore((s) => s.theme)
  const selectZone           = useProjectStore((s) => s.selectZone)
  const selectComponent      = useProjectStore((s) => s.selectComponent)
  const selectCommunication  = useProjectStore((s) => s.selectCommunication)
  const isDark               = theme === 'dark'

  const { setCenter, getZoom, getNodes } = useReactFlow()

  const [query,       setQuery]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [focused,     setFocused]     = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const [dropdownPos, setDropdownPos] = useState({
    top:   0,
    left:  0,
    width: 280,
  })

  const wrapperRef  = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const itemRefs    = useRef<(HTMLButtonElement | null)[]>([])

  // ── Recalculate dropdown position whenever it opens ───────────────────────
  useEffect(() => {
    if (!open) return

    const update = () => {
      if (!inputRef.current) return
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPos({
        top:   rect.bottom + 6,
        left:  rect.left,
        width: rect.width,
      })
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  // ── Build search index ─────────────────────────────────────────────────────
  const results: SearchResult[] = (() => {
    if (!project || !query.trim()) return []
    const q   = query.toLowerCase().trim()
    const out: SearchResult[] = []

    // ── Zones ──────────────────────────────────────────────────────────────
    for (const zone of (project.SecurityZones ?? []) as TraxSecurityZone[]) {
      const name = zone.name    ?? ''
      const id   = zone.zone_id ?? ''
      if (name.toLowerCase().includes(q) || id.toLowerCase().includes(q)) {
        const parentInfo = zone.SecurityZone?.zone_id
          ? ` · ${zone.SecurityZone.zone_id}` : ''
        out.push({
          id, kind: 'zone', label: name || id,
          subLabel: `${id}${parentInfo}`, nodeId: id,
        })
      }

      // ── Zone Communications (nested inside each zone) ───────────────────
      for (const comm of (zone.ZoneCommunications ?? []) as TraxZoneCommunication[]) {
        const commName = comm.name             ?? ''
        const commId   = comm.communication_id ?? ''
        if (commName.toLowerCase().includes(q) || commId.toLowerCase().includes(q)) {
          const sourceZoneId = comm.SourceZone?.zone_id ?? zone.zone_id
          const targetZoneId = comm.TargetZone?.zone_id ?? ''
          out.push({
            id:            commId,
            kind:          'communication',
            label:         commName || commId,
            subLabel:      `${commId} · ${sourceZoneId} → ${targetZoneId}`,
            nodeId:        commId,
            commKind:      'zone',
            sourceNodeId:  sourceZoneId,
            targetNodeId:  targetZoneId,
          })
        }
      }
    }

    // ── Components + their interfaces + inter-SW communications ────────────
    for (const comp of (project.SWComponents ?? []) as TraxSWComponent[]) {
      const name   = comp.name       ?? ''
      const id     = comp.subUnit_id ?? ''
      const zoneId = comp.SecurityZone?.zone_id ?? ''

      if (name.toLowerCase().includes(q) || id.toLowerCase().includes(q)) {
        out.push({
          id, kind: 'component', label: name || id,
          subLabel: `${id} · ${zoneId}`, nodeId: id,
        })
      }

      // ── Logical Interfaces ──────────────────────────────────────────────
      for (const iface of (comp.LogicalInterfaces ?? []) as TraxLogicalInterface[]) {
        const ifName = iface.name         ?? ''
        const ifId   = iface.interface_id ?? ''
        if (ifName.toLowerCase().includes(q) || ifId.toLowerCase().includes(q)) {
          out.push({
            id: ifId, kind: 'interface', label: ifName || ifId,
            subLabel: `${ifId} · ${name || id}`,
            nodeId: id, componentId: id,
            surfaceType: iface.softwareAttackSurfaceType,
          })
        }
      }

      // ── Inter-SW Communications ─────────────────────────────────────────
      for (const comm of (comp.InterSWCommunications ?? []) as TraxInterSWCommunication[]) {
        const commName = comm.name             ?? ''
        const commId   = comm.communication_id ?? ''
        if (commName.toLowerCase().includes(q) || commId.toLowerCase().includes(q)) {
          const sourceId = comp.subUnit_id
          // Resolve target component by matching the TargetInterface interface_id
          const targetComp = project.SWComponents.find((c) =>
            c.LogicalInterfaces?.some(
              (i) => i.interface_id === comm.TargetInterface.interface_id
            )
          )
          const targetId = targetComp?.subUnit_id ?? ''
          out.push({
            id:           commId,
            kind:         'communication',
            label:        commName || commId,
            subLabel:     `${commId} · ${name || sourceId} → ${targetComp?.name || targetId}`,
            nodeId:       commId,
            commKind:     'inter',
            sourceNodeId: sourceId,
            targetNodeId: targetId,
          })
        }
      }
    }

    return out
  })()

  const grouped = KIND_ORDER
    .map((kind) => ({ kind, items: results.filter((r) => r.kind === kind) }))
    .filter((g) => g.items.length > 0)

  const flatResults = grouped.flatMap((g) => g.items)

  const getParentId = (node: unknown): string | undefined => {
    if (!node || typeof node !== 'object') return undefined
    const rec = node as Record<string, unknown>
    if (typeof rec.parentId === 'string') return rec.parentId
    if (typeof rec.parentNode === 'string') return rec.parentNode
    return undefined
  }

  // ── Navigate to result ─────────────────────────────────────────────────────
  const navigateTo = useCallback((result: SearchResult) => {
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.blur()

    if (result.kind === 'zone') {
      selectZone(result.id)
    } else if (result.kind === 'communication') {
      // Select the communication edge by its ID
      selectCommunication(result.id)
    } else {
      selectComponent(result.componentId ?? result.id)
    }

    setTimeout(() => {
      const allNodes = getNodes()

      // ── Communications: pan to midpoint between source and target nodes ──
      if (result.kind === 'communication' && result.sourceNodeId && result.targetNodeId) {
        const sourceNode = allNodes.find((n) => n.id === result.sourceNodeId)
        const targetNode = allNodes.find((n) => n.id === result.targetNodeId)

        if (!sourceNode && !targetNode) {
          console.warn('[SearchBar] neither source nor target node found for comm', result.id)
          return
        }

        const getAbsPos = (nodeId: string) => {
          const node = allNodes.find((n) => n.id === nodeId)
          if (!node) return null
          let x        = node.position.x
          let y        = node.position.y
          let parentId = getParentId(node)
          while (parentId) {
            const parent = allNodes.find((n) => n.id === parentId)
            if (!parent) break
            x       += parent.position.x
            y       += parent.position.y
            parentId = getParentId(parent)
          }
          const w = node.measured?.width  ?? node.width  ?? 220
          const h = node.measured?.height ?? node.height ?? 100
          return { cx: x + w / 2, cy: y + h / 2 }
        }

        const srcPos = result.sourceNodeId ? getAbsPos(result.sourceNodeId) : null
        const tgtPos = result.targetNodeId ? getAbsPos(result.targetNodeId) : null

        // Pan to midpoint if both found, otherwise whichever is available
        const panX = srcPos && tgtPos
          ? (srcPos.cx + tgtPos.cx) / 2
          : (srcPos?.cx ?? tgtPos?.cx ?? 0)
        const panY = srcPos && tgtPos
          ? (srcPos.cy + tgtPos.cy) / 2
          : (srcPos?.cy ?? tgtPos?.cy ?? 0)

        setCenter(panX, panY, { zoom: Math.max(getZoom(), 1.2), duration: 600 })
        return
      }

      // ── All other kinds: pan to the node directly ────────────────────────
      const rfNode = allNodes.find((n) => n.id === result.nodeId)
      if (!rfNode) {
        console.warn('[SearchBar] node not found:', result.nodeId)
        return
      }

      let absX     = rfNode.position.x
      let absY     = rfNode.position.y
      let parentId = getParentId(rfNode)

      while (parentId) {
        const parent = allNodes.find((n) => n.id === parentId)
        if (!parent) break
        absX    += parent.position.x
        absY    += parent.position.y
        parentId = getParentId(parent)
      }

      const w  = rfNode.measured?.width  ?? rfNode.width  ?? 220
      const h  = rfNode.measured?.height ?? rfNode.height ?? 100
      const cx = absX + w / 2
      const cy = absY + h / 2

      setCenter(cx, cy, { zoom: Math.max(getZoom(), 1.2), duration: 600 })
    }, 80)
  }, [selectZone, selectComponent, selectCommunication, setCenter, getZoom, getNodes])

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || flatResults.length === 0) {
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
      return
    }
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setActiveIndex((i) => {
          const next = Math.min(i + 1, flatResults.length - 1)
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest' })
          return next
        })
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        setActiveIndex((i) => {
          const next = Math.max(i - 1, 0)
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest' })
          return next
        })
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (activeIndex >= 0 && flatResults[activeIndex]) {
          navigateTo(flatResults[activeIndex])
        }
        break
      }
      case 'Escape': {
        setOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
        break
      }
    }
  }

  // ── Outside-click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target         = e.target as Node
      const insideWrapper  = wrapperRef.current?.contains(target)  ?? false
      const insideDropdown = dropdownRef.current?.contains(target) ?? false
      if (!insideWrapper && !insideDropdown) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const bg          = isDark ? '#111827' : '#ffffff'
  const border      = isDark ? '#1e293b' : '#e2e8f0'
  const borderFocus = '#3b82f6'
  const textPrimary = isDark ? '#e2e8f0' : '#0f172a'
  const textMuted   = isDark ? '#475569' : '#94a3b8'
  const dropBg      = isDark ? '#0f172a' : '#ffffff'
  const dropBorder  = isDark ? '#1e293b' : '#e2e8f0'
  const activeBg    = isDark ? '#1e3a5f' : '#eff6ff'

  const showDropdown = open && query.trim().length > 0
  let flatIdx = -1

  // ── Dropdown content ──────────────────────────────────────────────────────
  const dropdownContent = showDropdown ? createPortal(
    <div
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position:       'fixed',
        top:            dropdownPos.top,
        left:           dropdownPos.left,
        width:          dropdownPos.width,
        background:     dropBg,
        border:         `1px solid ${dropBorder}`,
        borderRadius:   '10px',
        boxShadow:      isDark
          ? '0 8px 32px rgba(0,0,0,0.6)'
          : '0 8px 32px rgba(0,0,0,0.12)',
        zIndex:         999999,
        maxHeight:      '400px',
        overflowY:      'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: `${isDark ? '#334155' : '#cbd5e1'} transparent`,
      } as React.CSSProperties}
    >
      {results.length === 0 ? (

        /* ── No results ───────────────────────────────────────────────────── */
        <div style={{
          padding: '28px 16px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="14" cy="14" r="9"
              stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5"/>
            <path d="M21 21L27 27"
              stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M11 14h6M14 11v6"
              stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
              No results
            </div>
            <div style={{ fontSize: '12px', color: textMuted }}>
              Nothing matched <strong>"{query}"</strong>
            </div>
          </div>
        </div>

      ) : (

        /* ── Grouped results ──────────────────────────────────────────────── */
        <div style={{ padding: '6px' }}>
          {grouped.map((group, gIdx) => {
            const meta = KIND_META[group.kind]
            return (
              <div key={group.kind}>

                {/* Group header */}
                <div style={{ padding: '8px 10px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.6px',
                    textTransform: 'uppercase', padding: '2px 7px', borderRadius: '999px',
                    background: isDark ? meta.darkBg    : meta.bg,
                    color:      isDark ? meta.darkColor : meta.color,
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '11px', color: isDark ? '#334155' : '#cbd5e1' }}>
                    {group.items.length}
                  </span>
                </div>

                {/* Items */}
                {group.items.map((result) => {
                  flatIdx++
                  const thisIdx  = flatIdx
                  const isActive = activeIndex === thisIdx

                  // Dot color logic
                  const meta2    = KIND_META[result.kind]
                  const dotColor = result.kind === 'interface' && result.surfaceType
                    ? (SURFACE_COLOR[result.surfaceType] ?? meta2.darkColor)
                    : (isDark ? meta2.darkColor : meta2.color)

                  // Communication sub-label icon (→ arrow between source/target)
                  const isComm = result.kind === 'communication'

                  return (
                    <button
                      key={result.id}
                      ref={(el) => { itemRefs.current[thisIdx] = el }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigateTo(result)
                      }}
                      onMouseEnter={() => setActiveIndex(thisIdx)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: '10px', padding: '8px 10px', borderRadius: '7px',
                        border: 'none', background: isActive ? activeBg : 'transparent',
                        cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                      }}
                    >
                      {/* Dot / icon */}
                      {isComm ? (
                        /* Communication: small edge icon instead of dot */
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                          style={{ flexShrink: 0 }}>
                          <circle cx="2.5" cy="7" r="2"
                            fill={dotColor} opacity={0.8}/>
                          <line x1="4.5" y1="7" x2="9.5" y2="7"
                            stroke={dotColor} strokeWidth="1.3"
                            strokeDasharray="2 1.5"/>
                          <circle cx="11.5" cy="7" r="2"
                            fill={dotColor} opacity={0.8}/>
                        </svg>
                      ) : (
                        <div style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          flexShrink: 0, background: dotColor,
                        }} />
                      )}

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: 600, color: textPrimary,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          <Highlight text={result.label} query={query} isDark={isDark} />
                        </div>
                        <div style={{
                          fontSize: '11px', color: textMuted, fontFamily: 'monospace',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          <Highlight text={result.subLabel} query={query} isDark={isDark} />
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                        style={{
                          flexShrink: 0,
                          color: isActive
                            ? (isDark ? '#60a5fa' : '#3b82f6')
                            : (isDark ? '#334155' : '#cbd5e1'),
                          transition: 'color 0.1s',
                        }}
                      >
                        <path d="M2 6h8M7 3l3 3-3 3"
                          stroke="currentColor" strokeWidth="1.4"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )
                })}

                {/* Divider between groups */}
                {gIdx < grouped.length - 1 && (
                  <div style={{
                    height: '1px', background: isDark ? '#1e293b' : '#f1f5f9', margin: '4px 0',
                  }} />
                )}
              </div>
            )
          })}

          {/* Keyboard hint footer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px 10px 4px',
            borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
            marginTop: '4px',
          }}>
            <KbdHint isDark={isDark} keys={['↑', '↓']} label="navigate" />
            <KbdHint isDark={isDark} keys={['↵']}      label="go to"    />
            <KbdHint isDark={isDark} keys={['Esc']}    label="close"    />
          </div>
        </div>
      )}
    </div>,
    document.body
  ) : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={wrapperRef}
        style={{ position: 'relative', width: '280px', flexShrink: 0 }}
        onMouseDown={(e) => {
          if (e.target !== inputRef.current) e.preventDefault()
        }}
      >
        {/* ── Input wrapper ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 10px', height: '34px', borderRadius: '8px',
          border:     `1px solid ${focused ? borderFocus : border}`,
          background: bg,
          boxShadow:  focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
          transition: 'border 0.15s, box-shadow 0.15s',
        }}>

          {/* Search icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ flexShrink: 0, color: focused ? '#3b82f6' : textMuted, transition: 'color 0.15s' }}
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search zones, components, interfaces…"
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(-1)
              setOpen(true)
            }}
            onFocus={() => { setFocused(true); if (query.trim()) setOpen(true) }}
            onBlur={(e) => {
              const related = e.relatedTarget as Node | null
              if (
                wrapperRef.current?.contains(related) ||
                dropdownRef.current?.contains(related)
              ) return
              setFocused(false)
            }}
            onKeyDown={onKeyDown}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: '13px', color: textPrimary,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          />

          {/* Result count badge */}
          {query.trim() && results.length > 0 && (
            <span style={{
              flexShrink: 0, fontSize: '10px', fontWeight: 600,
              padding: '1px 6px', borderRadius: '999px',
              background: isDark ? '#1e293b' : '#f1f5f9', color: textMuted,
            }}>
              {results.length}
            </span>
          )}

          {/* Clear button */}
          {query && (
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setQuery('')
                setActiveIndex(-1)
                setOpen(false)
                inputRef.current?.focus()
              }}
              style={{
                flexShrink: 0, width: '16px', height: '16px',
                borderRadius: '50%', border: 'none',
                background: isDark ? '#1e293b' : '#e2e8f0',
                color: textMuted, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: 0,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Portaled dropdown */}
      {dropdownContent}
    </>
  )
}

// ─── KbdHint ──────────────────────────────────────────────────────────────────

const KbdHint = ({ isDark, keys, label }: { isDark: boolean; keys: string[]; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
    {keys.map((k) => (
      <kbd key={k} style={{
        fontSize: '10px', padding: '1px 5px', borderRadius: '4px',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        background: isDark ? '#1e293b' : '#f8fafc',
        color: isDark ? '#64748b' : '#94a3b8', fontFamily: 'monospace',
      }}>
        {k}
      </kbd>
    ))}
    <span style={{ fontSize: '10px', color: isDark ? '#475569' : '#94a3b8' }}>
      {label}
    </span>
  </div>
)