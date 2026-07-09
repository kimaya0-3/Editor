import type {
  CoreTraxJson,
  TraxSecurityZone,
  TraxSWComponent,
  TraxLogicalInterface,
  TraxInterSWCommunication,
  TraxZoneCommunication,
  TraxNetworkFacingInterface,
  TraxHostLevelInterface,
  DiagramLayout,
  CanvasSettings,
  NodeLayout,
  EdgeLayout,
} from '../types/index'

import { create } from 'zustand'

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTOSAVE_KEY = 'trax_session'
const MAX_HISTORY  = 50

// ─── History Snapshot ─────────────────────────────────────────────────────────

interface HistorySnapshot {
  project:       CoreTraxJson
  diagramLayout: DiagramLayout
}

// ─── State Shape ──────────────────────────────────────────────────────────────

interface ProjectState {

  // Raw Data
  project: CoreTraxJson | null

  // Diagram Layout
  diagramLayout: DiagramLayout

  // History
  past:   HistorySnapshot[]
  future: HistorySnapshot[]

  // Canvas rebuild signal
  layoutStamp: number

  // UI State
  selectedZoneId:          string | null
  selectedComponentId:     string | null
  selectedCommunicationId: string | null
  isLoading:               boolean
  error:                   string | null
  theme:                   'light' | 'dark'

  // Editor mode
  editorMode: 'idle' | 'addZone' | 'addComponent' | 'addEdge'

  // ── Project lifecycle ──────────────────────────────────────────────────────
  loadProject:           (file: File, layoutFile?: File) => Promise<void>
  loadProjectFromObject: (project: CoreTraxJson, layout?: DiagramLayout) => void
  loadAutosave:          () => boolean
  clearProject:          () => void
  autoSave:              () => void
  exportJson:            () => void
  exportTraxJson:        () => void
  exportLayout:          () => void
  importLayout:          (file: File) => Promise<void>
  newProject:            () => void

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  undo: () => void
  redo: () => void

  // ── Selection ──────────────────────────────────────────────────────────────
  selectZone:          (id: string | null) => void
  selectComponent:     (id: string | null) => void
  selectCommunication: (id: string | null) => void
  clearSelection:      () => void

  // ── Editor mode ───────────────────────────────────────────────────────────
  setEditorMode: (mode: ProjectState['editorMode']) => void

  // ── Theme ─────────────────────────────────────────────────────────────────
  toggleTheme: () => void

  // ── Zone mutations ────────────────────────────────────────────────────────
  addZone:    (zone: TraxSecurityZone, layout: Omit<NodeLayout, 'id' | 'entityType'>) => void
  updateZone: (zone_id: string, partial: Partial<TraxSecurityZone>) => void
  deleteZone: (zone_id: string) => void

  // ── Component mutations ───────────────────────────────────────────────────
  addComponent:    (component: TraxSWComponent, layout: Omit<NodeLayout, 'id' | 'entityType'>) => void
  updateComponent: (subUnit_id: string, partial: Partial<TraxSWComponent>) => void
  deleteComponent: (subUnit_id: string) => void

  // ── Logical interface mutations ───────────────────────────────────────────
  addLogicalInterface:    (subUnit_id: string, iface: TraxLogicalInterface) => void
  updateLogicalInterface: (subUnit_id: string, interface_id: string, partial: Partial<TraxLogicalInterface>) => void
  deleteLogicalInterface: (subUnit_id: string, interface_id: string) => void

  // ── Network facing interface mutations ────────────────────────────────────
  addNetworkInterface:    (zone_id: string, iface: TraxNetworkFacingInterface) => void
  updateNetworkInterface: (zone_id: string, interface_id: string, partial: Partial<TraxNetworkFacingInterface>) => void
  deleteNetworkInterface: (zone_id: string, interface_id: string) => void

  // ── Host level interface mutations ────────────────────────────────────────
  addHostInterface:    (zone_id: string, iface: TraxHostLevelInterface) => void
  updateHostInterface: (zone_id: string, interface_id: string, partial: Partial<TraxHostLevelInterface>) => void
  deleteHostInterface: (zone_id: string, interface_id: string) => void

  // ── Communication (edge) mutations ────────────────────────────────────────
  addCommunication:    (sourceId: string, comm: TraxInterSWCommunication, layout: Omit<EdgeLayout, 'id'>) => void
  updateCommunication: (comm_id: string, partial: Partial<TraxInterSWCommunication>) => void
  deleteCommunication: (comm_id: string) => void

  // ── Atomic communication + optional stub interface ─────────────────────────
  addCommunicationWithStub: (
    sourceId:    string,
    targetId:    string,
    comm:        TraxInterSWCommunication,
    stub:        TraxLogicalInterface | null,
    layoutProps: Omit<EdgeLayout, 'id'>
  ) => void

  // ── Zone communication mutations ──────────────────────────────────────────
  addZoneCommunication:    (zoneId: string, comm: TraxZoneCommunication, layout: Omit<EdgeLayout, 'id'>) => void
  updateZoneCommunication: (comm_id: string, partial: Partial<TraxZoneCommunication>) => void
  deleteZoneCommunication: (comm_id: string) => void

  // ── Layout mutations ──────────────────────────────────────────────────────
  updateNodePosition:   (id: string, x: number, y: number, parentId?: string) => void
  updateNodeLayout:     (id: string, partial: Partial<NodeLayout>) => void
  updateEdgeLayout:     (id: string, partial: Partial<EdgeLayout>) => void
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void
  batchClearUserMoved:  () => void

  // ── Reconciliation ────────────────────────────────────────────────────────
  reconcileLayout:  () => void
  batchUpsertNodes: (nodes: NodeLayout[]) => void
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultSettings: CanvasSettings = {
  layoutAlgorithm: 'horizontal',
  edgeStyle:       'default',
}

const defaultLayout: DiagramLayout = {
  version:  '1.0',
  nodes:    [],
  edges:    [],
  settings: defaultSettings,
}

// ─── ID generators ────────────────────────────────────────────────────────────

const extractNumber = (id: string): number => {
  const match = id.match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

const makeZoneId = (): string => {
  const zones = useProjectStore.getState().project?.SecurityZones ?? []
  const max   = zones.reduce((acc, z) => Math.max(acc, extractNumber(z.zone_id)), 0)
  return `SZ-${max + 1}`
}

const makeComponentId = (): string => {
  const comps = useProjectStore.getState().project?.SWComponents ?? []
  const max   = comps.reduce((acc, c) => Math.max(acc, extractNumber(c.subUnit_id)), 0)
  return `SW-${max + 1}`
}

const makeInterfaceId = (subUnit_id?: string): string => {
  const comps = useProjectStore.getState().project?.SWComponents ?? []
  if (subUnit_id) {
    const comp = comps.find((c) => c.subUnit_id === subUnit_id)
    const max  = (comp?.LogicalInterfaces ?? []).reduce(
      (acc, li) => Math.max(acc, extractNumber(li.interface_id)), 0
    )
    const globalMax = comps.flatMap((c) => c.LogicalInterfaces ?? []).reduce(
      (acc, li) => Math.max(acc, extractNumber(li.interface_id)), 0
    )
    return `IF-${Math.max(max, globalMax) + 1}`
  }
  const max = comps.flatMap((c) => c.LogicalInterfaces ?? []).reduce(
    (acc, li) => Math.max(acc, extractNumber(li.interface_id)), 0
  )
  return `IF-${max + 1}`
}

const makeCommId = (): string => {
  const state = useProjectStore.getState()
  const comps = state.project?.SWComponents  ?? []
  const zones = state.project?.SecurityZones ?? []

  const maxComp = comps
    .flatMap((c) => c.InterSWCommunications ?? [])
    .reduce((acc, cm) => Math.max(acc, extractNumber(cm.communication_id)), 0)

  const maxZone = zones
    .flatMap((z) => z.ZoneCommunications ?? [])
    .reduce((acc, cm) => Math.max(acc, extractNumber(cm.communication_id)), 0)

  return `CM-${Math.max(maxComp, maxZone) + 1}`
}

export { makeZoneId, makeComponentId, makeInterfaceId, makeCommId }

// ─── Reconciliation ───────────────────────────────────────────────────────────

const reconcile = (
  layout:  DiagramLayout,
  project: CoreTraxJson,
): DiagramLayout => {
  const validNodeIds = new Set<string>([
    ...(project.SecurityZones ?? []).map((z) => z.zone_id),
    ...(project.SWComponents  ?? []).map((c) => c.subUnit_id),
  ])

  const validEdgeIds = new Set<string>([
    ...(project.SWComponents ?? []).flatMap(
      (c) => (c.InterSWCommunications ?? []).map((comm) => comm.communication_id)
    ),
    ...(project.SecurityZones ?? []).flatMap(
      (z) => (z.ZoneCommunications ?? []).map((comm) => comm.communication_id)
    ),
  ])

  return {
    ...layout,
    nodes:    layout.nodes.filter((n) => validNodeIds.has(n.id)),
    edges:    layout.edges.filter((e) => validEdgeIds.has(e.id)),
    settings: layout.settings ?? defaultSettings,
  }
}

// ─── Session cache helpers ────────────────────────────────────────────────────

const saveToStorage = (project: CoreTraxJson, layout: DiagramLayout) => {
  try {
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ project, layout }))
  } catch (e) {
    console.warn('[sessionCache] write failed:', e)
  }
}

const loadFromStorage = (): { project: CoreTraxJson; layout: DiagramLayout } | null => {
  try {
    const raw = sessionStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { project: CoreTraxJson; layout: DiagramLayout }
  } catch {
    return null
  }
}

// ─── Download helper ──────────────────────────────────────────────────────────

const triggerDownload = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ─── History helpers ──────────────────────────────────────────────────────────

const pushHistory = (s: ProjectState): Pick<ProjectState, 'past' | 'future'> => {
  if (!s.project) return { past: s.past, future: s.future }

  const snapshot: HistorySnapshot = {
    project:       s.project,
    diagramLayout: s.diagramLayout,
  }

  return {
    past:   [...s.past, snapshot].slice(-MAX_HISTORY),
    future: [],
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>((set, get) => ({

  // ── Initial state ──────────────────────────────────────────────────────────
  project:                 null,
  diagramLayout:           defaultLayout,
  past:                    [],
  future:                  [],
  layoutStamp:             0,
  selectedZoneId:          null,
  selectedComponentId:     null,
  selectedCommunicationId: null,
  isLoading:               false,
  error:                   null,
  theme:                   'light',
  editorMode:              'idle',

  // ── Project lifecycle ──────────────────────────────────────────────────────

  loadProject: async (file, layoutFile?) => {
    set({ isLoading: true, error: null })
    try {
      const text   = await file.text()
      const parsed = JSON.parse(text) as CoreTraxJson

      let layout = reconcile(defaultLayout, parsed)

      if (layoutFile) {
        try {
          const layoutText   = await layoutFile.text()
          const parsedLayout = JSON.parse(layoutText) as DiagramLayout
          layout             = reconcile(parsedLayout, parsed)
        } catch {
          console.warn('[loadProject] Layout sidecar failed to parse — using default layout')
        }
      }

      set({
        project:                 parsed,
        diagramLayout:           layout,
        past:                    [],
        future:                  [],
        layoutStamp:             get().layoutStamp + 1,
        isLoading:               false,
        selectedZoneId:          null,
        selectedComponentId:     null,
        selectedCommunicationId: null,
      })

      saveToStorage(parsed, layout)
    } catch {
      set({
        error:     'Failed to load or parse the JSON file. Please check the file and try again.',
        isLoading: false,
      })
    }
  },

  loadProjectFromObject: (project, layout?) => {
    const resolved = layout
      ? reconcile(layout, project)
      : reconcile(defaultLayout, project)

    set({
      project,
      diagramLayout:           resolved,
      past:                    [],
      future:                  [],
      layoutStamp:             get().layoutStamp + 1,
      selectedZoneId:          null,
      selectedComponentId:     null,
      selectedCommunicationId: null,
      isLoading:               false,
      error:                   null,
      editorMode:              'idle',
    })

    saveToStorage(project, resolved)
  },

  loadAutosave: () => {
    const saved = loadFromStorage()
    if (!saved) return false

    const layout = reconcile(saved.layout, saved.project)
    set({
      project:                 saved.project,
      diagramLayout:           layout,
      past:                    [],
      future:                  [],
      layoutStamp:             get().layoutStamp + 1,
      selectedZoneId:          null,
      selectedComponentId:     null,
      selectedCommunicationId: null,
    })
    return true
  },

  clearProject: () => {
    sessionStorage.removeItem(AUTOSAVE_KEY)
    set({
      project:                 null,
      diagramLayout:           defaultLayout,
      past:                    [],
      future:                  [],
      layoutStamp:             0,
      selectedZoneId:          null,
      selectedComponentId:     null,
      selectedCommunicationId: null,
      isLoading:               false,
      error:                   null,
      editorMode:              'idle',
    })
  },

  autoSave: () => {
    const { project, diagramLayout } = get()
    if (!project) return
    saveToStorage(project, diagramLayout)
  },

  // ── Export ────────────────────────────────────────────────────────────────

  exportJson: () => {
    const { project, diagramLayout } = get()
    if (!project) return

    const name = project.Project?.TRAProjectName ?? 'trax-export'
    triggerDownload(JSON.stringify(project, null, 2), `${name}.json`)
    setTimeout(() => {
      triggerDownload(JSON.stringify(diagramLayout, null, 2), `${name}.layout.json`)
    }, 150)
  },

  exportTraxJson: () => {
    const { project } = get()
    if (!project) return

    const name = project.Project?.TRAProjectName ?? 'trax-export'
    triggerDownload(JSON.stringify(project, null, 2), `${name}.json`)
  },

  exportLayout: () => {
    const { project, diagramLayout } = get()
    if (!project) return

    const name = project.Project?.TRAProjectName ?? 'trax-export'
    triggerDownload(JSON.stringify(diagramLayout, null, 2), `${name}.layout.json`)
  },

  importLayout: async (file) => {
    try {
      const text         = await file.text()
      const parsedLayout = JSON.parse(text) as DiagramLayout

      set((s) => {
        const project    = s.project
        const reconciled = project
          ? reconcile(parsedLayout, project)
          : parsedLayout

        const newLayout: DiagramLayout = {
          version:  reconciled.version  ?? s.diagramLayout.version,
          nodes:    reconciled.nodes,
          edges:    reconciled.edges.length > 0
                      ? reconciled.edges
                      : s.diagramLayout.edges,
          settings: reconciled.settings ?? s.diagramLayout.settings,
        }

        if (project) saveToStorage(project, newLayout)

        return {
          diagramLayout: newLayout,
          layoutStamp:   s.layoutStamp + 1,
        }
      })
    } catch (e) {
      console.error('[importLayout] Failed to parse layout sidecar:', e)
    }
  },

  newProject: () => {
    const blankProject: CoreTraxJson = {
      JSON_VERSION:     '2',
      TRAVersionName:   'New TRA',
      TRAVersionNumber: '1.0',
      status:           'In_Progress',
      createdBy:        '',
      changedBy:        '',
      createdDate:      new Date().toISOString(),
      changedDate:      new Date().toISOString(),
      Project: {
        TRAProjectName:   'New Project',
        responsibleOrg:   '',
        AccessScope: {
          name:          '',
          accessScopeID: 0,
        },
        Config: {
          selection: 'Software',
        },
        projectID:        0,
        targetOfAnalysis: '',
        createdBy:        '',
        createdDate:      new Date().toISOString(),
      },
      IntendedOp:    {},
      SecurityZones: [],
      SWComponents:  [],
    }
    const layout = defaultLayout
    saveToStorage(blankProject, layout)
    set({
      project:                 blankProject,
      diagramLayout:           layout,
      past:                    [],
      future:                  [],
      layoutStamp:             get().layoutStamp + 1,
      selectedZoneId:          null,
      selectedComponentId:     null,
      selectedCommunicationId: null,
      isLoading:               false,
      error:                   null,
      editorMode:              'idle',
    })
  },

  // ── Undo / Redo ───────────────────────────────────────────────────────────

  undo: () =>
    set((s) => {
      if (s.past.length === 0 || !s.project) return s

      const previous = s.past[s.past.length - 1]
      const newPast  = s.past.slice(0, -1)

      const currentSnapshot: HistorySnapshot = {
        project:       s.project,
        diagramLayout: s.diagramLayout,
      }

      saveToStorage(previous.project, previous.diagramLayout)

      return {
        project:                 previous.project,
        diagramLayout:           previous.diagramLayout,
        past:                    newPast,
        future:                  [currentSnapshot, ...s.future].slice(0, MAX_HISTORY),
      }
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0 || !s.project) return s

      const next      = s.future[0]
      const newFuture = s.future.slice(1)

      const currentSnapshot: HistorySnapshot = {
        project:       s.project,
        diagramLayout: s.diagramLayout,
      }

      saveToStorage(next.project, next.diagramLayout)

      return {
        project:                 next.project,
        diagramLayout:           next.diagramLayout,
        past:                    [...s.past, currentSnapshot].slice(-MAX_HISTORY),
        future:                  newFuture,
      }
    }),

  // ── Selection ──────────────────────────────────────────────────────────────

  selectZone: (id) =>
    set({
      selectedZoneId:          id,
      selectedComponentId:     null,
      selectedCommunicationId: null,
    }),

  selectComponent: (id) =>
    set({
      selectedComponentId:     id,
      selectedZoneId:          null,
      selectedCommunicationId: null,
    }),

  selectCommunication: (id) =>
    set({
      selectedCommunicationId: id,
      selectedZoneId:          null,
      selectedComponentId:     null,
    }),

  clearSelection: () =>
    set({
      selectedZoneId:          null,
      selectedComponentId:     null,
      selectedCommunicationId: null,
    }),

  // ── Editor mode ───────────────────────────────────────────────────────────

  setEditorMode: (mode) => set({ editorMode: mode }),

  // ── Theme ─────────────────────────────────────────────────────────────────

  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  // ── Zone mutations ────────────────────────────────────────────────────────

  addZone: (zone, layoutProps) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: [...(s.project.SecurityZones ?? []), zone],
      }

      const newNode: NodeLayout = {
        id:         zone.zone_id,
        entityType: 'zone',
        userMoved:  true,
        ...layoutProps,
      }

      const newLayout = {
        ...s.diagramLayout,
        nodes: [...s.diagramLayout.nodes, newNode],
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:       newProject,
        diagramLayout: newLayout,
      }
    }),

  updateZone: (zone_id, partial) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id === zone_id ? { ...z, ...partial } : z
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  deleteZone: (zone_id) =>
    set((s) => {
      if (!s.project) return s

      const toDelete = new Set<string>()
      const collectDescendants = (id: string) => {
        toDelete.add(id)
        s.project!.SecurityZones
          .filter((z) => z.SecurityZone?.zone_id === id)
          .forEach((child) => collectDescendants(child.zone_id))
      }
      collectDescendants(zone_id)

      const newZones = s.project.SecurityZones.filter(
        (z) => !toDelete.has(z.zone_id)
      )

      const newComponents = s.project.SWComponents.filter(
        (c) => !toDelete.has(c.SecurityZone.zone_id)
      )

      const deletedComponentIds = new Set(
        s.project.SWComponents
          .filter((c) => toDelete.has(c.SecurityZone.zone_id))
          .map((c) => c.subUnit_id)
      )

      const newProject = {
        ...s.project,
        SecurityZones: newZones,
        SWComponents:  newComponents,
      }

      const newLayout = {
        ...s.diagramLayout,
        nodes: s.diagramLayout.nodes.filter(
          (n) => !toDelete.has(n.id) && !deletedComponentIds.has(n.id)
        ),
        edges: s.diagramLayout.edges.filter((e) => {
          const sourceComp = s.project!.SWComponents.find((c) =>
            c.InterSWCommunications?.some((cm) => cm.communication_id === e.id)
          )
          if (sourceComp) return !deletedComponentIds.has(sourceComp.subUnit_id)

          const sourceZone = s.project!.SecurityZones.find((z) =>
            z.ZoneCommunications?.some((cm) => cm.communication_id === e.id)
          )
          if (sourceZone) return !toDelete.has(sourceZone.zone_id)

          return true
        }),
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:             newProject,
        diagramLayout:       newLayout,
        selectedZoneId:      toDelete.has(s.selectedZoneId ?? '') ? null : s.selectedZoneId,
        selectedComponentId: deletedComponentIds.has(s.selectedComponentId ?? '') ? null : s.selectedComponentId,
      }
    }),

  // ── Component mutations ───────────────────────────────────────────────────

  addComponent: (component, layoutProps) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: [...(s.project.SWComponents ?? []), component],
      }

      const newNode: NodeLayout = {
        id:         component.subUnit_id,
        entityType: 'component',
        userMoved:  true,
        ...layoutProps,
      }

      const newLayout = {
        ...s.diagramLayout,
        nodes: [...s.diagramLayout.nodes, newNode],
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:       newProject,
        diagramLayout: newLayout,
      }
    }),

  updateComponent: (subUnit_id, partial) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: s.project.SWComponents.map((c) =>
          c.subUnit_id === subUnit_id ? { ...c, ...partial } : c
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  deleteComponent: (subUnit_id) =>
    set((s) => {
      if (!s.project) return s

      const newComponents = s.project.SWComponents.filter(
        (c) => c.subUnit_id !== subUnit_id
      )

      const deletedCommIds = new Set(
        (s.project.SWComponents
          .find((c) => c.subUnit_id === subUnit_id)
          ?.InterSWCommunications ?? [])
          .map((cm) => cm.communication_id)
      )

      const newProject = {
        ...s.project,
        SWComponents: newComponents,
      }

      const newLayout = {
        ...s.diagramLayout,
        nodes: s.diagramLayout.nodes.filter((n) => n.id !== subUnit_id),
        edges: s.diagramLayout.edges.filter((e) => !deletedCommIds.has(e.id)),
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:             newProject,
        diagramLayout:       newLayout,
        selectedComponentId: s.selectedComponentId === subUnit_id ? null : s.selectedComponentId,
      }
    }),

  // ── Logical interface mutations ───────────────────────────────────────────

  addLogicalInterface: (subUnit_id, iface) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: s.project.SWComponents.map((c) =>
          c.subUnit_id === subUnit_id
            ? { ...c, LogicalInterfaces: [...(c.LogicalInterfaces ?? []), iface] }
            : c
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  updateLogicalInterface: (subUnit_id, interface_id, partial) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: s.project.SWComponents.map((c) =>
          c.subUnit_id !== subUnit_id ? c : {
            ...c,
            LogicalInterfaces: (c.LogicalInterfaces ?? []).map((li) =>
              li.interface_id === interface_id ? { ...li, ...partial } : li
            ),
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  deleteLogicalInterface: (subUnit_id, interface_id) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: s.project.SWComponents.map((c) =>
          c.subUnit_id !== subUnit_id ? c : {
            ...c,
            LogicalInterfaces: (c.LogicalInterfaces ?? []).filter(
              (li) => li.interface_id !== interface_id
            ),
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  // ── Network facing interface mutations ────────────────────────────────────

  addNetworkInterface: (zone_id, iface) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id !== zone_id ? z : {
            ...z,
            NetworkFacingInterfaces_Zone: [
              ...(z.NetworkFacingInterfaces_Zone ?? []),
              iface,
            ],
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  updateNetworkInterface: (zone_id, interface_id, partial) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id !== zone_id ? z : {
            ...z,
            NetworkFacingInterfaces_Zone: (z.NetworkFacingInterfaces_Zone ?? []).map(
              (iface) => iface.interface_id === interface_id
                ? { ...iface, ...partial }
                : iface
            ),
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  deleteNetworkInterface: (zone_id, interface_id) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id !== zone_id ? z : {
            ...z,
            NetworkFacingInterfaces_Zone: (z.NetworkFacingInterfaces_Zone ?? []).filter(
              (iface) => iface.interface_id !== interface_id
            ),
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  // ── Host level interface mutations ────────────────────────────────────────

  addHostInterface: (zone_id, iface) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id !== zone_id ? z : {
            ...z,
            HostLevelInterfaces_Zone: [
              ...(z.HostLevelInterfaces_Zone ?? []),
              iface,
            ],
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  updateHostInterface: (zone_id, interface_id, partial) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id !== zone_id ? z : {
            ...z,
            HostLevelInterfaces_Zone: (z.HostLevelInterfaces_Zone ?? []).map(
              (iface) => iface.interface_id === interface_id
                ? { ...iface, ...partial }
                : iface
            ),
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  deleteHostInterface: (zone_id, interface_id) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id !== zone_id ? z : {
            ...z,
            HostLevelInterfaces_Zone: (z.HostLevelInterfaces_Zone ?? []).filter(
              (iface) => iface.interface_id !== interface_id
            ),
          }
        ),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  // ── Communication mutations ───────────────────────────────────────────────

  addCommunication: (sourceId, comm, layoutProps) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: s.project.SWComponents.map((c) =>
          c.subUnit_id !== sourceId ? c : {
            ...c,
            InterSWCommunications: [
              ...(c.InterSWCommunications ?? []),
              comm,
            ],
          }
        ),
      }

      const newEdge: EdgeLayout = {
        id: comm.communication_id,
        ...layoutProps,
      }

      const newLayout = {
        ...s.diagramLayout,
        edges: [...s.diagramLayout.edges, newEdge],
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:       newProject,
        diagramLayout: newLayout,
      }
    }),

  updateCommunication: (comm_id, partial) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: s.project.SWComponents.map((c) => ({
          ...c,
          InterSWCommunications: (c.InterSWCommunications ?? []).map((cm) =>
            cm.communication_id === comm_id ? { ...cm, ...partial } : cm
          ),
        })),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  deleteCommunication: (comm_id) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SWComponents: s.project.SWComponents.map((c) => ({
          ...c,
          InterSWCommunications: (c.InterSWCommunications ?? []).filter(
            (cm) => cm.communication_id !== comm_id
          ),
        })),
      }

      const newLayout = {
        ...s.diagramLayout,
        edges: s.diagramLayout.edges.filter((e) => e.id !== comm_id),
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:                 newProject,
        diagramLayout:           newLayout,
        selectedCommunicationId: s.selectedCommunicationId === comm_id
          ? null
          : s.selectedCommunicationId,
      }
    }),

  // ── Atomic: communication + optional stub interface ───────────────────────

  addCommunicationWithStub: (sourceId, targetId, comm, stub, layoutProps) =>
    set((s) => {
      if (!s.project) return s

      const newComponents = s.project.SWComponents.map((c) => {
        if (stub && c.subUnit_id === targetId) {
          return {
            ...c,
            LogicalInterfaces: [...(c.LogicalInterfaces ?? []), stub],
          }
        }
        if (c.subUnit_id === sourceId) {
          return {
            ...c,
            InterSWCommunications: [
              ...(c.InterSWCommunications ?? []),
              comm,
            ],
          }
        }
        return c
      })

      const newProject = {
        ...s.project,
        SWComponents: newComponents,
      }

      const newEdge: EdgeLayout = {
        id: comm.communication_id,
        ...layoutProps,
      }

      const newLayout = {
        ...s.diagramLayout,
        edges: [...s.diagramLayout.edges, newEdge],
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:       newProject,
        diagramLayout: newLayout,
      }
    }),

  // ── Zone communication mutations ──────────────────────────────────────────

  addZoneCommunication: (zoneId, comm, layoutProps) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) =>
          z.zone_id !== zoneId ? z : {
            ...z,
            ZoneCommunications: [
              ...(z.ZoneCommunications ?? []),
              comm,
            ],
          }
        ),
      }

      const newEdge: EdgeLayout = {
        id:           comm.communication_id,
        entityType:   'zoneCommunication',
        sourceType:   layoutProps.sourceType,
        targetType:   layoutProps.targetType,
        labelOffsetX: layoutProps.labelOffsetX,
        labelOffsetY: layoutProps.labelOffsetY,
        animated:     layoutProps.animated,
        color:        layoutProps.color,
      }

      const newLayout = {
        ...s.diagramLayout,
        edges: [...s.diagramLayout.edges, newEdge],
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:       newProject,
        diagramLayout: newLayout,
      }
    }),

  // ── NEW: updateZoneCommunication ──────────────────────────────────────────

  updateZoneCommunication: (comm_id, partial) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) => ({
          ...z,
          ZoneCommunications: (z.ZoneCommunications ?? []).map((cm) =>
            cm.communication_id === comm_id ? { ...cm, ...partial } : cm
          ),
        })),
      }

      saveToStorage(newProject, s.diagramLayout)
      return { ...pushHistory(s), project: newProject }
    }),

  deleteZoneCommunication: (comm_id) =>
    set((s) => {
      if (!s.project) return s

      const newProject = {
        ...s.project,
        SecurityZones: s.project.SecurityZones.map((z) => ({
          ...z,
          ZoneCommunications: (z.ZoneCommunications ?? []).filter(
            (cm) => cm.communication_id !== comm_id
          ),
        })),
      }

      const newLayout = {
        ...s.diagramLayout,
        edges: s.diagramLayout.edges.filter((e) => e.id !== comm_id),
      }

      saveToStorage(newProject, newLayout)

      return {
        ...pushHistory(s),
        project:                 newProject,
        diagramLayout:           newLayout,
        selectedCommunicationId: s.selectedCommunicationId === comm_id
          ? null
          : s.selectedCommunicationId,
      }
    }),

  // ── Layout mutations ──────────────────────────────────────────────────────

  updateNodePosition: (id, x, y, parentId?) =>
    set((s) => {
      const idx = s.diagramLayout.nodes.findIndex((n) => n.id === id)

      if (idx === -1) {
        const isZone = s.project?.SecurityZones?.some((z) => z.zone_id === id)
        const newNode: NodeLayout = {
          id,
          entityType:    isZone ? 'zone' : 'component',
          x,
          y,
          width:         isZone ? 300 : 220,
          height:        isZone ? 200 : 40,
          color:         '#94a3b8',
          labelPosition: 'top',
          userMoved:     true,
          ...(parentId !== undefined && { parentId }),
        }

        const newLayout = {
          ...s.diagramLayout,
          nodes: [...s.diagramLayout.nodes, newNode],
        }
        if (s.project) saveToStorage(s.project, newLayout)
        return { diagramLayout: newLayout }
      }

      const updated = [...s.diagramLayout.nodes]
      updated[idx]  = {
        ...updated[idx],
        x,
        y,
        userMoved: true,
        ...(parentId !== undefined && { parentId }),
      }

      const newLayout = { ...s.diagramLayout, nodes: updated }
      if (s.project) saveToStorage(s.project, newLayout)
      return { diagramLayout: newLayout }
    }),

  updateNodeLayout: (id, partial) =>
    set((s) => {
      const idx = s.diagramLayout.nodes.findIndex((n) => n.id === id)
      if (idx === -1) return s

      const updated = [...s.diagramLayout.nodes]
      updated[idx]  = { ...updated[idx], ...partial }

      const newLayout = { ...s.diagramLayout, nodes: updated }
      if (s.project) saveToStorage(s.project, newLayout)
      return { diagramLayout: newLayout }
    }),

  updateEdgeLayout: (id, partial) =>
    set((s) => {
      const idx = s.diagramLayout.edges.findIndex((e) => e.id === id)
      if (idx === -1) return s

      const updated = [...s.diagramLayout.edges]
      updated[idx]  = { ...updated[idx], ...partial }

      const newLayout = { ...s.diagramLayout, edges: updated }
      if (s.project) saveToStorage(s.project, newLayout)
      return { diagramLayout: newLayout }
    }),

  updateCanvasSettings: (settings) =>
    set((s) => {
      const algoChanged =
        settings.layoutAlgorithm !== undefined &&
        settings.layoutAlgorithm !== s.diagramLayout.settings.layoutAlgorithm

      const clearedNodes = algoChanged
        ? s.diagramLayout.nodes.map((n) => ({ ...n, userMoved: false }))
        : s.diagramLayout.nodes

      const newLayout = {
        ...s.diagramLayout,
        nodes:    clearedNodes,
        settings: { ...s.diagramLayout.settings, ...settings },
      }

      if (s.project) saveToStorage(s.project, newLayout)

      return {
        diagramLayout: newLayout,
        ...(algoChanged && { layoutStamp: s.layoutStamp + 1 }),
      }
    }),

  // ── Reconciliation ────────────────────────────────────────────────────────

  reconcileLayout: () =>
    set((s) => {
      if (!s.project) return s
      return {
        diagramLayout: reconcile(s.diagramLayout, s.project),
        layoutStamp:   s.layoutStamp + 1,
      }
    }),

  // ── Batch upsert nodes ────────────────────────────────────────────────────

  batchUpsertNodes: (incoming) =>
    set((s) => {
      const existingIds = new Set(s.diagramLayout.nodes.map((n) => n.id))
      const toAdd = incoming.filter((n) => !existingIds.has(n.id))
      if (toAdd.length === 0) return s

      const newLayout = {
        ...s.diagramLayout,
        nodes: [...s.diagramLayout.nodes, ...toAdd],
      }
      if (s.project) saveToStorage(s.project, newLayout)
      return { diagramLayout: newLayout }
    }),

  batchClearUserMoved: () =>
    set((s) => {
      const updatedNodes = s.diagramLayout.nodes.map((n) => ({
        ...n,
        userMoved: false,
      }))
      const newLayout = { ...s.diagramLayout, nodes: updatedNodes }
      if (s.project) saveToStorage(s.project, newLayout)
      return { diagramLayout: newLayout }
    }),

}))

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useSelectedZone = () => {
  const project        = useProjectStore((s) => s.project)
  const selectedZoneId = useProjectStore((s) => s.selectedZoneId)
  if (!project || !selectedZoneId) return null
  return project.SecurityZones?.find((z) => z.zone_id === selectedZoneId) ?? null
}

export const useSelectedComponent = () => {
  const project             = useProjectStore((s) => s.project)
  const selectedComponentId = useProjectStore((s) => s.selectedComponentId)
  if (!project || !selectedComponentId) return null
  return project.SWComponents?.find((c) => c.subUnit_id === selectedComponentId) ?? null
}

// ── FIXED: now searches both component comms AND zone comms ──────────────────

export type SelectedComm =
  | { kind: 'component'; comm: TraxInterSWCommunication }
  | { kind: 'zone';      comm: TraxZoneCommunication      }

export const useSelectedCommunication = (): SelectedComm | null => {
  const project                 = useProjectStore((s) => s.project)
  const selectedCommunicationId = useProjectStore((s) => s.selectedCommunicationId)
  if (!project || !selectedCommunicationId) return null

  // Search component comms first
  const compComm = project.SWComponents
    ?.flatMap((c) => c.InterSWCommunications ?? [])
    .find((cm) => cm.communication_id === selectedCommunicationId)

  if (compComm) return { kind: 'component', comm: compComm }

  // Then zone comms
  const zoneComm = project.SecurityZones
    ?.flatMap((z) => z.ZoneCommunications ?? [])
    .find((cm) => cm.communication_id === selectedCommunicationId)

  if (zoneComm) return { kind: 'zone', comm: zoneComm }

  return null
}

export const useCommunicationSource = (comm_id: string) => {
  const project = useProjectStore((s) => s.project)
  if (!project) return null
  return project.SWComponents?.find((c) =>
    c.InterSWCommunications?.some((cm) => cm.communication_id === comm_id)
  ) ?? null
}

// ─── Undo / Redo selectors ────────────────────────────────────────────────────

export const useCanUndo = () => useProjectStore((s) => s.past.length > 0)
export const useCanRedo = () => useProjectStore((s) => s.future.length > 0)

if (typeof window !== 'undefined') {
  (window as any).__store = useProjectStore
}