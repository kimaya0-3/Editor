// src/components/Editor/ComponentEditor.tsx
import { useCallback } from 'react'
import { useProjectStore, makeInterfaceId } from '../../store/projectStore'
import type {
  TraxSWComponent,
  TraxLogicalInterface,
} from '../../types/index'

interface ComponentEditorProps {
  component: TraxSWComponent
  isDark:    boolean
}


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

// ─── ComponentEditor ──────────────────────────────────────────────────────────

export const ComponentEditor = ({ component, isDark }: ComponentEditorProps) => {
  const updateComponent       = useProjectStore((s) => s.updateComponent)
  const addLogicalInterface   = useProjectStore((s) => s.addLogicalInterface)
  const updateLogicalInterface = useProjectStore((s) => s.updateLogicalInterface)
  const deleteLogicalInterface = useProjectStore((s) => s.deleteLogicalInterface)
  const f                     = makeFieldStyles(isDark)

  const patch = useCallback(
    (partial: Partial<TraxSWComponent>) =>
      updateComponent(component.subUnit_id, partial),
    [updateComponent, component.subUnit_id],
  )

  const addInterface = useCallback(() => {
    const iface: TraxLogicalInterface = {
      interface_id:              makeInterfaceId(),
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
              style={{ ...f.input, opacity: 0.5, cursor: 'not-allowed' }}
              value={component.subUnit_id}
              readOnly
            />
          </div>

          {/* Zone ID — read-only */}
          <div style={f.wrapper}>
            <label style={f.label}>Zone</label>
            <input
              style={{ ...f.input, opacity: 0.5, cursor: 'not-allowed' }}
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

      {/* ── Logical Interfaces ─────────────────────────────────────────── */}
      <div>
        <div style={f.sectionTitle}>
          Logical Interfaces ({component.LogicalInterfaces?.length ?? 0})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(component.LogicalInterfaces ?? []).map((iface) => (
            <LogicalInterfaceRow
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
            + Add Logical Interface
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── LogicalInterfaceRow ──────────────────────────────────────────────────────

interface LogicalInterfaceRowProps {
  iface:    TraxLogicalInterface
  isDark:   boolean
  f:        ReturnType<typeof makeFieldStyles>
  onChange: (partial: Partial<TraxLogicalInterface>) => void
  onDelete: () => void
}

const SURFACE_TYPES = [
  { value: 'Network_Interface_API',           label: 'Network Interface API'        },
  { value: 'User_Interface_over_network',     label: 'User Interface (Network)'     },
  { value: 'User_Interface_from_Proximity',   label: 'User Interface (Proximity)'   },
  { value: 'Technical_interface_from_proximity', label: 'Technical (Proximity)'     },
  { value: 'Dependency_on_Host',              label: 'Dependency on Host'           },
  { value: 'Undetermined',                    label: 'Undetermined'                 },
]

const RATINGS = [
  { value: 'NoRating',   label: 'No Rating'   },
  { value: 'Low',        label: 'Low'          },
  { value: 'Medium',     label: 'Medium'       },
  { value: 'High',       label: 'High'         },
  { value: 'Incomplete', label: 'Incomplete'   },
]

const LogicalInterfaceRow = ({
  iface, isDark, f, onChange, onDelete,
}: LogicalInterfaceRowProps) => (
  <div style={{
    padding:       '10px 12px',
    borderRadius:  '8px',
    border:        `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background:    isDark ? '#0b1120' : '#f8fafc',
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  }}>

    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{
        fontSize:   '10px',
        fontFamily: 'monospace',
        color:      isDark ? '#475569' : '#94a3b8',
      }}>
        {iface.interface_id}
      </span>
      <button
        onClick={onDelete}
        style={{
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          color:      isDark ? '#475569' : '#94a3b8',
          fontSize:   '13px',
          padding:    '0 2px',
          lineHeight: 1,
        }}
        title="Remove interface"
      >
        ✕
      </button>
    </div>

    {/* Name */}
    <div style={f.wrapper}>
      <label style={f.label}>Name</label>
      <input
        style={f.input}
        value={iface.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Interface name"
      />
    </div>

    {/* Description */}
    <div style={f.wrapper}>
      <label style={f.label}>Description</label>
      <textarea
        style={{ ...f.textarea, minHeight: '48px' }}
        value={iface.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Optional…"
      />
    </div>

    {/* Surface type */}
    <div style={f.wrapper}>
      <label style={f.label}>Surface Type</label>
      <select
        style={f.select}
        value={iface.softwareAttackSurfaceType}
        onChange={(e) =>
          onChange({
            softwareAttackSurfaceType:
              e.target.value as TraxLogicalInterface['softwareAttackSurfaceType'],
          })
        }
      >
        {SURFACE_TYPES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>

    {/* Exposure rating */}
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
    </div>

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

    {/* Checkboxes */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {(
        [
          { key: 'isManagementInterface', label: 'Management Interface' },
          { key: 'fromUntrustedZones',    label: 'From Untrusted Zones' },
        ] as { key: keyof TraxLogicalInterface; label: string }[]
      ).map(({ key, label }) => (
        <label
          key={key}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={!!iface[key]}
            onChange={(e) => onChange({ [key]: e.target.checked })}
            style={{ width: '14px', height: '14px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#334155' }}>
            {label}
          </span>
        </label>
      ))}
    </div>

  </div>
)