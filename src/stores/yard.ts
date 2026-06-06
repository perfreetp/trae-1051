import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Container, YardZone, MoveTask, ReeferMonitor, Exception, ShiftReport, YardPlan, Slot, ArrivalRecord, DepartureRecord } from '@/types'
import { 
  mockYardZones, 
  generateMockContainers, 
  generateMockMoveTasks, 
  generateMockReeferMonitors, 
  generateMockExceptions, 
  generateMockShiftReports,
  mockYardPlans,
  generateMockSlots
} from '@/types/mock'

export const useYardStore = defineStore('yard', () => {
  const containers = ref<Container[]>(generateMockContainers(200))
  const yardZones = ref<YardZone[]>(mockYardZones)
  const moveTasks = ref<MoveTask[]>(generateMockMoveTasks(30))
  const reeferMonitors = ref<ReeferMonitor[]>(generateMockReeferMonitors(20))
  const exceptions = ref<Exception[]>(generateMockExceptions(15))
  const shiftReports = ref<ShiftReport[]>(generateMockShiftReports(10))
  const yardPlans = ref<YardPlan[]>(mockYardPlans)
  const selectedZone = ref<string>('A')
  const searchKeyword = ref<string>('')
  const slotsCache = ref<Record<string, Slot[]>>({})
  const arrivalRecords = ref<ArrivalRecord[]>([])
  const departureRecords = ref<DepartureRecord[]>([])

  const totalSlots = computed(() => yardZones.value.reduce((sum, z) => sum + z.totalSlots, 0))
  const occupiedSlots = computed(() => yardZones.value.reduce((sum, z) => sum + z.occupiedSlots, 0))
  const utilizationRate = computed(() => ((occupiedSlots.value / totalSlots.value) * 100).toFixed(1))
  
  const totalContainers = computed(() => containers.value.length)
  const reeferCount = computed(() => containers.value.filter(c => c.isReefer).length)
  const hazardousCount = computed(() => containers.value.filter(c => c.isHazardous).length)
  const overdueCount = computed(() => containers.value.filter(c => c.isOverdue).length)

  const pendingTasks = computed(() => moveTasks.value.filter(t => t.status === 'pending').length)
  const inProgressTasks = computed(() => moveTasks.value.filter(t => t.status === 'in_progress').length)
  const completedTasks = computed(() => moveTasks.value.filter(t => t.status === 'completed').length)

  const openExceptions = computed(() => exceptions.value.filter(e => e.status === 'open').length)
  const criticalExceptions = computed(() => exceptions.value.filter(e => e.severity === 'critical' && e.status !== 'closed').length)

  const reeferAlarms = computed(() => reeferMonitors.value.filter(r => r.alarmStatus !== 'normal').length)

  const filteredContainers = computed(() => {
    if (!searchKeyword.value) return containers.value
    const keyword = searchKeyword.value.toLowerCase()
    return containers.value.filter(c => 
      c.containerNo.toLowerCase().includes(keyword) ||
      c.location.toLowerCase().includes(keyword) ||
      c.blNo?.toLowerCase().includes(keyword) ||
      c.consignee?.toLowerCase().includes(keyword)
    )
  })

  function findContainerByNo(containerNo: string): Container | undefined {
    return containers.value.find(c => c.containerNo.toLowerCase() === containerNo.toLowerCase())
  }

  function getZoneSlots(zoneCode: string): Slot[] {
    const zone = yardZones.value.find(z => z.zoneCode === zoneCode)
    if (!zone) return []
    if (!slotsCache.value[zoneCode]) {
      const slots = generateMockSlots(zone)
      containers.value.forEach(c => {
        if (c.location && c.location.charAt(0) === zoneCode) {
          const bay = c.bay || parseInt(c.location.charAt(1))
          const row = c.row || parseInt(c.location.charAt(2))
          const tier = c.tier || parseInt(c.location.charAt(3))
          const slotIdx = slots.findIndex(s => s.bay === bay && s.row === row && s.tier === tier)
          if (slotIdx !== -1) {
            slots[slotIdx].isOccupied = true
            slots[slotIdx].containerId = c.id
            slots[slotIdx].containerNo = c.containerNo
          }
        }
      })
      slotsCache.value[zoneCode] = slots
    }
    return slotsCache.value[zoneCode]
  }

  function createMoveTask(task: Partial<MoveTask>): MoveTask {
    const newTask: MoveTask = {
      id: Math.random().toString(36).substring(2, 15),
      taskNo: `MT${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${(moveTasks.value.length + 1).toString().padStart(4, '0')}`,
      taskType: 'move',
      containerId: '',
      containerNo: '',
      fromLocation: '',
      toLocation: '',
      priority: 3,
      status: 'pending',
      createdBy: '当前用户',
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      ...task
    }
    moveTasks.value.unshift(newTask)
    return newTask
  }

  function updateMoveTask(taskNo: string, updates: Partial<MoveTask>) {
    const index = moveTasks.value.findIndex(t => t.taskNo === taskNo)
    if (index !== -1) {
      moveTasks.value[index] = { ...moveTasks.value[index], ...updates }
    }
  }

  function createException(exception: Partial<Exception>): Exception {
    const newException: Exception = {
      id: Math.random().toString(36).substring(2, 15),
      exceptionNo: `EX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${(exceptions.value.length + 1).toString().padStart(4, '0')}`,
      exceptionType: 'other',
      severity: 'medium',
      description: '',
      status: 'open',
      reportedBy: '当前用户',
      reportedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      ...exception
    }
    exceptions.value.unshift(newException)
    return newException
  }

  function updateException(exceptionNo: string, updates: Partial<Exception>) {
    const index = exceptions.value.findIndex(e => e.exceptionNo === exceptionNo)
    if (index !== -1) {
      exceptions.value[index] = { ...exceptions.value[index], ...updates }
    }
  }

  function updateReeferMonitor(containerId: string, updates: Partial<ReeferMonitor>) {
    const index = reeferMonitors.value.findIndex(r => r.containerId === containerId)
    if (index !== -1) {
      reeferMonitors.value[index] = { ...reeferMonitors.value[index], ...updates }
    }
  }

  function assignSlot(containerNo: string, location: string, zoneCode: string, bay: number, row: number, tier: number): { success: boolean; message: string; container?: Container } {
    let container = containers.value.find(c => c.containerNo.toLowerCase() === containerNo.toLowerCase())
    
    if (!container) {
      return { success: false, message: '箱号不存在，请先登记到场或检查箱号是否正确' }
    }
    
    const slots = slotsCache.value[zoneCode]
    if (slots) {
      const oldSlotIdx = slots.findIndex(s => s.containerNo === containerNo)
      if (oldSlotIdx !== -1) {
        slots[oldSlotIdx].isOccupied = false
        slots[oldSlotIdx].containerId = undefined
        slots[oldSlotIdx].containerNo = undefined
      }
      
      const newSlotIdx = slots.findIndex(s => s.bay === bay && s.row === row && s.tier === tier)
      if (newSlotIdx !== -1) {
        if (slots[newSlotIdx].isOccupied && slots[newSlotIdx].containerNo !== containerNo) {
          return { success: false, message: '该箱位已被占用，请选择其他箱位' }
        }
        slots[newSlotIdx].isOccupied = true
        slots[newSlotIdx].containerId = container.id
        slots[newSlotIdx].containerNo = container.containerNo
      }
    }
    
    container.location = location
    container.bay = bay
    container.row = row
    container.tier = tier
    container.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    const zone = yardZones.value.find(z => z.zoneCode === zoneCode)
    if (zone) {
      zone.occupiedSlots = slots ? slots.filter(s => s.isOccupied).length : zone.occupiedSlots
    }
    
    return { success: true, message: '箱位分配成功', container }
  }

  function findAvailableSlot(container: Partial<Container>): Slot | null {
    const suitableZones = yardZones.value.filter(z => {
      if (!z.isActive) return false
      if (container.isReefer) return z.zoneType === 'reefer'
      if (container.isHazardous) return z.zoneType === 'hazardous'
      if (container.size?.includes('40')) return z.zoneType !== 'hazardous' && z.zoneType !== 'reefer'
      return z.zoneType === 'general' || z.zoneType === 'empty'
    })

    for (const zone of suitableZones) {
      const slots = getZoneSlots(zone.zoneCode)
      const availableSlots = slots.filter(s => !s.isOccupied)
      if (availableSlots.length > 0) {
        const sortedSlots = [...availableSlots].sort((a, b) => {
          if (a.tier !== b.tier) return a.tier - b.tier
          if (a.bay !== b.bay) return a.bay - b.bay
          return a.row - b.row
        })
        return sortedSlots[0]
      }
    }
    return null
  }

  function generateMoveInstruction(containerNo: string, toLocation: string, priority: number = 3): MoveTask {
    const container = findContainerByNo(containerNo)
    const fromLocation = container?.location || ''
    return createMoveTask({
      containerNo,
      fromLocation,
      toLocation,
      priority,
      taskType: 'move',
      containerId: container?.id || ''
    })
  }

  function optimizeMoveTasks(tasks: MoveTask[]): MoveTask[] {
    return [...tasks].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1
      if (a.status !== 'in_progress' && b.status === 'in_progress') return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  function recordContainerArrival(container: Partial<Container>): Container {
    const newContainer: Container = {
      id: Math.random().toString(36).substring(2, 15),
      containerNo: container.containerNo || '',
      size: container.size || '20GP',
      type: container.type || 'GP',
      status: 'in',
      location: '',
      bay: 0,
      row: 0,
      tier: 0,
      weight: container.weight || 0,
      isHazardous: container.isHazardous || false,
      hazardLevel: container.hazardLevel,
      isReefer: container.isReefer || false,
      targetTemp: container.targetTemp,
      currentTemp: container.currentTemp,
      arrivalTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      vesselName: container.vesselName,
      voyageNo: container.voyageNo,
      blNo: container.blNo,
      consignee: container.consignee,
      shipper: container.shipper,
      description: container.description,
      priority: container.priority || 3,
      isOverdue: false,
      overdueDays: 0,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    containers.value.unshift(newContainer)
    return newContainer
  }

  function recordContainerDeparture(containerNo: string): boolean {
    const container = findContainerByNo(containerNo)
    if (container) {
      container.status = 'out'
      container.departureTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      container.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      return true
    }
    return false
  }

  function adjustContainerPriority(containerNo: string, priority: number): boolean {
    const container = findContainerByNo(containerNo)
    if (container) {
      container.priority = priority
      container.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      return true
    }
    return false
  }

  function initRecords() {
    if (arrivalRecords.value.length === 0) {
      const arrived = containers.value.slice(0, 8)
      arrivalRecords.value = arrived.map((c, i) => ({
        id: `ARR${i.toString().padStart(4, '0')}`,
        containerNo: c.containerNo,
        size: c.size,
        vesselName: c.vesselName || '未知',
        blNo: c.blNo,
        location: c.location,
        arrivalTime: c.arrivalTime,
        operator: ['张三', '李四', '王五'][i % 3],
        remarks: ''
      }))
    }
    if (departureRecords.value.length === 0) {
      const departed = containers.value.slice(10, 16)
      departureRecords.value = departed.map((c, i) => ({
        id: `DEP${i.toString().padStart(4, '0')}`,
        containerNo: c.containerNo,
        size: c.size,
        vesselName: c.vesselName || '未知',
        blNo: c.blNo,
        fromLocation: c.location,
        departureTime: c.departureTime || new Date(Date.now() - (i + 1) * 3600000).toISOString().slice(0, 19).replace('T', ' '),
        operator: ['李四', '王五', '赵六'][i % 3],
        remarks: ''
      }))
    }
  }

  function createArrivalRecord(record: Partial<ArrivalRecord>): ArrivalRecord {
    const newRecord: ArrivalRecord = {
      id: Math.random().toString(36).substring(2, 15),
      containerNo: record.containerNo || '',
      size: record.size || '20GP',
      vesselName: record.vesselName || '',
      blNo: record.blNo,
      location: record.location || '',
      arrivalTime: record.arrivalTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
      operator: record.operator || '当前用户',
      remarks: record.remarks
    }
    arrivalRecords.value.unshift(newRecord)
    return newRecord
  }

  function createDepartureRecord(record: Partial<DepartureRecord>): DepartureRecord {
    const newRecord: DepartureRecord = {
      id: Math.random().toString(36).substring(2, 15),
      containerNo: record.containerNo || '',
      size: record.size || '20GP',
      vesselName: record.vesselName || '',
      blNo: record.blNo,
      fromLocation: record.fromLocation || '',
      departureTime: record.departureTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
      operator: record.operator || '当前用户',
      remarks: record.remarks
    }
    departureRecords.value.unshift(newRecord)
    return newRecord
  }

  initRecords()

  return {
    containers,
    yardZones,
    moveTasks,
    reeferMonitors,
    exceptions,
    shiftReports,
    yardPlans,
    selectedZone,
    searchKeyword,
    slotsCache,
    arrivalRecords,
    departureRecords,
    totalSlots,
    occupiedSlots,
    utilizationRate,
    totalContainers,
    reeferCount,
    hazardousCount,
    overdueCount,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    openExceptions,
    criticalExceptions,
    reeferAlarms,
    filteredContainers,
    findContainerByNo,
    getZoneSlots,
    createMoveTask,
    updateMoveTask,
    createException,
    updateException,
    updateReeferMonitor,
    assignSlot,
    findAvailableSlot,
    generateMoveInstruction,
    optimizeMoveTasks,
    recordContainerArrival,
    recordContainerDeparture,
    adjustContainerPriority,
    createArrivalRecord,
    createDepartureRecord
  }
})
