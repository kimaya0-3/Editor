import type { DragEvent, ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { useProjectStore } from '../../store/projectStore'

export const FileUpload = () => {
  const loadProject = useProjectStore((state) => state.loadProject)
  const isLoading = useProjectStore((state) => state.isLoading)
  const error = useProjectStore((state) => state.error)

  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // ── Drag Events ─────────────────────────────────────────────────────────────

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      loadProject(file)
    }
  }

  // ── Click to Browse ──────────────────────────────────────────────────────────

  const handleClick = () => inputRef.current?.click()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadProject(file)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-6 w-full max-w-lg px-4">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">TRA-X Visualizer</h1>
          <p className="text-gray-400 mt-2">Load a CoreTrax JSON file to get started</p>
        </div>

        {/* Drop Zone */}
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full rounded-2xl border-2 border-dashed p-12
            flex flex-col items-center justify-center gap-4
            cursor-pointer transition-all duration-200
            ${isDragging
              ? 'border-blue-400 bg-blue-950 scale-105'
              : 'border-gray-600 bg-gray-900 hover:border-gray-400 hover:bg-gray-800'
            }
          `}
        >
          {/* Icon */}
          <div className="text-5xl">
            {isLoading ? '⏳' : isDragging ? '📂' : '📁'}
          </div>

          {/* Text */}
          <div className="text-center">
            {isLoading ? (
              <p className="text-blue-400 font-medium">Loading your file...</p>
            ) : (
              <>
                <p className="text-white font-medium">
                  Drop your JSON file here
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  or click to browse
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full rounded-xl bg-red-950 border border-red-700 px-4 py-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}