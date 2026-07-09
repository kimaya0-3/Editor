import type {
  TraxSecurityZone,
  TraxSWComponent,
  NodeLayout,
  CanvasSettings,
} from '../types/index'
import type { Edge, Node } from '@xyflow/react'
import { runLayout, calcSizes } from '../utils/layoutAlgorithms'
import { SoftwareAttackSurfaceType } from '../types/index'

// ─── ZoneNodeData ─────────────────────────────────────────────────────────────

export interface ZoneNodeData {
  label:             string
  zone_id:           string
  zone_type?:        string
  zone_description?: string
  security_rating?:  string
  exposure_count:    number
  child_count:       number
  zone:              TraxSecurityZone
  [key: string]:     unknown
}

// ─── InterfaceData ────────────────────────────────────────────────────────────

export interface InterfaceData {
  id:          string
  name:        string
  protocol?:   string
  exposure:    string
  surfaceType: string
}

// ─── ComponentNodeData ────────────────────────────────────────────────────────

export interface ComponentNodeData {
  label:           string
  subUnit_id:      string
  zone_id:         string
  scope:           string
  description?:    string
  interface_count: number
  interfaces:      InterfaceData[]
  component:       TraxSWComponent
  [key: string]:   unknown
}

// ─── Layout Constants ─────────────────────────────────────────────────────────

const COMP_W       = 220
const ZONE_PADDING = 40
const ZONE_HEADER  = 50
const ZONE_GAP     = 24
const ZONE_MIN_W   = 300
const ZONE_MIN_H   = 200
const CANVAS_START = { x: 60, y: 60 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const deriveRating = (zone: TraxSecurityZone): string | undefined => {
  if (!zone.ZoneExposures || zone.ZoneExposures.length === 0) return undefined
  const priority = ['High', 'Medium', 'Low', 'Incomplete', 'NoRating']
  const ratings  = zone.ZoneExposures.map((e) => e.rating)
  return priority.find((r) => ratings.includes(r as never))
}

export const exposureColour = (rating: string): string => {
  switch (rating) {
    case 'High':       return '#ef4444'
    case 'Medium':     return '#f59e0b'
    case 'Low':        return '#22c55e'
    case 'Incomplete': return '#a855f7'
    default:           return '#94a3b8'
  }
}

// ─── Interface mapper ─────────────────────────────────────────────────────────

const mapInterfaces = (comp: TraxSWComponent): InterfaceData[] =>
  (comp.LogicalInterfaces ?? []).map((li) => ({
    id:          li.interface_id,
    name:        li.name,
    protocol:    li.ProtocolType?.name,
    exposure:    li.CALCzoneDerivedExposure_I,
    surfaceType: li.softwareAttackSurfaceType,
  }))

// ─── surfaceType → color (single source of truth) ────────────────────────────

export const interfaceTypeColor: Record<string, string> = {
  [SoftwareAttackSurfaceType.NetworkInterfaceAPI]:             '#3b82f6',
  [SoftwareAttackSurfaceType.UserInterfaceOverNetwork]:        '#06b6d4',
  [SoftwareAttackSurfaceType.UserInterfaceFromProximity]:      '#a78bfa',
  [SoftwareAttackSurfaceType.TechnicalInterfaceFromProximity]: '#8b5cf6',
  [SoftwareAttackSurfaceType.DependencyOnHost]:                '#4ade80',
  [SoftwareAttackSurfaceType.Undetermined]:                    '#94a3b8',
}

export const surfaceTypeLabel: Record<string, string> = {
  [SoftwareAttackSurfaceType.NetworkInterfaceAPI]:             'Component Interface Over Network API',
  [SoftwareAttackSurfaceType.UserInterfaceOverNetwork]:        'User Interface over Network',
  [SoftwareAttackSurfaceType.UserInterfaceFromProximity]:      'User Interface from Proximity',
  [SoftwareAttackSurfaceType.TechnicalInterfaceFromProximity]: 'Technical Interface from Proximity',
  [SoftwareAttackSurfaceType.DependencyOnHost]:                'Dependency on Host',
  [SoftwareAttackSurfaceType.Undetermined]:                    'Undetermined (Network)',
}

// ─── Position resolution ──────────────────────────────────────────────────────
//
// Priority order (highest → lowest):
//
//   1. Node exists in store AND userMoved = true
//      → User explicitly dragged it. Always respect this.
//
//   2. Node exists in store AND userMoved = false / undefined
//      → Position was calculated by the algorithm (or algo just changed
//        and updateCanvasSettings cleared userMoved). Use the algorithm's
//        fresh calculated position so the new layout takes effect.
//
//   3. Node does NOT exist in store at all
//      → Brand new node. Use the algorithm's calculated position.
//
const resolvePosition = (
  saved:   NodeLayout | undefined,
  calcPos: { x: number; y: number },
): { x: number; y: number } => {
  // Only respect stored position if the user explicitly dragged this node
  if (saved !== undefined && saved.userMoved === true) {
    return { x: saved.x, y: saved.y }
  }
  // Not in store, or userMoved is false/undefined → use algorithm position
  return calcPos
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export const buildNodes = (
  zones:      TraxSecurityZone[],
  components: TraxSWComponent[],
  savedNodes: NodeLayout[],
  settings:   CanvasSettings,
): Node[] => {
  const calculatedPositions = runLayout(settings.layoutAlgorithm, zones, components)
  const savedMap            = new Map(savedNodes.map((n) => [n.id, n]))

  const childZones = new Map<string, TraxSecurityZone[]>()
  const childComps = new Map<string, TraxSWComponent[]>()
  const topZones:   TraxSecurityZone[] = []

  for (const zone of zones) {
    const pid = zone.SecurityZone?.zone_id
    if (pid) {
      if (!childZones.has(pid)) childZones.set(pid, [])
      childZones.get(pid)!.push(zone)
    } else {
      topZones.push(zone)
    }
  }
  for (const comp of components) {
    const zid = comp.SecurityZone.zone_id
    if (!childComps.has(zid)) childComps.set(zid, [])
    childComps.get(zid)!.push(comp)
  }

  const sizes  = calcSizes(zones, components)
  const result: Node[] = []

  const buildZone = (zone: TraxSecurityZone, parentId: string | undefined): void => {
    const saved      = savedMap.get(zone.zone_id)
    const size       = sizes[zone.zone_id]
    const calcPos    = calculatedPositions[zone.zone_id] ?? CANVAS_START
    const { x, y }  = resolvePosition(saved, calcPos)
    const childCount = (childZones.get(zone.zone_id) ?? []).length

    result.push({
      id:       zone.zone_id,
      type:     'zoneNode' as const,
      position: { x, y },
      style:    { width: size?.width ?? ZONE_MIN_W, height: size?.height ?? ZONE_MIN_H },
      ...(parentId ? { parentId, extent: 'parent' as const } : {}),
      connectable: true,
      data: {
        label:            zone.name,
        zone_id:          zone.zone_id,
        zone_type:        zone.TypeOf?.name,
        zone_description: zone.description,
        security_rating:  deriveRating(zone),
        exposure_count:   zone.ZoneExposures?.length ?? 0,
        child_count:      childCount,
        zone,
      } satisfies ZoneNodeData,
    })

    const subZones = childZones.get(zone.zone_id) ?? []
    const comps    = childComps.get(zone.zone_id) ?? []

    for (const sub of subZones) buildZone(sub, zone.zone_id)

    let cursorX = ZONE_PADDING
    for (const sub of subZones) {
      cursorX += (sizes[sub.zone_id]?.width ?? ZONE_MIN_W) + ZONE_GAP
    }

    for (const comp of comps) {
      const savedComp        = savedMap.get(comp.subUnit_id)
      const compCalc         = calculatedPositions[comp.subUnit_id] ?? {
        x: cursorX,
        y: ZONE_HEADER + ZONE_PADDING,
      }
      const { x: cx, y: cy } = resolvePosition(savedComp, compCalc)
      const interfaces        = mapInterfaces(comp)

      result.push({
        id:       comp.subUnit_id,
        type:     'componentNode' as const,
        position: { x: cx, y: cy },
        parentId: zone.zone_id,
        extent:   'parent' as const,
        data: {
          label:           comp.name,
          subUnit_id:      comp.subUnit_id,
          zone_id:         comp.SecurityZone.zone_id,
          scope:           comp.scope,
          description:     comp.description,
          interface_count: interfaces.length,
          interfaces,
          component:       comp,
        } satisfies ComponentNodeData,
      })

      cursorX += COMP_W + ZONE_GAP
    }
  }

  for (const zone of topZones) buildZone(zone, undefined)

  // ── Orphan components ──────────────────────────────────────────────────────
  const assignedZoneIds = new Set(zones.map((z) => z.zone_id))
  const orphanComps     = components.filter(
    (c) => !assignedZoneIds.has(c.SecurityZone.zone_id)
  )
  let orphanX   = CANVAS_START.x
  const orphanY = CANVAS_START.y + 600

  for (const comp of orphanComps) {
    const savedComp        = savedMap.get(comp.subUnit_id)
    const { x: cx, y: cy } = resolvePosition(savedComp, { x: orphanX, y: orphanY })
    const interfaces        = mapInterfaces(comp)

    result.push({
      id:       comp.subUnit_id,
      type:     'componentNode' as const,
      position: { x: cx, y: cy },
      data: {
        label:           comp.name,
        subUnit_id:      comp.subUnit_id,
        zone_id:         comp.SecurityZone.zone_id,
        scope:           comp.scope,
        description:     comp.description,
        interface_count: interfaces.length,
        interfaces,
        component:       comp,
      } satisfies ComponentNodeData,
    })

    orphanX += COMP_W + ZONE_GAP
  }

  return result
}

// ─── Communication Edges ──────────────────────────────────────────────────────

export const communicationsToEdges = (
  zones:      TraxSecurityZone[],
  components: TraxSWComponent[],
  edgeStyle?: string,
): Edge[] => {
  const edges: Edge[] = []

  const interfaceMap = new Map<string, { compId: string; surfaceType: string }>()
  for (const comp of components) {
    for (const li of comp.LogicalInterfaces ?? []) {
      interfaceMap.set(li.interface_id, {
        compId:      comp.subUnit_id,
        surfaceType: li.softwareAttackSurfaceType,
      })
    }
  }

  const isAnimated = edgeStyle === 'animated'
  const rfType     = isAnimated ? 'smoothstep' : (edgeStyle ?? 'smoothstep')

  const seenIds          = new Set<string>()
  const sourceTargetSeen = new Set<string>()

  for (const comp of components) {
    for (const comm of comp.InterSWCommunications ?? []) {
      const sourceId = comm.SourceComponent?.subUnit_id ?? comp.subUnit_id
      const target   = interfaceMap.get(comm.TargetInterface?.interface_id)

      if (!sourceId || !target || sourceId === target.compId) continue

      const edgeId          = comm.communication_id
      const sourceTargetKey = `${sourceId}→${target.compId}`

      if (seenIds.has(edgeId))                   continue
      if (sourceTargetSeen.has(sourceTargetKey)) continue

      seenIds.add(edgeId)
      sourceTargetSeen.add(sourceTargetKey)

      const edgeColor = interfaceTypeColor[target.surfaceType] ?? '#94a3b8'

      edges.push({
        id:       edgeId,
        source:   sourceId,
        target:   target.compId,
        label:    comm.name ?? comm.communication_id,
        type:     rfType,
        animated: isAnimated,
        style: {
          stroke:      edgeColor,
          strokeWidth: 1,
          opacity:     0.55,
        },
        markerEnd: {
          type:   'arrowclosed' as const,
          color:  edgeColor,
          width:  12,
          height: 12,
        },
      })
    }
  }

  for (const zone of zones) {
    for (const comm of zone.ZoneCommunications ?? []) {
      if (seenIds.has(comm.communication_id)) continue
      seenIds.add(comm.communication_id)

      const sourceId = comm.SourceZone?.zone_id ?? zone.zone_id
      const targetId = comm.TargetZone.zone_id

      edges.push({
        id:       comm.communication_id,
        source:   sourceId,
        target:   targetId,
        label:    comm.name ?? comm.communication_id,
        type:     rfType,
        animated: isAnimated,
        style: {
          stroke:      '#a78bfa',
          strokeWidth: 1.5,
          opacity:     0.65,
        },
        markerEnd: {
          type:   'arrowclosed' as const,
          color:  '#a78bfa',
          width:  12,
          height: 12,
        },
      })
    }
  }

  return edges
}