import { useEffect, useRef } from 'react'
import { useProjectStore } from '../store/projectStore'

/**
 * Watches for project/layout changes and restores autosave on mount.
 */
export const useAutoSave = () => {
  const project       = useProjectStore((s) => s.project)
  const diagramLayout = useProjectStore((s) => s.diagramLayout)
  const loadAutosave  = useProjectStore((s) => s.loadAutosave)
  const autoSave      = useProjectStore((s) => s.autoSave)

  // ── Restore on mount ──────────────────────────────────────────────────────
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    if (!project) {
      loadAutosave()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save on change ────────────────────────────────────────────────────────
  // We skip the very first render to avoid a redundant write on mount.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (project) autoSave()
  }, [project, diagramLayout]) // eslint-disable-line react-hooks/exhaustive-deps
}