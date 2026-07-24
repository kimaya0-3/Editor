// ─── AppShell.tsx ─────────────────────────────────────────────────────────────

import { useCallback }       from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Toolbar }           from '../Toolbar/Toolbar'
import { EditorPanel }       from '../Editor/EditorPanel'
import { SidePanel }         from '../SidePanel/SidePanel'
import { Canvas }            from '../Canvas/Canvas'
import { LegendTooltip }     from '../Canvas/LegendTooltip'
import { useProjectStore }   from '../../store/projectStore'

export const AppShell = () => {
  const theme               = useProjectStore((s) => s.theme)
  const project             = useProjectStore((s) => s.project)
  const batchClearUserMoved = useProjectStore((s) => s.batchClearUserMoved)
  const isDark              = theme === 'dark'

  const handleLayoutChange = useCallback(() => {
    if (!project) return
    batchClearUserMoved()
  }, [project, batchClearUserMoved])

  return (
    <ReactFlowProvider>
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        width:         '100%',
        height:        '100dvh',
        overflow:      'hidden',
        background:    isDark ? '#030712' : '#f8fafc',
        boxSizing:     'border-box',
      }}>

        {/* ── Top Toolbar ─────────────────────────────────────────────── */}
        <Toolbar onLayoutChange={handleLayoutChange} />

        {/* ── Main content area ────────────────────────────────────────── */}
        <div style={{
          display:  'flex',
          flex:     1,
          overflow: 'hidden',
          minHeight: 0,       // ← critical: lets flex children shrink below content size
        }}>

          <EditorPanel width={300} />

          <div style={{
            flex:     1,
            overflow: 'hidden',
            position: 'relative',
            minWidth: 0,      // ← critical: prevents flex child from overflowing
          }}>
            <Canvas />
          </div>

          <SidePanel />

        </div>

      </div>

      {/* ── Floating legend tooltip ──────────────────────────────────────── */}
      <LegendTooltip isDark={isDark} />

    </ReactFlowProvider>
  )
}