// ============================================================
// TRA-X COMPLETE TYPE SYSTEM
// ============================================================

// ============================================================
// SECTION 1 — CONST ENUMS (erasableSyntaxOnly compatible)
// Using const objects + type unions instead of enum keyword
// ============================================================

export const TraxStatus = {
  InProgress: "In_Progress",
  Completed:  "Completed",
  Approved:   "Approved",
} as const
export type TraxStatus = typeof TraxStatus[keyof typeof TraxStatus]

export const ComponentScope = {
  InScope:    "In_Scope",
  OutOfScope: "Out_of_Scope",
} as const
export type ComponentScope = typeof ComponentScope[keyof typeof ComponentScope]

export const ExposureRating = {
  NoRating:   "NoRating",
  Low:        "Low",
  Medium:     "Medium",
  High:       "High",
  Incomplete: "Incomplete",
} as const
export type ExposureRating = typeof ExposureRating[keyof typeof ExposureRating]

export const ZoneExposureType = {
  Network:   "Network",
  Proximity: "Proximity",
  Host:      "Host",
} as const
export type ZoneExposureType = typeof ZoneExposureType[keyof typeof ZoneExposureType]

export const SoftwareAttackSurfaceType = {
  NetworkInterfaceAPI:             "Network_Interface_API",
  UserInterfaceOverNetwork:        "User_Interface_over_network",
  UserInterfaceFromProximity:      "User_Interface_from_Proximity",
  TechnicalInterfaceFromProximity: "Technical_interface_from_proximity",
  DependencyOnHost:                "Dependency_on_Host",
  Undetermined:                    "Undetermined",
} as const
export type SoftwareAttackSurfaceType = typeof SoftwareAttackSurfaceType[keyof typeof SoftwareAttackSurfaceType]

export const AbstractInterfaceType = {
  Network:   "Network",
  Proximity: "Proximity",
  Host:      "Host",
} as const
export type AbstractInterfaceType = typeof AbstractInterfaceType[keyof typeof AbstractInterfaceType]

export const AssetType = {
  Data:          "Data",
  Functionality: "Functionality",
} as const
export type AssetType = typeof AssetType[keyof typeof AssetType]

export const ProtectionGoalType = {
  Confidentiality: "Confidentiality",
  Integrity:       "Integrity",
  Availability:    "Availability",
} as const
export type ProtectionGoalType = typeof ProtectionGoalType[keyof typeof ProtectionGoalType]

export const ImpactLevel = {
  Critical:   "Critical",
  High:       "High",
  Moderate:   "Moderate",
  Low:        "Low",
  Negligible: "Negligible",
} as const
export type ImpactLevel = typeof ImpactLevel[keyof typeof ImpactLevel]

export const ExploitabilityRating = {
  High:    "High",
  Medium:  "Medium",
  Low:     "Low",
  VeryLow: "Very_Low",
} as const
export type ExploitabilityRating = typeof ExploitabilityRating[keyof typeof ExploitabilityRating]

export const LikelihoodRating = {
  VeryLikely:   "Very_likely",
  Likely:       "Likely",
  Possible:     "Possible",
  Unlikely:     "Unlikely",
  VeryUnlikely: "Very_unlikely",
  Incomplete:   "Incomplete",
} as const
export type LikelihoodRating = typeof LikelihoodRating[keyof typeof LikelihoodRating]

export const RiskRating = {
  Critical:  "Critical",
  High:      "High",
  Moderate:  "Moderate",
  Minor:     "Minor",
  NoReRating:"No_Re_rating",
  Incomplete:"Incomplete",
} as const
export type RiskRating = typeof RiskRating[keyof typeof RiskRating]

export const AssumptionType = {
  ZoneSpecific: "ZoneSpecific",
  General:      "General",
} as const
export type AssumptionType = typeof AssumptionType[keyof typeof AssumptionType]

export const OverallProjectType = {
  DevelopmentProject: "Development_Project",
  MaintenanceProject: "Maintenance_Project",
  Other:              "Other",
} as const
export type OverallProjectType = typeof OverallProjectType[keyof typeof OverallProjectType]

export const ZoneInterfaceSubType = {
  NetworkUserInterface: "Network_User_Interface",
  C2CInterface:         "C2C_Interface",
  TechnicalInterface:   "Technical_Interface",
} as const
export type ZoneInterfaceSubType = typeof ZoneInterfaceSubType[keyof typeof ZoneInterfaceSubType]

// ============================================================
// SECTION 2 — PROJECT METADATA
// ============================================================

export interface TraxAccessScope {
  name:          string
  accessScopeID: number
}

export interface TraxProjectConfig {
  selection: string   // e.g. "Software"
}

export interface TraxProject {
  TRAProjectName:    string
  responsibleOrg:    string
  AccessScope:       TraxAccessScope
  Config:            TraxProjectConfig
  projectID:         number
  targetOfAnalysis:  string
  createdBy:         string
  createdDate:       string   // ISO date string
  overallProjectType?: OverallProjectType
}

export interface TraxIntendedOp {
  IOEdescription?: string   // HTML string — optional, can be empty object
}

// ============================================================
// SECTION 3 — ASSUMPTIONS
// ============================================================

export interface TraxAssumptionZoneExposureRef {
  SecurityZone: {
    zone_id: string
  }
}

export interface TraxAssumptionTag {
  tagName: string
}

export interface TraxAssumption {
  assumption_id: string
  name:          string
  description:   string
  validated:     boolean
  assumptionType: AssumptionType
  ZoneExposures?: TraxAssumptionZoneExposureRef[]
  Tags?:          TraxAssumptionTag[]
}

// ============================================================
// SECTION 4 — ASSETS
// ============================================================

export interface TraxAsset {
  asset_id:    string
  name:        string
  description?: string
  assetType:   AssetType
}

// ============================================================
// SECTION 5 — PROTECTION GOALS
// ============================================================

export interface TraxAssetRef {
  asset_id: string
}

export interface TraxZoneInterfaceRef {
  interface_id: string
}

export interface TraxThreatScenarioRef {
  threatscenario_id: string
}

export interface TraxImpactCategory {
  name: string
}

export interface TraxProtectionGoal {
  pg_id:              string
  name:               string
  impactLevel:        ImpactLevel
  impactDescription?: string
  protectionGoalType: ProtectionGoalType
  Asset:              TraxAssetRef
  ThreatScenarios?:   TraxThreatScenarioRef[]
  ImpactCategory?:    TraxImpactCategory
}

// ============================================================
// SECTION 6 — SECURITY ZONES
// ============================================================

export interface TraxZoneInterface {
  interface_id:             string
  name:                     string
  description?:             string
  abstractInterfaceType:    AbstractInterfaceType
  specificExposureRating_I: ExposureRating
  isManagementInterface:    boolean
  ConnectedToSecurityZone?: TraxZoneRef
}

export interface TraxZoneCommunication {
  communication_id:         string
  name:                     string
  description?:             string
  specificExposureRating_C: ExposureRating
  viaUntrustedZones:        boolean
  TargetZone:               TraxZoneRef
  SourceZone?:              TraxZoneRef
  TargetInterface?:         TraxZoneInterfaceRef
  SourceInterface?:         TraxZoneInterfaceRef
}

export interface TraxAssumptionRef {
  assumption_id: string
}

export interface TraxZoneExposure {
  rating:           ExposureRating
  zoneExposureType: ZoneExposureType
  description?:     string
  Assumptions?:     TraxAssumptionRef[]
}

export interface TraxZoneTypeOf {
  name: string   // e.g. "General Host Zone", "Cluster", "Network Segment"
  type: string   // e.g. "Host", "Network"
}

export interface TraxZoneVariant {
  name: string   // e.g. "Unspecified", "Kubernetes cluster"
}

export interface TraxZoneRef {
  zone_id: string
}

export interface TraxNetworkFacingInterface {
  interface_id:             string
  name:                     string
  description?:             string
  subTypeN?:                ZoneInterfaceSubType
  specificExposureRating_I: ExposureRating
  CALCzoneDerivedExposure_I:ExposureRating
  abstractInterfaceType:    AbstractInterfaceType
  isManagementInterface:    boolean
  fromUntrustedZones?:      boolean
  inScope?:                 boolean
  message?:                 string
  ConnectedToSecurityZone?: TraxZoneRef
}

export interface TraxHostLevelInterface {
  interface_id:             string
  name:                     string
  description?:             string
  inScope?:                 boolean
  specificExposureRating_I: ExposureRating
  CALCzoneDerivedExposure_I:ExposureRating
  abstractInterfaceType:    AbstractInterfaceType
  isManagementInterface:    boolean
  message?:                 string
  ConnectedToSecurityZone?: TraxZoneRef
}

export interface TraxSecurityZone {
  zone_id:           string
  name:              string
  description?:      string
  external:          boolean
  isNetworkZone:     boolean
  isProximityZone:   boolean
  isHostZone:        boolean
  isStructuringBox:  boolean
  isVisible:         boolean
  isTopSecurityZone: boolean
  ZoneExposures:     TraxZoneExposure[]

  subZonesNumber?:   string
  SecurityZone?:     TraxZoneRef
  SecurityZone_Top?: TraxZoneRef

  ZoneInterfaces?:      TraxZoneInterface[]
  ZoneCommunications?:  TraxZoneCommunication[]

  NetworkFacingInterfaces_Zone?: TraxNetworkFacingInterface[]
  HostLevelInterfaces_Zone?:     TraxHostLevelInterface[]

  TypeOf?:   TraxZoneTypeOf
  Variant?:  TraxZoneVariant
}

// ============================================================
// SECTION 7 — SOFTWARE COMPONENTS
// ============================================================

export interface TraxProtocolType {
  name: string   // e.g. "HTTPS", "SSH", "S7", "PROFINET", "Other"
}

export interface TraxReachableFromZoneRef {
  zone_id: string
}

export interface TraxLogicalInterface {
  interface_id:               string
  name:                       string
  description?:               string
  softwareAttackSurfaceType:  SoftwareAttackSurfaceType   // ← drives interface dot color
  abstractInterfaceType:      AbstractInterfaceType
  service?:                   string
  specificExposureRating_I:   ExposureRating
  specificExposureComment_I?: string
  CALCzoneDerivedExposure_I:  ExposureRating
  isManagementInterface:      boolean
  fromUntrustedZones:         boolean
  message?:                   string
  ReachableFromSecurityZone?: TraxReachableFromZoneRef
  ProtocolType?:              TraxProtocolType
}

export interface TraxTargetInterface {
  interface_id: string
}

export interface TraxSourceComponent {
  subUnit_id: string
}

export interface TraxInterSWCommunication {
  communication_id:        string
  name:                    string
  description?:            string
  specificExposureRating_C:  ExposureRating
  specificExposureComment_C?: string
  CALCzoneDerivedExposure_C?: ExposureRating
  protocolOther?:          string
  viaUntrustedZones:       boolean
  message?:                string
  TargetInterface:         TraxTargetInterface
  SourceComponent?:        TraxSourceComponent
  ProtocolType?:           TraxProtocolType
}

export interface TraxSecurityZoneRef {
  zone_id: string
}

export interface TraxSWComponent {
  subUnit_id:              string
  name:                    string
  description?:            string
  scope:                   ComponentScope
  SecurityZone:            TraxSecurityZoneRef
  LogicalInterfaces?:      TraxLogicalInterface[]
  InterSWCommunications?:  TraxInterSWCommunication[]
}

// ============================================================
// SECTION 8 — THREAT SCENARIOS
// ============================================================

export interface TraxProtectionGoalRef {
  pg_id: string
}

export interface TraxAttackInterface {
  interface_id: string
}

export interface TraxReRating {
  rrExposure:                ExposureRating
  rrExploitability:          ExposureRating
  rrImpact:                  ExposureRating
  CALCrrLikelihood:          LikelihoodRating | string
  CALCrrRiskRating:          RiskRating | string
  isAvoided:                 boolean
  isOriginalRRExposure:      boolean
  isOriginalRRExploitability:boolean
  isOriginalRRImpact:        boolean
  isAcceptedByDefault:       boolean
  acceptanceComment?:        string
}

export interface TraxThreatScenario {
  threatscenario_id:             string
  name:                          string
  attackActionDesc?:             string
  weakness?:                     string
  exploitabilityRating:          ExploitabilityRating | string
  exploitabilityComment?:        string
  threatSpecificExposureRating:  ExposureRating
  threatSpecificExposureComment?:string
  CALCAppliedExposure:           ExposureRating | string
  threatSpecificImpactRating:    ImpactLevel | string
  threatSpecificImpactComment?:  string
  CALCAppliedImpactRating:       ImpactLevel | string
  CALCLikelihood:                LikelihoodRating | string
  CALCRiskRating:                RiskRating | string
  ProtectionGoals:               TraxProtectionGoalRef[]
  AttackInterface:               TraxAttackInterface
  ReRating:                      TraxReRating
}

// ============================================================
// SECTION 9 — PROJECT IMAGES
// ============================================================

export interface TraxProjectImage {
  title:  string
  base64: string
}

// ============================================================
// SECTION 10 — ROOT TRA-X JSON DOCUMENT
// ============================================================

export interface CoreTraxJson {
  JSON_VERSION:         string
  TRAVersionName:       string
  TRAVersionNumber:     string
  status:               TraxStatus
  createdBy:            string
  changedBy:            string
  createdDate:          string
  changedDate:          string
  highLevelDescription?: string   // HTML string
  scopeDescription?:    string    // HTML string
  Project:              TraxProject
  IntendedOp:           TraxIntendedOp
  SecurityZones:        TraxSecurityZone[]
  SWComponents:         TraxSWComponent[]
  ProjectImages?:       TraxProjectImage[]

  Assumptions?:     TraxAssumption[]
  Assets?:          TraxAsset[]
  ProtectionGoals?: TraxProtectionGoal[]
  ThreatScenarios?: TraxThreatScenario[]
}

// ============================================================
// SECTION 11 — DIAGRAM LAYOUT (visual layer, separate from TRA-X)
// ============================================================

export interface NodeLayout {
  id:            string   // matches zone_id or subUnit_id
  entityType:    "zone" | "component"
  x:             number
  y:             number
  width:         number
  height:        number
  color:         string
  parentId?:     string
  userMoved?: boolean
  labelPosition: "top" | "bottom" | "center"
}

export type EdgeEntityType = 'communication' | 'zoneCommunication'

export interface EdgeLayout {
  id:           string
  entityType:   EdgeEntityType
  sourceType:   'component' | 'zone'
  targetType:   'component' | 'zone'
  labelOffsetX: number
  labelOffsetY: number
  animated:     boolean
  color:        string
}

export interface CanvasSettings {
  layoutAlgorithm: 'vertical' | 'horizontal' 
  edgeStyle:       'default' | 'smoothstep' | 'straight' | 'step' | 'animated'
  //                                                                  
}

export interface DiagramLayout {
  version:  string
  nodes:    NodeLayout[]
  edges:    EdgeLayout[]
  settings: CanvasSettings
}

// ============================================================
// SECTION 12 — APP PROJECT (both layers combined)
// ============================================================

export interface AppProject {
  coreData: CoreTraxJson
  layout:   DiagramLayout
}

// ============================================================
// SECTION 13 — UTILITY TYPES
// ============================================================

export type Result<T> =
  | { success: true;  data:  T      }
  | { success: false; error: string }

export type TraxEntityType =
  | "zone"
  | "component"
  | "logicalInterface"
  | "zoneInterface"
  | "communication"
  | "threatScenario"
  | "protectionGoal"
  | "asset"
  | "assumption"

export interface ProjectStatus {
  hasUnsavedChanges: boolean
  lastSavedAt:       string | null
  projectFilePath:   string | null
}

export interface ResolvedCommunication {
  communication_id: string
  name:             string
  sourceComponentId:string
  targetComponentId:string
  protocolName:     string
  viaUntrustedZones:boolean
  animated:         boolean
}

export interface ResolvedZone {
  zone_id:           string
  name:              string
  parentZoneId:      string | null
  topZoneId:         string
  depth:             number
  isTopSecurityZone: boolean
}