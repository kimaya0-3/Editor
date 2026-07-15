// ─── layoutAlgorithms.ts ──────────────────────────────────────────────────────

import type { TraxSecurityZone, TraxSWComponent } from '../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PositionMap {
  [id: string]: { x: number; y: number }
}

interface SizeMap {
  [id: string]: { width: number; height: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMP_W       = 220
const COMP_H       = 140
const ZONE_PADDING = 40
const ZONE_HEADER  = 50
const ZONE_GAP     = 24
const ZONE_MIN_W   = 300
const ZONE_MIN_H   = 200
const CANVAS_START = { x: 60, y: 60 }
const CANVAS_GAP   = 40

// ─── Child map builder ────────────────────────────────────────────────────────

const buildChildMaps = (
  zones:      TraxSecurityZone[],
  components: TraxSWComponent[],
) => {
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

  return { childZones, childComps, topZones }
}

// ─── Size calculator ──────────────────────────────────────────────────────────

export const calcSizes = (
  zones:      TraxSecurityZone[],
  components: TraxSWComponent[],
): SizeMap => {
  const sizes: SizeMap = {}
  const { childZones, childComps } = buildChildMaps(zones, components)

  for (const comp of components) {
    sizes[comp.subUnit_id] = { width: COMP_W, height: COMP_H }
  }

  const processed = new Set<string>()

  const processZone = (zone: TraxSecurityZone): void => {
    if (processed.has(zone.zone_id)) return

    const subZones = childZones.get(zone.zone_id) ?? []
    const comps    = childComps.get(zone.zone_id) ?? []

    for (const sub of subZones) processZone(sub)

    const children = [
      ...subZones.map((z) => sizes[z.zone_id]),
      ...comps.map((c)    => sizes[c.subUnit_id]),
    ]

    if (children.length === 0) {
      sizes[zone.zone_id] = { width: ZONE_MIN_W, height: ZONE_MIN_H }
      processed.add(zone.zone_id)
      return
    }

    const totalChildW = children.reduce((sum, c) => sum + c.width, 0)
      + ZONE_GAP * (children.length - 1)
    const maxChildH   = Math.max(...children.map((c) => c.height))

    sizes[zone.zone_id] = {
      width:  Math.max(ZONE_MIN_W, totalChildW + ZONE_PADDING * 2),
      height: Math.max(ZONE_MIN_H, ZONE_HEADER + maxChildH + ZONE_PADDING * 2),
    }
    processed.add(zone.zone_id)
  }

  for (const zone of zones) processZone(zone)

  return sizes
}

// ─── Horizontal layout (top-level zones left → right) ────────────────────────

export const horizontalLayout = (
  zones:      TraxSecurityZone[],
  components: TraxSWComponent[],
): PositionMap => {
  const positions: PositionMap = {}
  const sizes = calcSizes(zones, components)
  const { childZones, childComps, topZones } = buildChildMaps(zones, components)

  const layoutZone = (zone: TraxSecurityZone): void => {
    const subZones = childZones.get(zone.zone_id) ?? []
    const comps    = childComps.get(zone.zone_id) ?? []
    let cursorX    = ZONE_PADDING

    for (const sub of subZones) {
      positions[sub.zone_id] = { x: cursorX, y: ZONE_HEADER + ZONE_PADDING }
      layoutZone(sub)
      cursorX += (sizes[sub.zone_id]?.width ?? ZONE_MIN_W) + ZONE_GAP
    }

    for (const comp of comps) {
      positions[comp.subUnit_id] = { x: cursorX, y: ZONE_HEADER + ZONE_PADDING }
      cursorX += COMP_W + ZONE_GAP
    }
  }

  // Top-level zones placed left → right
  let canvasX = CANVAS_START.x
  for (const zone of topZones) {
    positions[zone.zone_id] = { x: canvasX, y: CANVAS_START.y }
    layoutZone(zone)
    canvasX += (sizes[zone.zone_id]?.width ?? ZONE_MIN_W) + CANVAS_GAP
  }

  return positions
}

// ─── Vertical layout (top-level zones top → bottom) ──────────────────────────

export const verticalLayout = (
  zones:      TraxSecurityZone[],
  components: TraxSWComponent[],
): PositionMap => {
  const positions: PositionMap = {}
  const sizes = calcSizes(zones, components)
  const { childZones, childComps, topZones } = buildChildMaps(zones, components)

  const layoutZone = (zone: TraxSecurityZone): void => {
    const subZones = childZones.get(zone.zone_id) ?? []
    const comps    = childComps.get(zone.zone_id) ?? []
    let cursorX    = ZONE_PADDING

    for (const sub of subZones) {
      positions[sub.zone_id] = { x: cursorX, y: ZONE_HEADER + ZONE_PADDING }
      layoutZone(sub)
      cursorX += (sizes[sub.zone_id]?.width ?? ZONE_MIN_W) + ZONE_GAP
    }

    for (const comp of comps) {
      positions[comp.subUnit_id] = { x: cursorX, y: ZONE_HEADER + ZONE_PADDING }
      cursorX += COMP_W + ZONE_GAP
    }
  }

  // Top-level zones placed top → bottom
  let canvasY = CANVAS_START.y
  for (const zone of topZones) {
    positions[zone.zone_id] = { x: CANVAS_START.x, y: canvasY }
    layoutZone(zone)
    canvasY += (sizes[zone.zone_id]?.height ?? ZONE_MIN_H) + CANVAS_GAP
  }

  return positions
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export const runLayout = (
  algorithm:  'vertical' | 'horizontal',
  zones:      TraxSecurityZone[],
  components: TraxSWComponent[],
): PositionMap => {
  switch (algorithm) {
    case 'horizontal': return horizontalLayout(zones, components)   
    default:           return verticalLayout(zones, components)     
  }
}