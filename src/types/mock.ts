import type { Container, YardZone, Slot, YardPlan, MoveTask, ReeferMonitor, Exception, ShiftReport, Equipment, Staff } from './index'
import dayjs from 'dayjs'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function generateContainerNo(): string {
  const prefix = ['MSKU', 'MAEU', 'CSLU', 'HDMU', 'NYKU', 'OOLU', 'EMCU', 'TCLU']
  return prefix[Math.floor(Math.random() * prefix.length)] + 
         Math.floor(Math.random() * 9000000 + 1000000).toString()
}

const zoneCodes = ['A', 'B', 'C', 'D', 'E', 'F']
const sizes: Container['size'][] = ['20GP', '40GP', '40HQ', '20RF', '40RF']
const types: Container['type'][] = ['GP', 'HQ', 'RF', 'OT', 'FR']

export const mockYardZones: YardZone[] = [
  { id: '1', zoneCode: 'A', zoneName: 'A区-普通重箱', totalSlots: 200, occupiedSlots: 156, maxTier: 4, maxBay: 10, maxRow: 5, zoneType: 'general', isActive: true, description: '普通重箱堆存区' },
  { id: '2', zoneCode: 'B', zoneName: 'B区-普通重箱', totalSlots: 200, occupiedSlots: 142, maxTier: 4, maxBay: 10, maxRow: 5, zoneType: 'general', isActive: true, description: '普通重箱堆存区' },
  { id: '3', zoneCode: 'C', zoneName: 'C区-冷藏箱区', totalSlots: 80, occupiedSlots: 45, maxTier: 2, maxBay: 8, maxRow: 5, zoneType: 'reefer', isActive: true, description: '冷藏集装箱专用区，配有电源插座' },
  { id: '4', zoneCode: 'D', zoneName: 'D区-危险品箱区', totalSlots: 60, occupiedSlots: 23, maxTier: 2, maxBay: 6, maxRow: 5, zoneType: 'hazardous', isActive: true, description: '危险品集装箱专用隔离区' },
  { id: '5', zoneCode: 'E', zoneName: 'E区-空箱区', totalSlots: 300, occupiedSlots: 189, maxTier: 6, maxBay: 10, maxRow: 5, zoneType: 'empty', isActive: true, description: '空箱堆存区' },
  { id: '6', zoneCode: 'F', zoneName: 'F区-特种箱区', totalSlots: 50, occupiedSlots: 18, maxTier: 2, maxBay: 5, maxRow: 5, zoneType: 'oversize', isActive: true, description: '超限、特种箱区' }
]

export function generateMockContainers(count: number = 200): Container[] {
  const containers: Container[] = []
  
  for (let i = 0; i < count; i++) {
    const zoneIdx = Math.floor(Math.random() * zoneCodes.length)
    const zone = mockYardZones[zoneIdx]
    const size = sizes[Math.floor(Math.random() * sizes.length)]
    const isReefer = size.includes('RF')
    const isHazardous = zone.zoneType === 'hazardous' || (Math.random() < 0.05)
    const arrivalTime = dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss')
    const overdueDays = Math.floor(Math.random() * 20)
    const isOverdue = overdueDays > 7
    const isDeparted = Math.random() > 0.85
    const totalCycles = Math.floor(Math.random() * 3) + 1

    containers.push({
      id: generateId(),
      containerNo: generateContainerNo(),
      size,
      type: isReefer ? 'RF' : types[Math.floor(Math.random() * 3)],
      status: isDeparted ? 'out' : 'in',
      location: isDeparted ? '' : `${zone.zoneCode}${Math.floor(Math.random() * zone.maxBay) + 1}${Math.floor(Math.random() * zone.maxRow) + 1}${Math.floor(Math.random() * zone.maxTier) + 1}`,
      bay: isDeparted ? 0 : Math.floor(Math.random() * zone.maxBay) + 1,
      row: isDeparted ? 0 : Math.floor(Math.random() * zone.maxRow) + 1,
      tier: isDeparted ? 0 : Math.floor(Math.random() * zone.maxTier) + 1,
      weight: Math.floor(Math.random() * 28000) + 2000,
      isHazardous,
      hazardLevel: isHazardous ? ['1.4', '2.1', '3', '4.1', '5.1', '6.1', '8', '9'][Math.floor(Math.random() * 8)] : undefined,
      isReefer,
      targetTemp: isReefer ? [-18, -12, -5, 0, 2, 5, 10][Math.floor(Math.random() * 7)] : undefined,
      currentTemp: isReefer ? (-18 + Math.random() * 30) : undefined,
      arrivalTime,
      departureTime: isDeparted ? dayjs(arrivalTime).add(Math.floor(Math.random() * 10), 'day').format('YYYY-MM-DD HH:mm:ss') : undefined,
      vesselName: ['马士基号', '中远之星', '中海号', '东方海外', '海丰号', '中外运'][Math.floor(Math.random() * 6)],
      voyageNo: `V${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}E`,
      blNo: `BL${Math.floor(Math.random() * 900000 + 100000)}`,
      consignee: ['贸易公司A', '进出口公司B', '物流公司C', '制造业D', '电子科技E'][Math.floor(Math.random() * 5)],
      shipper: ['工厂X', '供应商Y', '生产商Z'][Math.floor(Math.random() * 3)],
      priority: Math.floor(Math.random() * 5) + 1,
      isOverdue: !isDeparted && isOverdue,
      overdueDays: isOverdue ? overdueDays : 0,
      createdAt: arrivalTime,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      cycleIndex: totalCycles,
      totalCycles
    })
  }
  
  return containers
}

export function generateMockSlots(zone: YardZone): Slot[] {
  const slots: Slot[] = []
  for (let bay = 1; bay <= zone.maxBay; bay++) {
    for (let row = 1; row <= zone.maxRow; row++) {
      for (let tier = 1; tier <= zone.maxTier; tier++) {
        slots.push({
          id: `${zone.zoneCode}-${bay}-${row}-${tier}`,
          zoneCode: zone.zoneCode,
          bay,
          row,
          tier,
          isOccupied: Math.random() > 0.3,
          containerNo: Math.random() > 0.3 ? generateContainerNo() : undefined,
          isReeferSlot: zone.zoneType === 'reefer',
          isHazardousSlot: zone.zoneType === 'hazardous'
        })
      }
    }
  }
  return slots
}

export const mockYardPlans: YardPlan[] = [
  {
    id: '1', planNo: 'IP-20240606-001', planType: 'import',
    vesselName: '马士基号', voyageNo: 'V0123E',
    eta: dayjs().add(2, 'day').format('YYYY-MM-DD HH:mm'),
    containerCount: 150, containers: [],
    status: 'approved',
    createdBy: '张计划员',
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    updatedAt: dayjs().subtract(12, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: '2', planNo: 'EP-20240606-001', planType: 'export',
    vesselName: '中远之星', voyageNo: 'V0456W',
    etd: dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm'),
    containerCount: 200, containers: [],
    status: 'in_progress',
    createdBy: '李计划员',
    createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    updatedAt: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: '3', planNo: 'IP-20240607-001', planType: 'import',
    vesselName: '中海号', voyageNo: 'V0789E',
    eta: dayjs().add(4, 'day').format('YYYY-MM-DD HH:mm'),
    containerCount: 120, containers: [],
    status: 'draft',
    createdBy: '王计划员',
    createdAt: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm'),
    updatedAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm')
  }
]

export function generateMockMoveTasks(count: number = 30): MoveTask[] {
  const tasks: MoveTask[] = []
  const taskTypes: MoveTask['taskType'][] = ['move', 'lift', 'stack', 'retrieve']
  const statuses: MoveTask['status'][] = ['pending', 'in_progress', 'completed']
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const fromZone = zoneCodes[Math.floor(Math.random() * zoneCodes.length)]
    const toZone = zoneCodes[Math.floor(Math.random() * zoneCodes.length)]
    
    tasks.push({
      id: generateId(),
      taskNo: `MT${dayjs().format('YYYYMMDD')}${(i + 1).toString().padStart(4, '0')}`,
      taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
      containerId: generateId(),
      containerNo: generateContainerNo(),
      fromLocation: `${fromZone}${Math.floor(Math.random() * 10) + 1}${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 4) + 1}`,
      toLocation: `${toZone}${Math.floor(Math.random() * 10) + 1}${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 4) + 1}`,
      fromBay: Math.floor(Math.random() * 10) + 1,
      fromRow: Math.floor(Math.random() * 5) + 1,
      fromTier: Math.floor(Math.random() * 4) + 1,
      toBay: Math.floor(Math.random() * 10) + 1,
      toRow: Math.floor(Math.random() * 5) + 1,
      toTier: Math.floor(Math.random() * 4) + 1,
      priority: Math.floor(Math.random() * 5) + 1,
      status,
      assignedTo: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
      equipment: ['RS001', 'RS002', 'RS003', 'FL001'][Math.floor(Math.random() * 4)],
      startTime: status !== 'pending' ? dayjs().subtract(Math.random() * 120, 'minute').format('YYYY-MM-DD HH:mm') : undefined,
      endTime: status === 'completed' ? dayjs().subtract(Math.random() * 60, 'minute').format('YYYY-MM-DD HH:mm') : undefined,
      remarks: Math.random() > 0.7 ? '注意轻放' : undefined,
      createdBy: '调度员',
      createdAt: dayjs().subtract(Math.random() * 24, 'hour').format('YYYY-MM-DD HH:mm')
    })
  }
  
  return tasks
}

export function generateMockReeferMonitors(count: number = 20): ReeferMonitor[] {
  const monitors: ReeferMonitor[] = []
  
  for (let i = 0; i < count; i++) {
    const targetTemp = [-18, -12, -5, 0, 2, 5, 10][Math.floor(Math.random() * 7)]
    const tempDiff = Math.random() * 6 - 3
    const currentTemp = targetTemp + tempDiff
    const alarmStatus = Math.abs(tempDiff) > 3 ? 'critical' : (Math.abs(tempDiff) > 1.5 ? 'warning' : 'normal')
    
    monitors.push({
      id: generateId(),
      containerId: generateId(),
      containerNo: generateContainerNo(),
      location: `C${Math.floor(Math.random() * 8) + 1}${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 2) + 1}`,
      targetTemp,
      currentTemp: Math.round(currentTemp * 10) / 10,
      setTemp: targetTemp,
      humidity: Math.floor(Math.random() * 40) + 50,
      powerStatus: Math.random() > 0.05 ? 'on' : 'error',
      alarmStatus,
      lastChecked: dayjs().subtract(Math.random() * 30, 'minute').format('YYYY-MM-DD HH:mm'),
      nextCheck: dayjs().add(Math.random() * 30, 'minute').format('YYYY-MM-DD HH:mm')
    })
  }
  
  return monitors
}

export function generateMockExceptions(count: number = 15): Exception[] {
  const exceptions: Exception[] = []
  const types: Exception['exceptionType'][] = ['damaged', 'overdue', 'temperature_abnormal', 'location_error', 'other']
  const severities: Exception['severity'][] = ['low', 'medium', 'high', 'critical']
  const statuses: Exception['status'][] = ['open', 'in_progress', 'resolved', 'closed']
  
  const descriptions: Record<string, string[]> = {
    damaged: ['箱体有轻微凹痕', '角件损坏', '箱门密封条破损', '顶板变形', '侧板锈蚀'],
    overdue: ['堆存超期15天', '堆存超期30天', '堆存超期60天', '长期无人提货'],
    temperature_abnormal: ['温度超出范围2度', '温度波动异常', '制冷机组报警', '温度传感器故障'],
    location_error: ['箱位与系统不符', '错放箱区', '未按计划位置堆放'],
    other: ['单证信息不一致', '铅封异常', '箱况异常']
  }
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    exceptions.push({
      id: generateId(),
      exceptionNo: `EX${dayjs().format('YYYYMMDD')}${(i + 1).toString().padStart(4, '0')}`,
      exceptionType: type,
      severity: severities[Math.floor(Math.random() * severities.length)],
      containerId: generateId(),
      containerNo: generateContainerNo(),
      location: `${zoneCodes[Math.floor(Math.random() * zoneCodes.length)]}${Math.floor(Math.random() * 10) + 1}${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 4) + 1}`,
      description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
      status,
      reportedBy: ['现场员A', '现场员B', '监控员C'][Math.floor(Math.random() * 3)],
      reportedAt: dayjs().subtract(Math.random() * 72, 'hour').format('YYYY-MM-DD HH:mm'),
      handledBy: status !== 'open' ? ['处理员X', '处理员Y'][Math.floor(Math.random() * 2)] : undefined,
      handledAt: status !== 'open' ? dayjs().subtract(Math.random() * 24, 'hour').format('YYYY-MM-DD HH:mm') : undefined,
      resolution: status === 'resolved' || status === 'closed' ? '已修复/已处理' : undefined
    })
  }
  
  return exceptions
}

export function generateMockShiftReports(count: number = 10): ShiftReport[] {
  const reports: ShiftReport[] = []
  const shifts: ShiftReport['shiftType'][] = ['morning', 'afternoon', 'night']
  const teams = ['甲班', '乙班', '丙班', '丁班']
  
  for (let i = 0; i < count; i++) {
    const shift = shifts[i % 3]
    const date = dayjs().subtract(Math.floor(i / 3), 'day')
    
    reports.push({
      id: generateId(),
      shiftDate: date.format('YYYY-MM-DD'),
      shiftType: shift,
      teamName: teams[i % 4],
      containersIn: Math.floor(Math.random() * 100) + 50,
      containersOut: Math.floor(Math.random() * 100) + 50,
      movesCompleted: Math.floor(Math.random() * 150) + 100,
      reeferChecks: Math.floor(Math.random() * 30) + 10,
      exceptions: Math.floor(Math.random() * 5),
      startTime: date.format('YYYY-MM-DD ') + (shift === 'morning' ? '08:00' : shift === 'afternoon' ? '16:00' : '00:00'),
      endTime: date.format('YYYY-MM-DD ') + (shift === 'morning' ? '16:00' : shift === 'afternoon' ? '00:00' : '08:00'),
      operator: ['班长A', '班长B', '班长C'][Math.floor(Math.random() * 3)],
      remarks: Math.random() > 0.7 ? '班次作业正常' : undefined
    })
  }
  
  return reports
}

export const mockEquipments: Equipment[] = [
  { id: '1', equipmentNo: 'RS001', equipmentType: 'reach_stacker', status: 'in_use', currentOperator: '张三', currentTask: 'MT202406060001', location: 'A区' },
  { id: '2', equipmentNo: 'RS002', equipmentType: 'reach_stacker', status: 'available', location: '设备停放区' },
  { id: '3', equipmentNo: 'RS003', equipmentType: 'reach_stacker', status: 'maintenance', location: '维修车间' },
  { id: '4', equipmentNo: 'FL001', equipmentType: 'forklift', status: 'in_use', currentOperator: '李四', location: 'B区' },
  { id: '5', equipmentNo: 'FL002', equipmentType: 'forklift', status: 'available', location: '设备停放区' },
  { id: '6', equipmentNo: 'TT001', equipmentType: 'terminal_tractor', status: 'in_use', currentOperator: '王五', location: '大门' },
  { id: '7', equipmentNo: 'TT002', equipmentType: 'terminal_tractor', status: 'available', location: '设备停放区' }
]

export const mockStaffs: Staff[] = [
  { id: '1', staffNo: 'S001', name: '张三', position: '堆高机司机', team: '甲班', phone: '138****1001', status: 'on_duty' },
  { id: '2', staffNo: 'S002', name: '李四', position: '叉车司机', team: '甲班', phone: '138****1002', status: 'on_duty' },
  { id: '3', staffNo: 'S003', name: '王五', position: '集卡司机', team: '甲班', phone: '138****1003', status: 'on_duty' },
  { id: '4', staffNo: 'S004', name: '赵六', position: '堆高机司机', team: '乙班', phone: '138****1004', status: 'off_duty' },
  { id: '5', staffNo: 'S005', name: '钱七', position: '现场员', team: '甲班', phone: '138****1005', status: 'on_duty' },
  { id: '6', staffNo: 'S006', name: '孙八', position: '计划员', team: '调度室', phone: '138****1006', status: 'on_duty' },
  { id: '7', staffNo: 'S007', name: '周九', position: '监控员', team: '调度室', phone: '138****1007', status: 'on_duty' }
]
