// src/components/Editor/EditorPanel.tsx

import React, { useCallback, useState } from 'react'
import { useProjectStore }    from '../../store/projectStore'
import { EntityPalette }      from '../Editor/EntityPalette'
import { ZoneEditor }         from '../Editor/ZoneEditor'
import { ComponentEditor }    from '../Editor/ComponentEditor'
import { EdgeEditor }         from '../Editor/EdgeEditor'
import { useUndoRedo }        from '../../hooks/useUndoRedo'
import { useCanUndo, useCanRedo } from '../../store/projectStore'
import {
  useSelectedZone,
  useSelectedComponent,
  useSelectedCommunication,
} from '../../store/projectStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditorPanelProps {
  width?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLAPSED_WIDTH = 40

// ─── Token helper ─────────────────────────────────────────────────────────────

const tk = (isDark: boolean) => ({
  bg:          isDark ? '#0b1120' : '#f8fafc',
  border:      isDark ? '#1e293b' : '#e2e8f0',
  bgSubtle:    isDark ? '#111827' : '#f1f5f9',
  bgCard:      isDark ? '#1e293b' : '#f1f5f9',
  textPrimary: isDark ? '#e2e8f0' : '#0f172a',
  textMuted:   isDark ? '#475569' : '#94a3b8',
  textAccent:  isDark ? '#3b82f6' : '#2563eb',
  toggleBg:    isDark ? '#1e293b' : '#f1f5f9',
  toggleColor: isDark ? '#64748b' : '#94a3b8',
})

// ─── EditorPanel ──────────────────────────────────────────────────────────────

export const EditorPanel = ({ width = 300 }: EditorPanelProps) => {
  const theme               = useProjectStore((s) => s.theme)
  const project             = useProjectStore((s) => s.project)
  const deleteZone          = useProjectStore((s) => s.deleteZone)
  const deleteComponent     = useProjectStore((s) => s.deleteComponent)
  const deleteCommunication = useProjectStore((s) => s.deleteCommunication)
  const deleteZoneCommunication = useProjectStore((s) => s.deleteZoneCommunication)
  const clearSelection      = useProjectStore((s) => s.clearSelection)
  const selectedZoneId      = useProjectStore((s) => s.selectedZoneId)
  const selectedComponentId = useProjectStore((s) => s.selectedComponentId)
  const selectedCommId      = useProjectStore((s) => s.selectedCommunicationId)

  const zone      = useSelectedZone()
  const component = useSelectedComponent()
  const commResult = useSelectedCommunication()

  const { undo, redo } = useUndoRedo()
  const canUndo        = useCanUndo()
  const canRedo        = useCanRedo()

  const isDark       = theme === 'dark'
  const tokens       = tk(isDark)
  const [collapsed, setCollapsed] = useState(false)
  const hasSelection  = !!(zone || component || commResult)
  const selectionKind = zone ? 'Zone' : component ? 'Component' : commResult ? 'Communication' : null

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (selectedZoneId)      { deleteZone(selectedZoneId);           clearSelection(); return }
    if (selectedComponentId) { deleteComponent(selectedComponentId); clearSelection(); return }
    if (selectedCommId) {
      if (commResult?.kind === 'zone') {
        deleteZoneCommunication(selectedCommId)
      } else {
        deleteCommunication(selectedCommId)
      }
      clearSelection()
      return
    }
  }, [
    selectedZoneId, selectedComponentId, selectedCommId, commResult,
    deleteZone, deleteComponent, deleteCommunication, deleteZoneCommunication,
    clearSelection,
  ])

  if (!project) return null

  return (
    <div style={{
      width:         collapsed ? `${COLLAPSED_WIDTH}px` : `${width}px`,
      height:        '100%',
      background:    tokens.bg,
      borderRight:   `1px solid ${tokens.border}`,
      display:       'flex',
      flexDirection: 'column',
      flexShrink:    0,
      overflow:      'hidden',
      transition:    'width 0.2s ease',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding:        collapsed ? '12px 0' : '12px 14px',
        borderBottom:   `1px solid ${tokens.border}`,
        flexShrink:     0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap:            '8px',
        background:     isDark
          ? 'linear-gradient(180deg, rgba(59,130,246,0.05) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(59,130,246,0.03) 0%, transparent 100%)',
      }}>

        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width:        '3px',
              height:       '16px',
              borderRadius: '2px',
              background:   tokens.textAccent,
              flexShrink:   0,
            }} />

            <span style={{
              fontSize:      '11px',
              fontWeight:    700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color:         tokens.textAccent,
              whiteSpace:    'nowrap',
            }}>
              Editor
            </span>

            {hasSelection && selectionKind && (
              <span style={{
                fontSize:     '10px',
                fontWeight:   600,
                padding:      '2px 8px',
                borderRadius: '999px',
                background:   isDark ? '#1e293b' : '#e2e8f0',
                color:        tokens.textMuted,
                whiteSpace:   'nowrap',
              }}>
                {selectionKind} selected
              </span>
            )}
          </div>
        )}

        <ToggleButton
          collapsed={collapsed}
          isDark={isDark}
          onClick={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        overflowY:      'auto',
        overflowX:      'hidden',
        display:        'flex',
        flexDirection:  'column',
        visibility:     collapsed ? 'hidden' : 'visible',
        opacity:        collapsed ? 0 : 1,
        transition:     'opacity 0.15s',
        scrollbarWidth: 'thin',
        scrollbarColor: `${isDark ? '#334155' : '#cbd5e1'} transparent`,
      } as React.CSSProperties}>

        <EntityPalette isDark={isDark} />

        {hasSelection && (
          <div style={{
            height:     '1px',
            background: tokens.border,
            margin:     '2px 14px',
          }} />
        )}

        {zone      && <ZoneEditor      zone={zone}           isDark={isDark} />}
        {component && <ComponentEditor component={component} isDark={isDark} />}

        {/* Pass the unwrapped comm + kind to EdgeEditor */}
        {commResult && (
          <EdgeEditor
            comm={commResult.comm}
            kind={commResult.kind}
            isDark={isDark}
          />
        )}

        {!hasSelection && <EmptyState isDark={isDark} />}

      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{
        padding:       '12px 14px',
        borderTop:     `1px solid ${tokens.border}`,
        flexShrink:    0,
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
        visibility:    collapsed ? 'hidden' : 'visible',
        opacity:       collapsed ? 0 : 1,
        transition:    'opacity 0.15s',
      }}>

        {hasSelection && selectionKind && (
          <>
            <FooterButton
              variant="danger"
              isDark={isDark}
              onClick={handleDelete}
              icon={
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M2 3h9M5 3V2h3v1M4 3v7a1 1 0 001 1h3a1 1 0 001-1V3"
                    stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              }
            >
              Delete {selectionKind}
            </FooterButton>
            <div style={{ height: '1px', background: tokens.border, margin: '2px 0' }} />
          </>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <UndoRedoButton
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            isDark={isDark}
            icon={
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 5h6a3 3 0 010 6H5M2 5l3-3M2 5l3 3"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            }
          >
            Undo
          </UndoRedoButton>

          <UndoRedoButton
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            isDark={isDark}
            icon={
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M11 5H5a3 3 0 000 6h3M11 5l-3-3M11 5l-3 3"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            }
          >
            Redo
          </UndoRedoButton>
        </div>

      </div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyState = ({ isDark }: { isDark: boolean }) => (
  <div style={{
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '32px 24px',
    gap:            '16px',
    textAlign:      'center',
  }}>
    <div style={{
      width:          '48px',
      height:         '48px',
      borderRadius:   '12px',
      background:     isDark ? '#111827' : '#f1f5f9',
      border:         `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 2L20 6.5V15.5L11 20L2 15.5V6.5L11 2Z"
          stroke={isDark ? '#334155' : '#cbd5e1'}
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="11" cy="11" r="2"
          fill={isDark ? '#1e293b' : '#e2e8f0'}
          stroke={isDark ? '#334155' : '#cbd5e1'}
          strokeWidth="1"
        />
      </svg>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        fontSize:   '13px',
        fontWeight: 600,
        color:      isDark ? '#94a3b8' : '#64748b',
      }}>
        Nothing selected
      </div>
      <div style={{
        fontSize:   '11px',
        lineHeight: 1.6,
        color:      isDark ? '#64748b' : '#94a3b8',
        maxWidth:   '200px',
      }}>
        Select a zone, component, or edge on the canvas to edit it,
        or use the palette above to add new entities.
      </div>
    </div>
  </div>
)

// ─── ToggleButton ─────────────────────────────────────────────────────────────

const ToggleButton = ({
  collapsed, isDark, onClick,
}: {
  collapsed: boolean
  isDark:    boolean
  onClick:   () => void
}) => {
  const [hovered, setHovered] = useState(false)
  const tokens = tk(isDark)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? 'Expand editor' : 'Collapse editor'}
      aria-label={collapsed ? 'Expand editor' : 'Collapse editor'}
      style={{
        flexShrink:     0,
        width:          '24px',
        height:         '24px',
        borderRadius:   '6px',
        border:         `1px solid ${hovered ? (isDark ? '#334155' : '#cbd5e1') : tokens.border}`,
        background:     hovered ? (isDark ? '#1e293b' : '#e2e8f0') : tokens.toggleBg,
        color:          hovered ? tokens.textPrimary : tokens.toggleColor,
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        0,
        transition:     'all 0.15s ease',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        {collapsed
          ? <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
        }
      </svg>
    </button>
  )
}

// ─── UndoRedoButton ───────────────────────────────────────────────────────────

const UndoRedoButton = ({
  onClick, disabled, title, isDark, icon, children,
}: {
  onClick:   () => void
  disabled:  boolean
  title:     string
  isDark:    boolean
  icon:      React.ReactNode
  children:  React.ReactNode
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => { if (!disabled) setHovered(true) }}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex:           1,
        padding:        '7px 11px',
        borderRadius:   '7px',
        border:         `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        background:     hovered
          ? (isDark ? '#1e293b' : '#f1f5f9')
          : (isDark ? '#111827' : '#f8fafc'),
        color:          disabled
          ? (isDark ? '#1e293b' : '#e2e8f0')
          : (isDark ? '#94a3b8' : '#475569'),
        cursor:         disabled ? 'not-allowed' : 'pointer',
        fontSize:       '12px',
        fontWeight:     600,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '6px',
        opacity:        disabled ? 0.4 : 1,
        transition:     'all 0.15s ease',
        fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

// ─── FooterButton ─────────────────────────────────────────────────────────────

const FooterButton = ({
  variant, isDark, onClick, icon, children,
}: {
  variant:  'danger'
  isDark:   boolean
  onClick:  () => void
  icon:     React.ReactNode
  children: React.ReactNode
}) => {
  const [hovered, setHovered] = useState(false)

  const palette = {
    danger: {
      bg:      isDark ? '#450a0a' : '#fef2f2',
      bgHover: isDark ? '#5a0d0d' : '#fee2e2',
      color:   isDark ? '#f87171' : '#dc2626',
      border:  isDark ? '#7f1d1d' : '#fecaca',
    },
  }[variant]

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:        '100%',
        padding:      '7px 11px',
        borderRadius: '7px',
        border:       `1px solid ${palette.border}`,
        background:   hovered ? palette.bgHover : palette.bg,
        color:        palette.color,
        cursor:       'pointer',
        fontSize:     '12px',
        fontWeight:   600,
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        transition:   'all 0.15s ease',
        fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {icon}
      {children}
    </button>
  )
}