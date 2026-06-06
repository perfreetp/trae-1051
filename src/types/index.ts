export interface Container {
  id: string
  containerNo: string
  size: '20GP' | '40GP' | '40HQ' | '20RF' | '40RF'
  type: 'GP' | 'HQ' | 'RF' | 'OT' | 'FR'
  status: 'in' | 'out' | 'moving' | 'damaged'
  location: string
  bay: number
  row: number
  tier: number
  weight: number
  isHazardous: boolean
  hazardLevel?: string
  isReefer: boolean
  targetTemp?: number
  currentTemp?: number
  arrivalTime: string
  departureTime?: string
  vesselName?: string
  voyageNo?: string
  blNo?: string
  consignee?: string
  shipper?: string
  description?: string
  priority: number
  isOverdue: boolean
  overdueDays?: number
  createdAt: string
  updatedAt: string
}

export interface YardZone {
  id: string
  zoneCode: string
  zoneName: string
  totalSlots: number
  occupiedSlots: number
  maxTier: number
  maxBay: number
  maxRow: number
  zoneType: 'general' | 'reefer' | 'hazardous' | 'empty' | 'oversize'
  isActive: boolean
  description?: string
}

export interface Slot {
  id: string
  zoneCode: string
  bay: number
  row: number
  tier: number
  isOccupied: boolean
  containerId?: string
  containerNo?: string
  isReeferSlot: boolean
  isHazardousSlot: boolean
}

export interface YardPlan {
  id: string
  planNo: string
  planType: 'import' | 'export'
  vesselName: string
  voyageNo: string
  eta?: string
  etd?: string
  containerCount: number
  containers: string[]
  status: 'draft' | 'approved' | 'in_progress' | 'completed'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MoveTask {
  id: string
  taskNo: string
  taskType: 'move' | 'lift' | 'stack' | 'retrieve'
  containerId: string
  containerNo: string
  fromLocation: string
  toLocation: string
  fromBay?: number
  fromRow?: number
  fromTier?: number
  toBay?: number
  toRow?: number
  toTier?: number
  priority: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assignedTo?: string
  equipment?: string
  startTime?: string
  endTime?: string
  remarks?: string
  createdBy: string
  createdAt: string
}

export interface ReeferMonitor {
  id: string
  containerId: string
  containerNo: string
  location: string
  targetTemp: number
  currentTemp: number
  setTemp: number
  humidity?: number
  powerStatus: 'on' | 'off' | 'error'
  alarmStatus: 'normal' | 'warning' | 'critical'
  lastChecked: string
  nextCheck: string
}

export interface Exception {
  id: string
  exceptionNo: string
  exceptionType: 'damaged' | 'overdue' | 'hazardous_leak' | 'temperature_abnormal' | 'location_error' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  containerId?: string
  containerNo?: string
  location?: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  reportedBy: string
  reportedAt: string
  handledBy?: string
  handledAt?: string
  resolution?: string
  images?: string[]
}

export interface ShiftReport {
  id: string
  shiftDate: string
  shiftType: 'morning' | 'afternoon' | 'night'
  teamName: string
  containersIn: number
  containersOut: number
  movesCompleted: number
  reeferChecks: number
  exceptions: number
  startTime: string
  endTime: string
  operator?: string
  remarks?: string
}

export interface Equipment {
  id: string
  equipmentNo: string
  equipmentType: 'reach_stacker' | 'forklift' | 'terminal_tractor' | 'other'
  status: 'available' | 'in_use' | 'maintenance' | 'broken'
  currentOperator?: string
  currentTask?: string
  location?: string
}

export interface Staff {
  id: string
  staffNo: string
  name: string
  position: string
  team: string
  phone?: string
  status: 'on_duty' | 'off_duty' | 'leave'
}

export interface ArrivalRecord {
  id: string
  containerNo: string
  size: string
  vesselName: string
  blNo?: string
  location: string
  arrivalTime: string
  operator: string
  remarks?: string
}

export interface DepartureRecord {
  id: string
  containerNo: string
  size: string
  vesselName: string
  blNo?: string
  fromLocation: string
  departureTime: string
  operator: string
  remarks?: string
}

export interface OperationLog {
  id: string
  operationType: string
  containerNo?: string
  location?: string
  operator: string
  operationTime: string
  details: string
  ipAddress?: string
}
