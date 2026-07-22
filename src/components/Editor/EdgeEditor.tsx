// src/components/Editor/EdgeEditor.tsx

import { useCallback, useMemo } from 'react'
import { useProjectStore }      from '../../store/projectStore'
import type {
  TraxInterSWCommunication,
  TraxZoneCommunication,
} from '../../types/index'

// ─── Props ────────────────────────────────────────────────────────────────────

interface EdgeEditorProps {
  comm:   TraxInterSWCommunication | TraxZoneCommunication
  kind:   'component' | 'zone'
  isDark: boolean
}

// ─── Shared field styles ──────────────────────────────────────────────────────

const makeFieldStyles = (isDark: boolean) => ({
  wrapper: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           '4px',
  },
  label: {
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color:         isDark ? '#475569' : '#94a3b8',
  },
  input: {
    width:        '100%',
    padding:      '7px 10px',
    borderRadius: '7px',
    border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    outline:      'none',
    boxSizing:    'border-box' as const,
  },
  inputReadOnly: {
    width:        '100%',
    padding:      '7px 10px',
    borderRadius: '7px',
    border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    outline:      'none',
    boxSizing:    'border-box' as const,
    opacity:      0.5,
    cursor:       'not-allowed' as const,
  },
  textarea: {
    width:        '100%',
    padding:      '7px 10px',
    borderRadius: '7px',
    border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    outline:      'none',
    resize:       'vertical' as const,
    minHeight:    '64px',
    boxSizing:    'border-box' as const,
  },
  select: {
    width:        '100%',
    padding:      '7px 10px',
    borderRadius: '7px',
    border:       `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    outline:      'none',
    cursor:       'pointer',
    boxSizing:    'border-box' as const,
  },
  sectionTitle: {
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color:         isDark ? '#3b82f6' : '#2563eb',
    paddingBottom: '8px',
    borderBottom:  `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
    marginBottom:  '12px',
  },
  hint: {
    fontSize:  '10px',
    color:     isDark ? '#334155' : '#cbd5e1',
    marginTop: '4px',
  },
})

// ─── Rating options ───────────────────────────────────────────────────────────

const RATINGS = [
  { value: 'NoRating',   label: 'No Rating'  },
  { value: 'Low',        label: 'Low'         },
  { value: 'Medium',     label: 'Medium'      },
  { value: 'High',       label: 'High'        },
  { value: 'Incomplete', label: 'Incomplete'  },
]

// ─── EdgeEditor ───────────────────────────────────────────────────────────────

export const EdgeEditor = ({ comm, kind, isDark }: EdgeEditorProps) => {
  const f = makeFieldStyles(isDark)

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {kind === 'component'
        ? <ComponentCommEditor comm={comm as TraxInterSWCommunication} isDark={isDark} f={f} />
        : <ZoneCommEditor      comm={comm as TraxZoneCommunication}    isDark={isDark} f={f} />
      }
    </div>
  )
}

// ─── Component Communication Editor ──────────────────────────────────────────
// Handles TraxInterSWCommunication — has protocol, exposure comment, etc.

const ComponentCommEditor = ({
  comm, isDark, f,
}: {
  comm:   TraxInterSWCommunication
  isDark: boolean
  f:      ReturnType<typeof makeFieldStyles>
}) => {
  const updateCommunication = useProjectStore((s) => s.updateCommunication)
  const project             = useProjectStore((s) => s.project)

  const allComponents = project?.SWComponents ?? []
  const ownerComponentId = useMemo(() => {
    if (!project) return ''
    return project.SWComponents.find((c) =>
      (c.InterSWCommunications ?? []).some((cm) => cm.communication_id === comm.communication_id)
    )?.subUnit_id ?? ''
  }, [project, comm.communication_id])

  const currentSourceComponentId = comm.SourceComponent?.subUnit_id ?? ownerComponentId

  const sourceSelectionOptions = useMemo(() => {
    const currentSourceComponent = allComponents.find(
      (c) => c.subUnit_id === currentSourceComponentId
    )

    const sourceComponent = currentSourceComponent ?? allComponents[0]
    if (!sourceComponent) return []

    const sourceLabel = sourceComponent.name?.trim() || sourceComponent.subUnit_id

    const base = [{
      value: `${sourceComponent.subUnit_id}::none`,
      label: sourceLabel,
    }]

    const networkInterfaces = (sourceComponent.LogicalInterfaces ?? []).filter(
      (iface) => iface.abstractInterfaceType === 'Network'
    )

    const withInterfaces = networkInterfaces.map((iface) => ({
      value: `${sourceComponent.subUnit_id}::${iface.interface_id}`,
      label: `${sourceLabel} - ${iface.name}`,
    }))

    return [...base, ...withInterfaces]
  }, [allComponents, currentSourceComponentId])

  const rawSourceSelectionValue = `${currentSourceComponentId}::${comm.SourceInterface?.interface_id ?? 'none'}`
  const fallbackPlainSourceValue = sourceSelectionOptions.find(
    (o) => o.value === `${currentSourceComponentId}::none`
  )?.value
    ?? sourceSelectionOptions.find((o) => o.value.endsWith('::none'))?.value
    ?? sourceSelectionOptions[0]?.value
    ?? ''

  const sourceSelectionValue = sourceSelectionOptions.some((o) => o.value === rawSourceSelectionValue)
    ? rawSourceSelectionValue
    : fallbackPlainSourceValue

  // Find the component that owns the TargetInterface
  const targetComp = useMemo(() => {
    if (!project) return null
    return (
      project.SWComponents.find((c) =>
        c.LogicalInterfaces?.some(
          (li) => li.interface_id === comm.TargetInterface.interface_id
        )
      ) ?? null
    )
  }, [project, comm.TargetInterface.interface_id])

  const targetInterfaces = targetComp?.LogicalInterfaces ?? []

  const patch = useCallback(
    (partial: Partial<TraxInterSWCommunication>) =>
      updateCommunication(comm.communication_id, partial),
    [updateCommunication, comm.communication_id],
  )

  return (
    <>
      {/* ── Identity ─────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Communication</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ID — read-only */}
          <div style={f.wrapper}>
            <label style={f.label}>Communication ID</label>
            <input
              style={f.inputReadOnly}
              value={comm.communication_id}
              readOnly
            />
          </div>

          {/* Source Component / Interface — editable dropdown */}
          {sourceSelectionOptions.length > 0 && (
            <div style={f.wrapper}>
              <label style={f.label}>Source</label>
              <select
                style={f.select}
                value={sourceSelectionValue}
                onChange={(e) => {
                  const [subUnitId, interfaceId] = e.target.value.split('::')
                  patch({
                    SourceComponent: { subUnit_id: subUnitId },
                    SourceInterface: interfaceId && interfaceId !== 'none'
                      ? { interface_id: interfaceId }
                      : undefined,
                  })
                }}
              >
                {sourceSelectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Interface — editable dropdown */}
          <div style={f.wrapper}>
            <label style={f.label}>Target Interface</label>
            {targetInterfaces.length > 0 ? (
              <>
                <select
                  style={f.select}
                  value={comm.TargetInterface.interface_id}
                  onChange={(e) =>
                    patch({ TargetInterface: { interface_id: e.target.value } })
                  }
                >
                  {targetInterfaces.map((iface) => (
                    <option key={iface.interface_id} value={iface.interface_id}>
                      {iface.name} - {iface.interface_id}
                    </option>
                  ))}
                </select>
                {targetComp && (
                  <div style={f.hint}>Interfaces on {targetComp.name}</div>
                )}
              </>
            ) : (
              <input
                style={f.inputReadOnly}
                value={comm.TargetInterface.interface_id}
                readOnly
              />
            )}
          </div>

          {/* Name */}
          <div style={f.wrapper}>
            <label style={f.label}>Name</label>
            <input
              style={f.input}
              value={comm.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Communication name"
            />
          </div>

          {/* Description */}
          <div style={f.wrapper}>
            <label style={f.label}>Description</label>
            <textarea
              style={f.textarea}
              value={comm.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Optional description…"
            />
          </div>

        </div>
      </div>

      {/* ── Exposure ─────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Exposure</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={f.wrapper}>
            <label style={f.label}>Exposure Rating</label>
            <select
              style={f.select}
              value={comm.specificExposureRating_C}
              onChange={(e) =>
                patch({
                  specificExposureRating_C:
                    e.target.value as TraxInterSWCommunication['specificExposureRating_C'],
                })
              }
            >
              {RATINGS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* specificExposureComment_C only exists on component comms */}
          <div style={f.wrapper}>
            <label style={f.label}>Exposure Comment</label>
            <textarea
              style={{ ...f.textarea, minHeight: '52px' }}
              value={comm.specificExposureComment_C ?? ''}
              onChange={(e) =>
                patch({ specificExposureComment_C: e.target.value || undefined })
              }
              placeholder="Optional comment…"
            />
          </div>

        </div>
      </div>

      {/* ── Protocol & Flags ─────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Protocol & Flags</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ProtocolType only exists on component comms */}
          <div style={f.wrapper}>
            <label style={f.label}>Protocol</label>
            <input
              style={f.input}
              value={comm.ProtocolType?.name ?? ''}
              onChange={(e) =>
                patch({
                  ProtocolType: e.target.value ? { name: e.target.value } : undefined,
                })
              }
              placeholder="e.g. HTTPS, MQTT, S7…"
            />
          </div>

          {/* protocolOther only exists on component comms */}
          <div style={f.wrapper}>
            <label style={f.label}>Protocol (other)</label>
            <input
              style={f.input}
              value={comm.protocolOther ?? ''}
              onChange={(e) =>
                patch({ protocolOther: e.target.value || undefined })
              }
              placeholder="Free-text protocol name…"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={comm.viaUntrustedZones}
              onChange={(e) => patch({ viaUntrustedZones: e.target.checked })}
              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#334155' }}>
              Via Untrusted Zones
            </span>
          </label>

        </div>
      </div>
    </>
  )
}

// ─── Zone Communication Editor ────────────────────────────────────────────────
// Handles TraxZoneCommunication — only has: name, description,
// specificExposureRating_C, viaUntrustedZones, TargetZone, SourceZone
// NO specificExposureComment_C, NO ProtocolType, NO protocolOther

const ZoneCommEditor = ({
  comm, isDark, f,
}: {
  comm:   TraxZoneCommunication
  isDark: boolean
  f:      ReturnType<typeof makeFieldStyles>
}) => {
  const updateZoneCommunication = useProjectStore((s) => s.updateZoneCommunication)
  const project                 = useProjectStore((s) => s.project)

  const allZones = project?.SecurityZones ?? []
  const sourceZone = comm.SourceZone
    ? allZones.find((z) => z.zone_id === comm.SourceZone?.zone_id)
    : null
  const targetZone = allZones.find((z) => z.zone_id === comm.TargetZone.zone_id) ?? null

  const sourceInterfaces = sourceZone?.ZoneInterfaces ?? []
  const targetInterfaces = targetZone?.ZoneInterfaces ?? []

  const patch = useCallback(
    (partial: Partial<TraxZoneCommunication>) =>
      updateZoneCommunication(comm.communication_id, partial),
    [updateZoneCommunication, comm.communication_id],
  )

  return (
    <>
      {/* ── Identity ─────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Zone Communication</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ID — read-only */}
          <div style={f.wrapper}>
            <label style={f.label}>Communication ID</label>
            <input
              style={f.inputReadOnly}
              value={comm.communication_id}
              readOnly
            />
          </div>

          {/* Source Zone — editable dropdown */}
          {comm.SourceZone && (
            <div style={f.wrapper}>
              <label style={f.label}>Source Zone</label>
              <select
                style={f.select}
                value={comm.SourceZone.zone_id}
                onChange={(e) =>
                  patch({ SourceZone: { zone_id: e.target.value } })
                }
              >
                {allZones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {comm.SourceZone && (
            <div style={f.wrapper}>
              <label style={f.label}>Source Interface</label>
              {sourceInterfaces.length > 0 ? (
                <select
                  style={f.select}
                  value={comm.SourceInterface?.interface_id ?? sourceInterfaces[0].interface_id}
                  onChange={(e) =>
                    patch({ SourceInterface: { interface_id: e.target.value } })
                  }
                >
                  {sourceInterfaces.map((iface) => (
                    <option key={iface.interface_id} value={iface.interface_id}>
                      {iface.name} - {iface.interface_id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={f.inputReadOnly}
                  value={comm.SourceInterface?.interface_id ?? ''}
                  readOnly
                  placeholder="No zone interfaces"
                />
              )}
            </div>
          )}

          {/* Target Zone — editable dropdown */}
          {comm.TargetZone && (
            <div style={f.wrapper}>
              <label style={f.label}>Target Zone</label>
              <select
                style={f.select}
                value={comm.TargetZone.zone_id}
                onChange={(e) =>
                  patch({ TargetZone: { zone_id: e.target.value } })
                }
              >
                {allZones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {comm.TargetZone && (
            <div style={f.wrapper}>
              <label style={f.label}>Target Interface</label>
              {targetInterfaces.length > 0 ? (
                <select
                  style={f.select}
                  value={comm.TargetInterface?.interface_id ?? targetInterfaces[0].interface_id}
                  onChange={(e) =>
                    patch({ TargetInterface: { interface_id: e.target.value } })
                  }
                >
                  {targetInterfaces.map((iface) => (
                    <option key={iface.interface_id} value={iface.interface_id}>
                      {iface.name} - {iface.interface_id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={f.inputReadOnly}
                  value={comm.TargetInterface?.interface_id ?? ''}
                  readOnly
                  placeholder="No zone interfaces"
                />
              )}
            </div>
          )}

          {/* Name */}
          <div style={f.wrapper}>
            <label style={f.label}>Name</label>
            <input
              style={f.input}
              value={comm.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Communication name"
            />
          </div>

          {/* Description */}
          <div style={f.wrapper}>
            <label style={f.label}>Description</label>
            <textarea
              style={f.textarea}
              value={comm.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Optional description…"
            />
          </div>

        </div>
      </div>

      {/* ── Exposure ─────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Exposure</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* specificExposureRating_C — exists on zone comms */}
          <div style={f.wrapper}>
            <label style={f.label}>Exposure Rating</label>
            <select
              style={f.select}
              value={comm.specificExposureRating_C}
              onChange={(e) =>
                patch({
                  specificExposureRating_C:
                    e.target.value as TraxZoneCommunication['specificExposureRating_C'],
                })
              }
            >
              {RATINGS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* viaUntrustedZones — exists on zone comms */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={comm.viaUntrustedZones ?? false}
              onChange={(e) => patch({ viaUntrustedZones: e.target.checked })}
              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#334155' }}>
              Via Untrusted Zones
            </span>
          </label>

        </div>
      </div>
    </>
  )
}