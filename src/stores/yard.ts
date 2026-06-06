import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
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

const STORAGE_KEY = 'container_yard_data_v1'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data) as T
    }
  } catch (e) {
    console.error('Failed to load from storage', e)
  }
  return defaultValue
}

function saveToStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to storage', e)
  }
}

export const useYardStore = defineStore('yard', () => {
  const hasInitialized = ref(false)
  
  const containers = ref<Container[]>([])
  const yardZones = ref<YardZone[]>([])
  const moveTasks = ref<MoveTask[]>([])
  const reeferMonitors = ref<ReeferMonitor[]>([])
  const exceptions = ref<Exception[]>([])
  const shiftReports = ref<ShiftReport[]>([])
  const yardPlans = ref<YardPlan[]>([])
  const selectedZone = ref<string>('A')
  const searchKeyword = ref<string>('')
  const slotsCache = ref<Record<string, Slot[]>>({})
  const arrivalRecords = ref<ArrivalRecord[]>([])
  const departureRecords = ref<DepartureRecord[]>([])

  function initData() {
    const savedData = loadFromStorage<any>(STORAGE_KEY, null)
    
    if (savedData) {
      containers.value = savedData.containers || []
      yardZones.value = savedData.yardZones || mockYardZones
      moveTasks.value = savedData.moveTasks || []
      reeferMonitors.value = savedData.reeferMonitors || []
      exceptions.value = savedData.exceptions || []
      shiftReports.value = savedData.shiftReports || []
      yardPlans.value = savedData.yardPlans || mockYardPlans
      arrivalRecords.value = savedData.arrivalRecords || []
      departureRecords.value = savedData.departureRecords || []
      slotsCache.value = savedData.slotsCache || {}
    } else {
      containers.value = generateMockContainers(200)
      yardZones.value = mockYardZones
      moveTasks.value = generateMockMoveTasks(30)
      reeferMonitors.value = generateMockReeferMonitors(20)
      exceptions.value = generateMockExceptions(15)
      shiftReports.value = generateMockShiftReports(10)
      yardPlans.value = mockYardPlans
      
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
      
      yardZones.value.forEach(zone => {
        if (!slotsCache.value[zone.zoneCode]) {
          const slots = generateMockSlots(zone)
          containers.value.forEach(c => {
            if (c.location && c.location.charAt(0) === zone.zoneCode && c.status !== 'out') {
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
          slotsCache.value[zone.zoneCode] = slots
        }
      })
    }
    
    hasInitialized.value = true
  }

  function saveAll() {
    if (!hasInitialized.value) return
    const data = {
      containers: containers.value,
      yardZones: yardZones.value,
      moveTasks: moveTasks.value,
      reeferMonitors: reeferMonitors.value,
      exceptions: exceptions.value,
      shiftReports: shiftReports.value,
      yardPlans: yardPlans.value,
      arrivalRecords: arrivalRecords.value,
      departureRecords: departureRecords.value,
      slotsCache: slotsCache.value,
      savedAt: new Date().toISOString()
    }
    saveToStorage(STORAGE_KEY, data)
  }

  const totalSlots = computed(() => yardZones.value.reduce((sum, z) => sum + z.totalSlots, 0))
  const occupiedSlots = computed(() => {
    let count = 0
    Object.values(slotsCache.value).forEach(slots => {
      count += slots.filter(s => s.isOccupied).length
    })
    return count
  })
  const utilizationRate = computed(() => {
    if (totalSlots.value === 0) return '0.0'
    return ((occupiedSlots.value / totalSlots.value) * 100).toFixed(1)
  })
  
  const activeContainers = computed(() => containers.value.filter(c => c.status !== 'out'))
  const totalContainers = computed(() => activeContainers.value.length)
  const reeferCount = computed(() => activeContainers.value.filter(c => c.isReefer).length)
  const hazardousCount = computed(() => activeContainers.value.filter(c => c.isHazardous).length)
  const overdueCount = computed(() => activeContainers.value.filter(c => c.isOverdue).length)

  const pendingTasks = computed(() => moveTasks.value.filter(t => t.status === 'pending').length)
  const inProgressTasks = computed(() => moveTasks.value.filter(t => t.status === 'in_progress').length)
  const completedTasks = computed(() => moveTasks.value.filter(t => t.status === 'completed').length)

  const openExceptions = computed(() => exceptions.value.filter(e => e.status === 'open').length)
  const criticalExceptions = computed(() => exceptions.value.filter(e => e.severity === 'critical' && e.status !== 'closed').length)

  const reeferAlarms = computed(() => reeferMonitors.value.filter(r => r.alarmStatus !== 'normal').length)

  const filteredContainers = computed(() => {
    if (!searchKeyword.value) return activeContainers.value
    const keyword = searchKeyword.value.toLowerCase()
    return activeContainers.value.filter(c => 
      c.containerNo.toLowerCase().includes(keyword) ||
      c.location.toLowerCase().includes(keyword) ||
      c.blNo?.toLowerCase().includes(keyword) ||
      c.consignee?.toLowerCase().includes(keyword)
    )
  })

  function findContainerByNo(containerNo: string, includeDeparted: boolean = false): Container | undefined {
    return containers.value.find(c => {
      if (!includeDeparted && c.status === 'out') return false
      return c.containerNo.toLowerCase() === containerNo.toLowerCase()
    })
  }

  function isContainerDeparted(containerNo: string): boolean {
    const c = containers.value.find(c => c.containerNo.toLowerCase() === containerNo.toLowerCase())
    return c ? c.status === 'out' : false
  }

  function getZoneSlots(zoneCode: string): Slot[] {
    const zone = yardZones.value.find(z => z.zoneCode === zoneCode)
    if (!zone) return []
    if (!slotsCache.value[zoneCode]) {
      const slots = generateMockSlots(zone)
      activeContainers.value.forEach(c => {
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

  function isSlotOccupied(zoneCode: string, bay: number, row: number, tier: number): boolean {
    const slots = slotsCache.value[zoneCode]
    if (!slots) return false
    const slot = slots.find(s => s.bay === bay && s.row === row && s.tier === tier)
    return slot ? slot.isOccupied : false
  }

  function createMoveTask(task: Partial<MoveTask> & { containerNo: string }): MoveTask {
    const container = findContainerByNo(task.containerNo)
    const containerPriority = container?.priority || 3
    
    const newTask: MoveTask = {
      id: Math.random().toString(36).substring(2, 15),
      taskNo: `MT${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${(moveTasks.value.length + 1).toString().padStart(4, '0')}`,
      taskType: 'move',
      containerId: container?.id || '',
      containerNo: task.containerNo,
      fromLocation: container?.location || '',
      toLocation: '',
      priority: containerPriority,
      status: 'pending',
      createdBy: '当前用户',
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      ...task
    }
    moveTasks.value.unshift(newTask)
    saveAll()
    return newTask
  }

  function updateMoveTask(taskNo: string, updates: Partial<MoveTask>) {
    const index = moveTasks.value.findIndex(t => t.taskNo === taskNo)
    if (index !== -1) {
      moveTasks.value[index] = { ...moveTasks.value[index], ...updates }
      saveAll()
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
    saveAll()
    return newException
  }

  function updateException(exceptionNo: string, updates: Partial<Exception>) {
    const index = exceptions.value.findIndex(e => e.exceptionNo === exceptionNo)
    if (index !== -1) {
      exceptions.value[index] = { ...exceptions.value[index], ...updates }
      saveAll()
    }
  }

  function updateReeferMonitor(containerId: string, updates: Partial<ReeferMonitor>) {
    const index = reeferMonitors.value.findIndex(r => r.containerId === containerId)
    if (index !== -1) {
      reeferMonitors.value[index] = { ...reeferMonitors.value[index], ...updates }
      saveAll()
    }
  }

  function releaseSlot(zoneCode: string, bay: number, row: number, tier: number) {
    const slots = slotsCache.value[zoneCode]
    if (slots) {
      const slotIdx = slots.findIndex(s => s.bay === bay && s.row === row && s.tier === tier)
      if (slotIdx !== -1) {
        slots[slotIdx].isOccupied = false
        slots[slotIdx].containerId = undefined
        slots[slotIdx].containerNo = undefined
      }
    }
  }

  function assignSlot(containerNo: string, location: string, zoneCode: string, bay: number, row: number, tier: number): { success: boolean; message: string; container?: Container } {
    if (isContainerDeparted(containerNo)) {
      return { success: false, message: '该箱号已离场，请先重新登记到场' }
    }
    
    let container = findContainerByNo(containerNo)
    
    if (!container) {
      return { success: false, message: '箱号不存在，请先登记到场或检查箱号是否正确' }
    }
    
    if (isSlotOccupied(zoneCode, bay, row, tier)) {
      const slots = slotsCache.value[zoneCode]
      const occupiedBy = slots?.find(s => s.bay === bay && s.row === row && s.tier === tier)?.containerNo
      if (occupiedBy && occupiedBy.toLowerCase() !== containerNo.toLowerCase()) {
        return { success: false, message: `该箱位已被 ${occupiedBy} 占用，请选择其他箱位` }
      }
    }
    
    if (container.location && container.bay && container.row && container.tier) {
      const oldZone = container.location.charAt(0)
      releaseSlot(oldZone, container.bay, container.row, container.tier)
    }
    
    const slots = slotsCache.value[zoneCode]
    if (slots) {
      const newSlotIdx = slots.findIndex(s => s.bay === bay && s.row === row && s.tier === tier)
      if (newSlotIdx !== -1) {
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
    
    saveAll()
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

  function generateMoveInstruction(containerNo: string, toLocation: string): { success: boolean; message: string; task?: MoveTask } {
    if (isContainerDeparted(containerNo)) {
      return { success: false, message: '该箱号已离场，无法创建移箱任务' }
    }
    
    const container = findContainerByNo(containerNo)
    if (!container) {
      return { success: false, message: '箱号不存在' }
    }
    
    const task = createMoveTask({
      containerNo,
      fromLocation: container.location,
      toLocation,
      priority: container.priority,
      taskType: 'move',
      containerId: container.id
    })
    return { success: true, message: '移箱任务已创建', task }
  }

  function optimizeMoveTasks(tasks: MoveTask[]): MoveTask[] {
    return [...tasks].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1
      if (a.status !== 'in_progress' && b.status === 'in_progress') return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  function recordContainerArrival(container: Partial<Container> & { containerNo: string }): { success: boolean; message: string; container?: Container } {
    const existing = findContainerByNo(container.containerNo, true)
    if (existing) {
      if (existing.status !== 'out') {
        return { success: false, message: '该箱号已在堆场中' }
      }
      existing.status = 'in'
      existing.location = ''
      existing.bay = 0
      existing.row = 0
      existing.tier = 0
      existing.arrivalTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      existing.departureTime = undefined
      existing.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      saveAll()
      return { success: true, message: '已重新登记到场', container: existing }
    }
    
    const newContainer: Container = {
      id: Math.random().toString(36).substring(2, 15),
      containerNo: container.containerNo,
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
    saveAll()
    return { success: true, message: '登记到场成功', container: newContainer }
  }

  function recordContainerDeparture(containerNo: string): { success: boolean; message: string; container?: Container } {
    const container = findContainerByNo(containerNo)
    if (!container) {
      return { success: false, message: '箱号不存在或已离场' }
    }
    
    if (container.location && container.bay && container.row && container.tier) {
      const zoneCode = container.location.charAt(0)
      releaseSlot(zoneCode, container.bay, container.row, container.tier)
    }
    
    container.status = 'out'
    container.departureTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    container.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    saveAll()
    return { success: true, message: '登记离场成功', container }
  }

  function adjustContainerPriority(containerNo: string, priority: number): boolean {
    const container = findContainerByNo(containerNo, true)
    if (container) {
      container.priority = priority
      container.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      saveAll()
      return true
    }
    return false
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
    saveAll()
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
    saveAll()
    return newRecord
  }

  initData()

  watch([containers, moveTasks, arrivalRecords, departureRecords, slotsCache, yardZones], () => {
    saveAll()
  }, { deep: true })

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
    activeContainers,
    findContainerByNo,
    isContainerDeparted,
    getZoneSlots,
    isSlotOccupied,
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
    createDepartureRecord,
    saveAll,
    releaseSlot
  }
})
