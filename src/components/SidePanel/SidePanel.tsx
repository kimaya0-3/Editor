import React, { useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import type {
  TraxSecurityZone,
  TraxZoneExposure,
  TraxLogicalInterface,
  TraxSWComponent,
  ZoneInterfaceSubType,
} from '../../types/index'
import {
  interfaceTypeColor,
  surfaceTypeLabel,
} from '../../utils/transformers'

// ─── Selectors ────────────────────────────────────────────────────────────────

const useSelectedZone = (): TraxSecurityZone | null => {
  const project        = useProjectStore((s) => s.project)
  const selectedZoneId = useProjectStore((s) => s.selectedZoneId)
  if (!project || !selectedZoneId) return null
  return project.SecurityZones.find((z) => z.zone_id === selectedZoneId) ?? null
}

const useSelectedComponent = (): TraxSWComponent | null => {
  const project             = useProjectStore((s) => s.project)
  const selectedComponentId = useProjectStore((s) => s.selectedComponentId)
  if (!project || !selectedComponentId) return null
  return project.SWComponents.find((c) => c.subUnit_id === selectedComponentId) ?? null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const deriveRating = (zone: TraxSecurityZone): string | undefined => {
  if (!zone.ZoneExposures?.length) return undefined
  const priority = ['High', 'Medium', 'Low', 'Incomplete', 'NoRating']
  const ratings  = zone.ZoneExposures.map((e) => e.rating)
  return priority.find((r) => ratings.includes(r as never))
}

// ─── Network Interface Color Helper ──────────────────────────────────────────

const getNetworkInterfaceColor = (subType: ZoneInterfaceSubType | undefined): string => {
  switch (subType) {
    case 'Network_User_Interface': return '#3b82f6' // Blue
    case 'C2C_Interface':          return '#06b6d4' // Cyan
    case 'Technical_Interface':    return '#8b5cf6' // Violet
    default:                       return '#94a3b8' // Gray
  }
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const t = (isDark: boolean) => ({
  // surfaces
  bg:          isDark ? '#0b1120' : '#ffffff',
  bgSubtle:    isDark ? '#111827' : '#f8fafc',
  bgCard:      isDark ? '#1a2236' : '#f1f5f9',
  bgCardHover: isDark ? '#1e2a40' : '#e9eef5',
  // borders
  border:      isDark ? '#1e293b' : '#e2e8f0',
  borderCard:  isDark ? '#263248' : '#e2e8f0',
  // text
  textPrimary:   isDark ? '#f1f5f9' : '#0f172a',
  textSecondary: isDark ? '#94a3b8' : '#64748b',
  textMuted:     isDark ? '#475569' : '#94a3b8',
  textMono:      isDark ? '#7dd3fc' : '#0369a1',
  // accent
  accent: '#3b82f6',
})

// ─── Rating config ────────────────────────────────────────────────────────────

const ratingConfig: Record<string, {
  dot: string; bg: string; bgL: string; text: string; textL: string
}> = {
  High:       { dot: '#ef4444', bg: '#450a0a', bgL: '#fef2f2', text: '#fca5a5', textL: '#dc2626' },
  Medium:     { dot: '#f97316', bg: '#431407', bgL: '#fff7ed', text: '#fdba74', textL: '#ea580c' },
  Low:        { dot: '#22c55e', bg: '#052e16', bgL: '#f0fdf4', text: '#86efac', textL: '#16a34a' },
  Critical:   { dot: '#e879f9', bg: '#3b0764', bgL: '#fdf4ff', text: '#e879f9', textL: '#a21caf' },
  Incomplete: { dot: '#94a3b8', bg: '#1e293b', bgL: '#f8fafc', text: '#94a3b8', textL: '#64748b' },
  NoRating:   { dot: '#475569', bg: '#1e293b', bgL: '#f8fafc', text: '#64748b', textL: '#94a3b8' },
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

const CloseButton = ({ onClose, isDark }: { onClose: () => void; isDark: boolean }) => {
  const [hovered, setHovered] = useState(false)
  const tk = t(isDark)
  return (
    <button
      onClick={onClose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent',
        border:       'none',
        cursor:       'pointer',
        width:        '28px',
        height:       '28px',
        borderRadius: '6px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        color:        hovered ? tk.textPrimary : tk.textMuted,
        flexShrink:   0,
        transition:   'all 0.15s ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

const RatingBadge = ({ rating, isDark }: { rating: string; isDark: boolean }) => {
  const c = ratingConfig[rating] ?? ratingConfig.NoRating
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      fontSize:     '11px',
      fontWeight:   600,
      padding:      '3px 9px',
      borderRadius: '999px',
      background:   isDark ? c.bg : c.bgL,
      color:        isDark ? c.text : c.textL,
      letterSpacing: '0.3px',
    }}>
      <span style={{
        width:        '5px',
        height:       '5px',
        borderRadius: '50%',
        background:   c.dot,
        flexShrink:   0,
      }} />
      {rating}
    </span>
  )
}

type PillColor = 'neutral' | 'blue' | 'red' | 'green' | 'purple' | 'orange'

const pillPalette: Record<PillColor, { bg: string; bgL: string; text: string; textL: string }> = {
  neutral: { bg: '#1e293b', bgL: '#f1f5f9', text: '#94a3b8', textL: '#475569' },
  blue:    { bg: '#172554', bgL: '#eff6ff', text: '#93c5fd', textL: '#1d4ed8' },
  red:     { bg: '#450a0a', bgL: '#fef2f2', text: '#fca5a5', textL: '#dc2626' },
  green:   { bg: '#052e16', bgL: '#f0fdf4', text: '#86efac', textL: '#16a34a' },
  purple:  { bg: '#3b0764', bgL: '#fdf4ff', text: '#d8b4fe', textL: '#7c3aed' },
  orange:  { bg: '#431407', bgL: '#fff7ed', text: '#fdba74', textL: '#ea580c' },
}

const Pill = ({ label, isDark, color }: { label: string; isDark: boolean; color: PillColor }) => {
  const c = pillPalette[color]
  return (
    <span style={{
      fontSize:     '10px',
      fontWeight:   600,
      padding:      '2px 8px',
      borderRadius: '999px',
      background:   isDark ? c.bg : c.bgL,
      color:        isDark ? c.text : c.textL,
      letterSpacing: '0.2px',
    }}>
      {label}
    </span>
  )
}

// ─── Layout atoms ─────────────────────────────────────────────────────────────

const SectionLabel = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <div style={{
    fontSize:      '10px',
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color:         t(isDark).textMuted,
    marginBottom:  '10px',
  }}>
    {children}
  </div>
)

const Field = ({
  label, children,
}: {
  label: string; children: React.ReactNode
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <div style={{
      fontSize:      '10px',
      fontWeight:    700,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color:         '#3b82f6',
      opacity:       0.8,
    }}>
      {label}
    </div>
    <div>{children}</div>
  </div>
)

const MonoValue = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <span style={{
    fontFamily:  '"SF Mono", "Fira Code", monospace',
    fontSize:    '11px',
    color:       t(isDark).textMono,
    background:  isDark ? '#0f172a' : '#eff6ff',
    padding:     '2px 7px',
    borderRadius: '4px',
    display:     'inline-block',
  }}>
    {children}
  </span>
)

// ─── Panel shell ──────────────────────────────────────────────────────────────

const PanelShell = ({
  isDark, children,
}: {
  isDark: boolean; children: React.ReactNode
}) => (
  <div style={{
    width:         '340px',
    height:        '100%',
    background:    t(isDark).bg,
    borderLeft:    `1px solid ${t(isDark).border}`,
    display:       'flex',
    flexDirection: 'column',
    flexShrink:    0,
    overflow:      'hidden',
    fontFamily:    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }}>
    {children}
  </div>
)

const PanelBody = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    flex:      1,
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: '#334155 transparent',
  } as React.CSSProperties}>
    {children}
  </div>
)

const Section = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <div style={{
    padding:      '16px 20px',
    borderBottom: `1px solid ${t(isDark).border}`,
  }}>
    {children}
  </div>
)

// ─── Panel header ─────────────────────────────────────────────────────────────

const PanelHeader = ({
  kind, name, isDark, onClose, accentColor = '#3b82f6',
}: {
  kind:          string
  name:          string
  isDark:        boolean
  onClose:       () => void
  accentColor?:  string
}) => {
  const tk = t(isDark)
  return (
    <div style={{
      padding:      '0 20px',
      paddingTop:   '16px',
      paddingBottom: '16px',
      borderBottom: `1px solid ${tk.border}`,
      flexShrink:   0,
      background: isDark
        ? `linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)`
        : `linear-gradient(180deg, rgba(59,130,246,0.04) 0%, transparent 100%)`,
    }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '6px',
      }}>
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '6px',
        }}>
          <div style={{
            width:        '3px',
            height:       '14px',
            borderRadius: '2px',
            background:   accentColor,
            flexShrink:   0,
          }} />
          <span style={{
            fontSize:      '10px',
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color:         accentColor,
          }}>
            {kind}
          </span>
        </div>
        <CloseButton onClose={onClose} isDark={isDark} />
      </div>

      <div style={{
        fontSize:     '17px',
        fontWeight:   700,
        color:        tk.textPrimary,
        lineHeight:   1.3,
        paddingLeft:  '9px',
      }}>
        {name}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card = ({
  isDark, accentColor, children,
}: {
  isDark:        boolean
  accentColor?:  string
  children:      React.ReactNode
}) => {
  const tk = t(isDark)
  return (
    <div style={{
      padding:      '10px 12px',
      borderRadius: '8px',
      background:   tk.bgCard,
      border:       `1px solid ${tk.borderCard}`,
      ...(accentColor ? { borderLeft: `3px solid ${accentColor}` } : {}),
    }}>
      {children}
    </div>
  )
}

// ─── SidePanel (exported) ─────────────────────────────────────────────────────

export const SidePanel = () => {
  const theme           = useProjectStore((s) => s.theme)
  const selectZone      = useProjectStore((s) => s.selectZone)
  const selectComponent = useProjectStore((s) => s.selectComponent)
  const project         = useProjectStore((s) => s.project)
  const zone            = useSelectedZone()
  const component       = useSelectedComponent()
  const isDark          = theme === 'dark'

  if (!zone && !component) return null

  if (component) {
    return (
      <ComponentPanel
        component={component}
        isDark={isDark}
        onClose={() => selectComponent(null)}
      />
    )
  }

  if (zone) {
    const childZones     = project?.SecurityZones.filter(
      (z) => z.SecurityZone?.zone_id === zone.zone_id
    ) ?? []
    const securityRating = deriveRating(zone)

    return (
      <ZonePanel
        zone={zone}
        childZones={childZones}
        securityRating={securityRating}
        isDark={isDark}
        onClose={() => selectZone(null)}
        onSelectZone={(id) => selectZone(id)}
      />
    )
  }

  return null
}

// ─── Component Panel ──────────────────────────────────────────────────────────

const ComponentPanel = ({
  component, isDark, onClose,
}: {
  component: TraxSWComponent
  isDark:    boolean
  onClose:   () => void
}) => {
  const tk        = t(isDark)
  const isInScope = component.scope === 'In_Scope'

  const grouped = (component.LogicalInterfaces ?? []).reduce<
    Record<string, TraxLogicalInterface[]>
  >((acc, li) => {
    const key = li.softwareAttackSurfaceType ?? 'Undetermined'
    if (!acc[key]) acc[key] = []
    acc[key].push(li)
    return acc
  }, {})

  return (
    <PanelShell isDark={isDark}>
      <PanelHeader
        kind="SW Component"
        name={component.name}
        isDark={isDark}
        onClose={onClose}
        accentColor="#3b82f6"
      />

      <PanelBody>

        {/* ── Identity ──────────────────────────────────────────────────── */}
        <Section isDark={isDark}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Field label="Component ID">
                  <MonoValue isDark={isDark}>{component.subUnit_id}</MonoValue>
                </Field>
              </div>
              <div>
                <Field label="Scope">
                  <Pill
                    label={isInScope ? 'In Scope' : 'Out of Scope'}
                    isDark={isDark}
                    color={isInScope ? 'green' : 'neutral'}
                  />
                </Field>
              </div>
            </div>

            <Field label="Zone">
              <MonoValue isDark={isDark}>{component.SecurityZone.zone_id}</MonoValue>
            </Field>

            {component.description && (
              <Field label="Description">
                <div style={{
                  fontSize:   '13px',
                  lineHeight: 1.6,
                  color:      tk.textSecondary,
                }}>
                  {component.description}
                </div>
              </Field>
            )}

          </div>
        </Section>

        {/* ── Logical Interfaces ────────────────────────────────────────── */}
        {Object.keys(grouped).length > 0 && (
          <Section isDark={isDark}>
            <SectionLabel isDark={isDark}>
              Logical Interfaces · {component.LogicalInterfaces?.length ?? 0}
            </SectionLabel>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(grouped).map(([surfaceType, interfaces]) => {
                const color = interfaceTypeColor[surfaceType] ?? '#94a3b8'
                const label = surfaceTypeLabel[surfaceType]  ?? surfaceType

                return (
                  <div key={surfaceType}>
                    {/* Group header */}
                    <div style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '7px',
                      marginBottom: '8px',
                      paddingLeft:  '2px',
                    }}>
                      <div style={{
                        width:        '7px',
                        height:       '7px',
                        borderRadius: '50%',
                        background:   color,
                        boxShadow:    `0 0 6px ${color}88`,
                        flexShrink:   0,
                      }} />
                      <span style={{
                        fontSize:   '11px',
                        fontWeight: 700,
                        color,
                        letterSpacing: '0.2px',
                      }}>
                        {label}
                      </span>
                      <span style={{
                        fontSize:     '10px',
                        color:        tk.textMuted,
                        background:   isDark ? '#1e293b' : '#e2e8f0',
                        borderRadius: '999px',
                        padding:      '0 6px',
                        lineHeight:   '16px',
                      }}>
                        {interfaces.length}
                      </span>
                    </div>

                    {/* Interface cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {interfaces.map((li) => (
                        <InterfaceCard key={li.interface_id} li={li} isDark={isDark} color={color} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* ── Communications ────────────────────────────────────────────── */}
        {(component.InterSWCommunications?.length ?? 0) > 0 && (
          <Section isDark={isDark}>
            <SectionLabel isDark={isDark}>
              Communications · {component.InterSWCommunications!.length}
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {component.InterSWCommunications!.map((comm) => (
                <Card key={comm.communication_id} isDark={isDark}>
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'flex-start',
                    marginBottom:   '6px',
                  }}>
                    <span style={{
                      fontSize:   '12px',
                      fontWeight: 600,
                      color:      t(isDark).textPrimary,
                      lineHeight: 1.4,
                    }}>
                      {comm.name}
                    </span>
                    <span style={{
                      fontFamily:  'monospace',
                      fontSize:    '10px',
                      color:       t(isDark).textMuted,
                      marginLeft:  '8px',
                      flexShrink:  0,
                    }}>
                      {comm.communication_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <RatingBadge rating={comm.specificExposureRating_C} isDark={isDark} />
                    {comm.ProtocolType?.name && (
                      <Pill label={comm.ProtocolType.name} isDark={isDark} color="neutral" />
                    )}
                    {comm.viaUntrustedZones && (
                      <Pill label="Via Untrusted" isDark={isDark} color="red" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: '24px' }} />
      </PanelBody>
    </PanelShell>
  )
}

// ─── Interface Card ───────────────────────────────────────────────────────────

const InterfaceCard = ({
  li, isDark, color,
}: {
  li:    TraxLogicalInterface
  isDark: boolean
  color:  string
}) => {
  const tk = t(isDark)
  return (
    <Card isDark={isDark} accentColor={color}>
      {/* Name + ID row */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   li.description ? '5px' : '7px',
      }}>
        <div style={{
          fontSize:   '12px',
          fontWeight: 600,
          color:      tk.textPrimary,
          lineHeight: 1.4,
          flex:       1,
        }}>
          {li.name}
        </div>
        <span style={{
          fontFamily:  'monospace',
          fontSize:    '10px',
          color:       tk.textMuted,
          marginLeft:  '8px',
          flexShrink:  0,
        }}>
          {li.interface_id}
        </span>
      </div>

      {/* Description */}
      {li.description && (
        <div style={{
          fontSize:     '11px',
          color:        tk.textSecondary,
          lineHeight:   1.5,
          marginBottom: '7px',
        }}>
          {li.description}
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
        <RatingBadge rating={li.CALCzoneDerivedExposure_I} isDark={isDark} />
        {li.ProtocolType?.name && (
          <Pill label={li.ProtocolType.name} isDark={isDark} color="neutral" />
        )}
        {li.isManagementInterface && (
          <Pill label="Mgmt"     isDark={isDark} color="blue"   />
        )}
        {li.fromUntrustedZones && (
          <Pill label="Untrusted" isDark={isDark} color="red"   />
        )}
      </div>

      {/* Reachable from */}
      {li.ReachableFromSecurityZone && (
        <div style={{
          marginTop:  '7px',
          fontSize:   '11px',
          color:      tk.textMuted,
          display:    'flex',
          alignItems: 'center',
          gap:        '4px',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Reachable from </span>
          <span style={{ fontFamily: 'monospace', color: tk.textMono }}>
            {li.ReachableFromSecurityZone.zone_id}
          </span>
        </div>
      )}
    </Card>
  )
}

// ─── Zone Panel ───────────────────────────────────────────────────────────────

interface ZonePanelProps {
  zone:           TraxSecurityZone
  childZones:     TraxSecurityZone[]
  securityRating: string | undefined
  isDark:         boolean
  onClose:        () => void
  onSelectZone:   (id: string) => void
}

const ZonePanel = ({
  zone, childZones, securityRating, isDark, onClose, onSelectZone,
}: ZonePanelProps) => {
  const tk = t(isDark)

  return (
    <PanelShell isDark={isDark}>
      <PanelHeader
        kind="Security Zone"
        name={zone.name}
        isDark={isDark}
        onClose={onClose}
        accentColor="#8b5cf6"
      />

      <PanelBody>

        {/* ── Identity ──────────────────────────────────────────────────── */}
        <Section isDark={isDark}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <Field label="Zone ID">
              <MonoValue isDark={isDark}>{zone.zone_id}</MonoValue>
            </Field>

            <div style={{ display: 'flex', gap: '12px' }}>
              {zone.TypeOf?.name && (
                <div style={{ flex: 1 }}>
                  <Field label="Type">
                    <span style={{ fontSize: '13px', color: tk.textSecondary }}>
                      {zone.TypeOf.name}
                    </span>
                  </Field>
                </div>
              )}
              {zone.Variant?.name && (
                <div style={{ flex: 1 }}>
                  <Field label="Variant">
                    <span style={{ fontSize: '13px', color: tk.textSecondary }}>
                      {zone.Variant.name}
                    </span>
                  </Field>
                </div>
              )}
            </div>

            {zone.description && (
              <Field label="Description">
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: tk.textSecondary }}>
                  {zone.description}
                </div>
              </Field>
            )}

            {/* Flags + rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {securityRating && <RatingBadge rating={securityRating} isDark={isDark} />}
              {zone.external        && <Pill label="External"  isDark={isDark} color="orange" />}
              {zone.isNetworkZone   && <Pill label="Network"   isDark={isDark} color="blue"   />}
              {zone.isProximityZone && <Pill label="Proximity" isDark={isDark} color="purple" />}
              {zone.isHostZone      && <Pill label="Host"      isDark={isDark} color="green"  />}
            </div>

          </div>
        </Section>

        {/* ── Zone Exposures ────────────────────────────────────────────── */}
        {(zone.ZoneExposures?.length ?? 0) > 0 && (
          <Section isDark={isDark}>
            <SectionLabel isDark={isDark}>
              Exposures · {zone.ZoneExposures.length}
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {zone.ZoneExposures.map((exp: TraxZoneExposure, i: number) => {
                const rc = ratingConfig[exp.rating] ?? ratingConfig.NoRating
                return (
                  <Card key={i} isDark={isDark} accentColor={rc.dot}>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      marginBottom:   exp.description ? '5px' : '0',
                    }}>
                      <span style={{
                        fontSize:   '12px',
                        fontWeight: 600,
                        color:      tk.textPrimary,
                      }}>
                        {exp.zoneExposureType} Exposure
                      </span>
                      <RatingBadge rating={exp.rating} isDark={isDark} />
                    </div>
                    {exp.description && (
                      <div style={{
                        fontSize:  '11px',
                        color:     tk.textSecondary,
                        lineHeight: 1.5,
                        marginTop: '4px',
                      }}>
                        {exp.description}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </Section>
        )}

        {/* ── Network Interfaces ────────────────────────────────────────── */}
        {(zone.NetworkFacingInterfaces_Zone?.length ?? 0) > 0 && (
          <Section isDark={isDark}>
            <SectionLabel isDark={isDark}>
              Network Interfaces · {zone.NetworkFacingInterfaces_Zone!.length}
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {zone.NetworkFacingInterfaces_Zone!.map((iface, i) => {
                const color = getNetworkInterfaceColor(iface.subTypeN)
                return (
                  <Card key={i} isDark={isDark} accentColor={color}>

                    {/* Name + rating row */}
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      marginBottom:   '5px',
                    }}>
                      <span style={{
                        fontSize:   '12px',
                        fontWeight: 600,
                        color:      tk.textPrimary,
                        flex:       1,
                        lineHeight: 1.4,
                      }}>
                        {iface.name}
                      </span>
                      <RatingBadge rating={iface.specificExposureRating_I} isDark={isDark} />
                    </div>

                    {/* subTypeN pill */}
                    {iface.subTypeN && (
                      <div style={{ marginBottom: iface.description ? '5px' : '0' }}>
                        <span style={{
                          display:      'inline-flex',
                          alignItems:   'center',
                          gap:          '4px',
                          fontSize:     '10px',
                          fontWeight:   600,
                          padding:      '2px 7px',
                          borderRadius: '999px',
                          background:   `${color}22`,
                          color:        color,
                          border:       `1px solid ${color}44`,
                        }}>
                          <span style={{
                            width:        '5px',
                            height:       '5px',
                            borderRadius: '50%',
                            background:   color,
                            flexShrink:   0,
                          }} />
                          {iface.subTypeN}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {iface.description && (
                      <div style={{
                        fontSize:   '11px',
                        color:      tk.textSecondary,
                        lineHeight: 1.5,
                        marginTop:  '4px',
                      }}>
                        {iface.description}
                      </div>
                    )}

                  </Card>
                )
              })}
            </div>
          </Section>
        )}

        {/* ── Host Level Interfaces ─────────────────────────────────────── */}
        {(zone.HostLevelInterfaces_Zone?.length ?? 0) > 0 && (
          <Section isDark={isDark}>
            <SectionLabel isDark={isDark}>
              Host Interfaces · {zone.HostLevelInterfaces_Zone!.length}
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {zone.HostLevelInterfaces_Zone!.map((iface, i) => (
                <Card key={i} isDark={isDark} accentColor="#22c55e">

                  {/* Name + ID row */}
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'flex-start',
                    marginBottom:   iface.description ? '5px' : '7px',
                  }}>
                    <span style={{
                      fontSize:   '12px',
                      fontWeight: 600,
                      color:      tk.textPrimary,
                      flex:       1,
                      lineHeight: 1.4,
                    }}>
                      {iface.name}
                    </span>
                    <span style={{
                      fontFamily:  'monospace',
                      fontSize:    '10px',
                      color:       tk.textMuted,
                      marginLeft:  '8px',
                      flexShrink:  0,
                    }}>
                      {iface.interface_id}
                    </span>
                  </div>

                  {/* Description */}
                  {iface.description && (
                    <div style={{
                      fontSize:     '11px',
                      color:        tk.textSecondary,
                      lineHeight:   1.5,
                      marginBottom: '7px',
                    }}>
                      {iface.description}
                    </div>
                  )}

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <RatingBadge rating={iface.specificExposureRating_I} isDark={isDark} />
                    {iface.isManagementInterface && (
                      <Pill label="Mgmt"         isDark={isDark} color="blue"    />
                    )}
                    {iface.inScope === false && (
                      <Pill label="Out of Scope" isDark={isDark} color="neutral" />
                    )}
                  </div>

                  {/* Connected zone */}
                  {iface.ConnectedToSecurityZone && (
                    <div style={{
                      marginTop:  '7px',
                      fontSize:   '11px',
                      color:      tk.textMuted,
                      display:    'flex',
                      alignItems: 'center',
                      gap:        '4px',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Connected to </span>
                      <span style={{ fontFamily: 'monospace', color: tk.textMono }}>
                        {iface.ConnectedToSecurityZone.zone_id}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  {iface.message && (
                    <div style={{
                      marginTop:  '6px',
                      fontSize:   '11px',
                      color:      tk.textMuted,
                      fontStyle:  'italic',
                      lineHeight: 1.4,
                    }}>
                      {iface.message}
                    </div>
                  )}

                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* ── Sub-Zones ─────────────────────────────────────────────────── */}
        {childZones.length > 0 && (
          <Section isDark={isDark}>
            <SectionLabel isDark={isDark}>
              Sub-Zones · {childZones.length}
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {childZones.map((child, i) => (
                <SubZoneRow
                  key={i}
                  child={child}
                  isDark={isDark}
                  onClick={() => onSelectZone(child.zone_id)}
                />
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: '24px' }} />
      </PanelBody>
    </PanelShell>
  )
}

// ─── Sub-Zone Row ─────────────────────────────────────────────────────────────

const SubZoneRow = ({
  child, isDark, onClick,
}: {
  child:   TraxSecurityZone
  isDark:  boolean
  onClick: () => void
}) => {
  const [hovered, setHovered] = useState(false)
  const tk = t(isDark)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:        '9px 12px',
        borderRadius:   '8px',
        background:     hovered ? tk.bgCardHover : tk.bgCard,
        border:         `1px solid ${hovered ? '#8b5cf6' : tk.borderCard}`,
        cursor:         'pointer',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        transition:     'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z"
            stroke="#8b5cf6"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 500, color: tk.textPrimary }}>
          {child.name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize:   '10px',
          color:      tk.textMuted,
        }}>
          {child.zone_id}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3 2l4 3-4 3" stroke={tk.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}