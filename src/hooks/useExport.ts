import { useCallback }     from 'react'
import { useProjectStore } from '../store/projectStore'
import { toPng, toJpeg }   from 'html-to-image'

export const useExport = () => {
  const storeExportJson     = useProjectStore((s) => s.exportJson)
  const storeExportTraxJson = useProjectStore((s) => s.exportTraxJson)
  const project             = useProjectStore((s) => s.project)
  const theme               = useProjectStore((s) => s.theme)

  // ── Full export (project + layout sidecar) — Toolbar ─────────────────────
  const exportJson = useCallback(() => {
    storeExportJson()
  }, [storeExportJson])

  // ── TRAX-only export (project JSON only) — Editor Panel ──────────────────
  const exportTraxJson = useCallback(() => {
    storeExportTraxJson()
  }, [storeExportTraxJson])

  // ── Image export ──────────────────────────────────────────────────────────
  const exportImage = useCallback(async (format: 'png' | 'jpeg') => {
    const viewport = document.querySelector<HTMLElement>('.react-flow__viewport')
    if (!viewport) {
      console.warn('[useExport] Could not find React Flow viewport element')
      return
    }

    const bgColor     = theme === 'dark' ? '#0f172a' : '#f8fafc'
    const projectName = project?.Project?.TRAProjectName ?? 'trax-diagram'
    const fileName    = `${projectName}.${format}`

    try {
      const dataUrl = format === 'png'
        ? await toPng(viewport,  { cacheBust: true, backgroundColor: bgColor })
        : await toJpeg(viewport, { cacheBust: true, backgroundColor: bgColor, quality: 0.95 })

      const link    = document.createElement('a')
      link.href     = dataUrl
      link.download = fileName
      link.click()
    } catch (e) {
      console.error('[useExport] Image export failed:', e)
    }
  }, [project, theme])

  return { exportJson, exportTraxJson, exportImage }
}