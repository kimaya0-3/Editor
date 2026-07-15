// src/components/Editor/ComponentEditor.tsx

import { useCallback } from 'react'
import { useProjectStore, makeInterfaceId } from '../../store/projectStore'
import type {
  TraxSWComponent,
  TraxLogicalInterface,
  AbstractInterfaceType,
  SoftwareAttackSurfaceType,
} from '../../types/index'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ComponentEditorProps {
  component: TraxSWComponent
  isDark:    boolean
}

// ─── Surface type → abstract type mapping ─────────────────────────────────────
// Keeps abstractInterfaceType in sync when surface type changes.

const surfaceToAbstract = (
  surface: SoftwareAttackSurfaceType,
): AbstractInterfaceType => {
  switch (surface) {
    case 'Network_Interface_API':
    case 'User_Interface_over_network':
      return 'Network'
    case 'User_Interface_from_Proximity':
    case 'Technical_interface_from_proximity':
      return 'Proximity'
    case 'Dependency_on_Host':
      return 'Host'
    case 'Undetermined':
    default:
      return 'Network'
  }
}

// ─── Field styles ─────────────────────────────────────────────────────────────

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
  hint: {
    fontSize:   '10px',
    color:      isDark ? '#334155' : '#cbd5e1',
    marginTop:  '3px',
    lineHeight: 1.4,
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
  addBtn: {
    padding:      '7px 12px',
    borderRadius: '7px',
    border:       `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
    background:   'transparent',
    color:        isDark ? '#475569' : '#94a3b8',
    fontSize:     '12px',
    cursor:       'pointer',
    fontFamily:   'sans-serif',
    width:        '100%',
  },
})

// ─── Surface type options — labels match TRA-X dialog exactly ─────────────────

const SURFACE_TYPES: {
  value: SoftwareAttackSurfaceType
  label: string
}[] = [
  { value: 'Network_Interface_API',              label: 'Network Interface API'       },
  { value: 'User_Interface_over_network',        label: 'User Interface (Network)'    },
  { value: 'User_Interface_from_Proximity',      label: 'User Interface (Proximity)'  },
  { value: 'Technical_interface_from_proximity', label: 'Technical (Proximity)'       },
  { value: 'Dependency_on_Host',                 label: 'Dependency on Host'          },
  { value: 'Undetermined',                       label: 'Undetermined'                },
]

// ─── Exposure rating options ───────────────────────────────────────────────────

const RATINGS: { value: string; label: string }[] = [
  { value: 'NoRating',   label: 'No Rating (inherit from zone)' },
  { value: 'Low',        label: 'Low'                           },
  { value: 'Medium',     label: 'Medium'                        },
  { value: 'High',       label: 'High'                          },
  { value: 'Incomplete', label: 'Incomplete'                    },
]

// ─── ComponentEditor ──────────────────────────────────────────────────────────

export const ComponentEditor = ({ component, isDark }: ComponentEditorProps) => {
  const updateComponent        = useProjectStore((s) => s.updateComponent)
  const addLogicalInterface    = useProjectStore((s) => s.addLogicalInterface)
  const updateLogicalInterface = useProjectStore((s) => s.updateLogicalInterface)
  const deleteLogicalInterface = useProjectStore((s) => s.deleteLogicalInterface)
  const f                      = makeFieldStyles(isDark)

  const patch = useCallback(
    (partial: Partial<TraxSWComponent>) =>
      updateComponent(component.subUnit_id, partial),
    [updateComponent, component.subUnit_id],
  )

  const addInterface = useCallback(() => {
    const iface: TraxLogicalInterface = {
      interface_id:              makeInterfaceId(component.subUnit_id),
      name:                      'New Interface',
      description:               '',
      softwareAttackSurfaceType: 'Network_Interface_API',
      abstractInterfaceType:     'Network',
      specificExposureRating_I:  'NoRating',
      CALCzoneDerivedExposure_I: 'NoRating',
      isManagementInterface:     false,
      fromUntrustedZones:        false,
    }
    addLogicalInterface(component.subUnit_id, iface)
  }, [addLogicalInterface, component.subUnit_id])

  const interfaces = component.LogicalInterfaces ?? []

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>Identity</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Component ID — read-only */}
          <div style={f.wrapper}>
            <label style={f.label}>Component ID</label>
            <input
              style={f.inputReadOnly}
              value={component.subUnit_id}
              readOnly
            />
          </div>

          {/* Zone ID — read-only */}
          <div style={f.wrapper}>
            <label style={f.label}>Zone</label>
            <input
              style={f.inputReadOnly}
              value={component.SecurityZone.zone_id}
              readOnly
            />
          </div>

          {/* Name */}
          <div style={f.wrapper}>
            <label style={f.label}>Name</label>
            <input
              style={f.input}
              value={component.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Component name"
            />
          </div>

          {/* Description */}
          <div style={f.wrapper}>
            <label style={f.label}>Description</label>
            <textarea
              style={f.textarea}
              value={component.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Optional description…"
            />
          </div>

          {/* Scope */}
          <div style={f.wrapper}>
            <label style={f.label}>Scope</label>
            <select
              style={f.select}
              value={component.scope}
              onChange={(e) =>
                patch({ scope: e.target.value as TraxSWComponent['scope'] })
              }
            >
              <option value="In_Scope">In Scope</option>
              <option value="Out_of_Scope">Out of Scope</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── Interfaces ─────────────────────────────────────────────────── */}

      <div>
        <div style={f.sectionTitle}>
          Interfaces ({interfaces.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {interfaces.map((iface) => (
            <InterfaceRow
              key={iface.interface_id}
              iface={iface}
              isDark={isDark}
              f={f}
              onChange={(partial) =>
                updateLogicalInterface(
                  component.subUnit_id,
                  iface.interface_id,
                  partial,
                )
              }
              onDelete={() =>
                deleteLogicalInterface(component.subUnit_id, iface.interface_id)
              }
            />
          ))}

          <button style={f.addBtn} onClick={addInterface}>
            + Add Interface
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── InterfaceRow ─────────────────────────────────────────────────────────────

interface InterfaceRowProps {
  iface:    TraxLogicalInterface
  isDark:   boolean
  f:        ReturnType<typeof makeFieldStyles>
  onChange: (partial: Partial<TraxLogicalInterface>) => void
  onDelete: () => void
}

const InterfaceRow = ({ iface, isDark, f, onChange, onDelete }: InterfaceRowProps) => {
  // Only Network interfaces show protocol / management / untrusted fields
  const isNetwork   = iface.abstractInterfaceType === 'Network'

  // When surface type changes, auto-sync the abstract type
  const handleSurfaceChange = (value: string) => {
    const surface  = value as SoftwareAttackSurfaceType
    const abstract = surfaceToAbstract(surface)
    onChange({
      softwareAttackSurfaceType: surface,
      abstractInterfaceType:     abstract,
    })
  }

  return (
    <div style={{
      padding:       '10px 12px',
      borderRadius:  '8px',
      border:        `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
      background:    isDark ? '#0b1120' : '#f8fafc',
      display:       'flex',
      flexDirection: 'column',
      gap:           '8px',
    }}>

      {/* ── Row header: ID + abstract type badge + delete ──────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{
            fontSize:    '10px',
            fontFamily:  'monospace',
            color:       isDark ? '#475569' : '#94a3b8',
            flexShrink:  0,
          }}>
            {iface.interface_id}
          </span>

          {/* Abstract type badge — visual indicator */}
          <span style={{
            fontSize:     '9px',
            fontWeight:   700,
            letterSpacing:'0.5px',
            textTransform:'uppercase' as const,
            padding:      '2px 6px',
            borderRadius: '4px',
            flexShrink:   0,
            background:
              iface.abstractInterfaceType === 'Network'   ? (isDark ? '#1e3a5f' : '#dbeafe') :
              iface.abstractInterfaceType === 'Proximity' ? (isDark ? '#2d1b4e' : '#ede9fe') :
                                                            (isDark ? '#1a2e1a' : '#dcfce7'),
            color:
              iface.abstractInterfaceType === 'Network'   ? (isDark ? '#60a5fa' : '#1d4ed8') :
              iface.abstractInterfaceType === 'Proximity' ? (isDark ? '#a78bfa' : '#6d28d9') :
                                                            (isDark ? '#4ade80' : '#15803d'),
          }}>
            {iface.abstractInterfaceType}
          </span>
        </div>

        <button
          onClick={onDelete}
          title="Remove interface"
          style={{
            background: 'transparent',
            border:     'none',
            cursor:     'pointer',
            color:      isDark ? '#475569' : '#94a3b8',
            fontSize:   '13px',
            padding:    '0 2px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Name ───────────────────────────────────────────────────────── */}
      <div style={f.wrapper}>
        <label style={f.label}>Name</label>
        <input
          style={f.input}
          value={iface.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Interface name"
        />
      </div>

      {/* ── Description ────────────────────────────────────────────────── */}
      <div style={f.wrapper}>
        <label style={f.label}>Description</label>
        <textarea
          style={{ ...f.textarea, minHeight: '48px' }}
          value={iface.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional…"
        />
      </div>

      {/* ── Surface Type ───────────────────────────────────────────────── */}
      {/* Changing this auto-updates abstractInterfaceType                 */}
      <div style={f.wrapper}>
        <label style={f.label}>Interface Type</label>
        <select
          style={f.select}
          value={iface.softwareAttackSurfaceType}
          onChange={(e) => handleSurfaceChange(e.target.value)}
        >
          {SURFACE_TYPES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* ── Exposure Rating ────────────────────────────────────────────── */}
      {/* "No Rating" means inherit from zone — per spec point 3           */}
      <div style={f.wrapper}>
        <label style={f.label}>Exposure Rating</label>
        <select
          style={f.select}
          value={iface.specificExposureRating_I}
          onChange={(e) =>
            onChange({
              specificExposureRating_I:
                e.target.value as TraxLogicalInterface['specificExposureRating_I'],
            })
          }
        >
          {RATINGS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {iface.specificExposureRating_I === 'NoRating' && (
          <div style={f.hint}>
            Zone exposure rating will be used as the effective rating.
          </div>
        )}
      </div>

      {/* ── Network-only fields ────────────────────────────────────────── */}
      {/* Per spec point 4: only relevant for network interfaces           */}
      {isNetwork && (
        <>
          {/* Protocol */}
          <div style={f.wrapper}>
            <label style={f.label}>Protocol</label>
            <input
              style={f.input}
              value={iface.ProtocolType?.name ?? ''}
              onChange={(e) =>
                onChange({
                  ProtocolType: e.target.value ? { name: e.target.value } : undefined,
                })
              }
              placeholder="e.g. HTTPS, SSH, MQTT…"
            />
          </div>

          {/* Management Interface + From Untrusted Zones checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={iface.isManagementInterface}
                onChange={(e) => onChange({ isManagementInterface: e.target.checked })}
                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#334155' }}>
                Management Interface
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={iface.fromUntrustedZones}
                onChange={(e) => onChange({ fromUntrustedZones: e.target.checked })}
                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#334155' }}>
                From Untrusted Zones
              </span>
            </label>
          </div>
        </>
      )}

    </div>
  )
}