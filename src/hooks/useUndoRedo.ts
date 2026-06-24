import { useEffect } from 'react'
import { useProjectStore, useCanUndo, useCanRedo } from '../store/projectStore'

/**
 * Wires up Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z keyboard shortcuts globally.
 */
export const useUndoRedo = () => {
  const undo     = useProjectStore((s) => s.undo)
  const redo     = useProjectStore((s) => s.redo)
  const canUndo  = useCanUndo()
  const canRedo  = useCanRedo()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.target as HTMLElement)?.isContentEditable) return

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        redo()
        return
      }

      if (ctrl && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      if (ctrl && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  return { canUndo, canRedo, undo, redo }
}