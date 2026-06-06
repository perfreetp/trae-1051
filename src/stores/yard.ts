import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Container, YardZone, MoveTask, ReeferMonitor, Exception, ShiftReport, YardPlan, Slot, ArrivalRecord, DepartureRecord, LifecycleEvent } from '@/types'
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
import dayjs from 'dayjs'

const STORAGE_KEY = 'container_yard_data_v2'

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
  const lifecycleEvents = ref<LifecycleEvent[]>([])

  function addLifecycleEvent(event: Omit<LifecycleEvent, 'id' | 'eventTime'>) {
    const newEvent: LifecycleEvent = {
      id: Math.random().toString(36).substring(2, 15),
      eventTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      ...event
    }
    lifecycleEvents.value.unshift(newEvent)
  }

  function getContainerLifecycle(containerNo: string): LifecycleEvent[] {
    return lifecycleEvents.value
      .filter(e => e.containerNo.toLowerCase() === containerNo.toLowerCase())
      .sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())
  }

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
      lifecycleEvents.value = savedData.lifecycleEvents || []
    } else {
      containers.value = generateMockContainers(200)
      yardZones.value = mockYardZones
      moveTasks.value = generateMockMoveTasks(30)
      reeferMonitors.value = generateMockReeferMonitors(20)
      exceptions.value = generateMockExceptions(15)
      shiftReports.value = generateMockShiftReports(10)
      yardPlans.value = mockYardPlans
      
      if (arrivalRecords.value.length === 0) {
        const arrived = containers.value.filter(c => c.status !== 'out').slice(0, 8)
        arrivalRecords.value = arrived.map((c, i) => ({
          id: `ARR${i.toString().padStart(4, '0')}`,
          containerNo: c.containerNo,
          size: c.size,
          vesselName: c.vesselName || '未知',
          blNo: c.blNo,
          location: c.location,
          arrivalTime: c.arrivalTime,
          operator: ['张三', '李四', '王五'][i % 3],
          remarks: '',
          cycleIndex: c.cycleIndex,
          isReArrival: c.cycleIndex > 1
        }))
      }
      if (departureRecords.value.length === 0) {
        const departed = containers.value.filter(c => c.status === 'out').slice(0, 6)
        departureRecords.value = departed.map((c, i) => ({
          id: `DEP${i.toString().padStart(4, '0')}`,
          containerNo: c.containerNo,
          size: c.size,
          vesselName: c.vesselName || '未知',
          blNo: c.blNo,
          fromLocation: c.location || '未知',
          departureTime: c.departureTime || new Date(Date.now() - (i + 1) * 3600000).toISOString().slice(0, 19).replace('T', ' '),
          operator: ['李四', '王五', '赵六'][i % 3],
          remarks: '',
          cycleIndex: c.cycleIndex,
          hasReArrived: false
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
      
      containers.value.filter(c => c.status !== 'out').forEach(c => {
        addLifecycleEvent({
          containerNo: c.containerNo,
          eventType: 'arrival',
          operator: '系统初始化',
          toLocation: c.location,
          cycleIndex: c.cycleIndex
        })
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
      lifecycleEvents: lifecycleEvents.value,
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
  const departedContainers = computed(() => containers.value.filter(c => c.status === 'out'))
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

  function findDepartedContainerByNo(containerNo: string): Container | undefined {
    return containers.value.find(c => 
      c.status === 'out' && c.containerNo.toLowerCase() === containerNo.toLowerCase()
    )
  }

  function isContainerDeparted(containerNo: string): boolean {
    const c = containers.value.find(c => c.containerNo.toLowerCase() === containerNo.toLowerCase())
    return c ? c.status === 'out' : false
  }

  function getDepartureInfo(containerNo: string): DepartureRecord | undefined {
    return departureRecords.value
      .filter(r => r.containerNo.toLowerCase() === containerNo.toLowerCase())
      .sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime())[0]
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

  function checkSlotReleaseErrors(): Exception[] {
    const errors: Exception[] = []
    departureRecords.value.forEach(rec => {
      const c = findContainerByNo(rec.containerNo, true)
      if (c && c.status === 'out' && rec.fromLocation && rec.fromLocation !== '未知') {
        const zoneCode = rec.fromLocation.charAt(0)
        const slots = slotsCache.value[zoneCode]
        if (slots) {
          const bay = parseInt(rec.fromLocation.charAt(1))
          const row = parseInt(rec.fromLocation.charAt(2))
          const tier = parseInt(rec.fromLocation.charAt(3))
          const slot = slots.find(s => s.bay === bay && s.row === row && s.tier === tier)
          if (slot?.isOccupied && slot.containerNo?.toLowerCase() === rec.containerNo.toLowerCase()) {
            const existingEx = exceptions.value.find(e => 
              e.exceptionType === 'location_error' && 
              e.containerNo?.toLowerCase() === rec.containerNo.toLowerCase() &&
              e.status !== 'closed'
            )
            if (!existingEx) {
              errors.push({
                id: Math.random().toString(36).substring(2, 15),
                exceptionNo: `EX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${(exceptions.value.length + 1).toString().padStart(4, '0')}`,
                exceptionType: 'location_error',
                severity: 'medium',
                containerNo: rec.containerNo,
                location: rec.fromLocation,
                description: `箱号 ${rec.containerNo} 已离场但原箱位 ${rec.fromLocation} 仍显示占用`,
                status: 'open',
                reportedBy: '系统检测',
                reportedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
              })
            }
          }
        }
      }
    })
    return errors
  }

  function createMoveTask(task: Partial<MoveTask> & { containerNo: string }): { success: boolean; message: string; task?: MoveTask } {
    if (isContainerDeparted(task.containerNo)) {
      return { success: false, message: '该箱号已离场，需要先重新登记到场后才能创建作业任务' }
    }
    
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
    
    addLifecycleEvent({
      containerNo: task.containerNo,
      eventType: 'create_task',
      operator: '当前用户',
      fromLocation: newTask.fromLocation,
      toLocation: newTask.toLocation,
      taskNo: newTask.taskNo,
      taskType: newTask.taskType,
      remarks: `创建${getTaskTypeName(newTask.taskType)}任务`
    })
    
    saveAll()
    return { success: true, message: '任务创建成功', task: newTask }
  }

  function getTaskTypeName(type: string): string {
    const map: Record<string, string> = {
      move: '移箱',
      lift: '吊装',
      stack: '堆码',
      retrieve: '提箱'
    }
    return map[type] || type
  }

  function getContainerTasks(containerNo: string): MoveTask[] {
    return moveTasks.value
      .filter(t => t.containerNo.toLowerCase() === containerNo.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function updateMoveTask(taskNo: string, updates: Partial<MoveTask>) {
    const index = moveTasks.value.findIndex(t => t.taskNo === taskNo)
    if (index !== -1) {
      const oldStatus = moveTasks.value[index].status
      moveTasks.value[index] = { ...moveTasks.value[index], ...updates }
      
      if (updates.status === 'completed' && oldStatus !== 'completed') {
        addLifecycleEvent({
          containerNo: moveTasks.value[index].containerNo,
          eventType: 'complete_task',
          operator: updates.assignedTo || '当前用户',
          taskNo: taskNo,
          taskType: moveTasks.value[index].taskType,
          fromLocation: moveTasks.value[index].fromLocation,
          toLocation: moveTasks.value[index].toLocation,
          remarks: '任务完成'
        })
      }
      
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
    
    const oldLocation = container.location
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
    
    addLifecycleEvent({
      containerNo,
      eventType: 'assign_slot',
      operator: '当前用户',
      fromLocation: oldLocation,
      toLocation: location,
      cycleIndex: container.cycleIndex
    })
    
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
    
    const result = createMoveTask({
      containerNo,
      fromLocation: container.location,
      toLocation,
      priority: container.priority,
      taskType: 'move',
      containerId: container.id
    })
    return result
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
      existing.totalCycles = existing.totalCycles + 1
      existing.cycleIndex = existing.totalCycles
      
      const lastDep = departureRecords.value.find(r => r.containerNo.toLowerCase() === container.containerNo.toLowerCase())
      if (lastDep) {
        lastDep.hasReArrived = true
        lastDep.reArrivalTime = existing.arrivalTime
      }
      
      addLifecycleEvent({
        containerNo: container.containerNo,
        eventType: 're_arrival',
        operator: '当前用户',
        toLocation: '',
        cycleIndex: existing.cycleIndex,
        remarks: `第${existing.cycleIndex}次入场`
      })
      
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
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      cycleIndex: 1,
      totalCycles: 1
    }
    containers.value.unshift(newContainer)
    
    addLifecycleEvent({
      containerNo: container.containerNo,
      eventType: 'arrival',
      operator: '当前用户',
      toLocation: '',
      cycleIndex: 1,
      remarks: '首次入场'
    })
    
    saveAll()
    return { success: true, message: '登记到场成功', container: newContainer }
  }

  function recordContainerDeparture(containerNo: string): { success: boolean; message: string; container?: Container } {
    const container = findContainerByNo(containerNo)
    if (!container) {
      return { success: false, message: '箱号不存在或已离场' }
    }
    
    const oldLocation = container.location
    
    if (container.location && container.bay && container.row && container.tier) {
      const zoneCode = container.location.charAt(0)
      releaseSlot(zoneCode, container.bay, container.row, container.tier)
    }
    
    container.status = 'out'
    container.departureTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    container.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    addLifecycleEvent({
      containerNo,
      eventType: 'departure',
      operator: '当前用户',
      fromLocation: oldLocation,
      cycleIndex: container.cycleIndex,
      remarks: `第${container.cycleIndex}次离场`
    })
    
    saveAll()
    return { success: true, message: '登记离场成功', container }
  }

  function batchDeparture(containerNos: string[]): { 
    success: string[]
    failed: { containerNo: string; reason: string }[]
  } {
    const result = {
      success: [] as string[],
      failed: [] as { containerNo: string; reason: string }[]
    }
    
    containerNos.forEach(no => {
      const trimmed = no.trim()
      if (!trimmed) return
      
      if (isContainerDeparted(trimmed)) {
        result.failed.push({ containerNo: trimmed, reason: '已离场' })
        return
      }
      
      const container = findContainerByNo(trimmed)
      if (!container) {
        result.failed.push({ containerNo: trimmed, reason: '箱号不存在' })
        return
      }
      
      const depResult = recordContainerDeparture(trimmed)
      if (depResult.success) {
        result.success.push(trimmed)
        createDepartureRecord({
          containerNo: trimmed,
          size: container.size,
          vesselName: container.vesselName || '',
          blNo: container.blNo,
          fromLocation: container.location,
          operator: '当前用户',
          cycleIndex: container.cycleIndex
        })
      } else {
        result.failed.push({ containerNo: trimmed, reason: depResult.message })
      }
    })
    
    return result
  }

  function adjustContainerPriority(containerNo: string, priority: number): boolean {
    const container = findContainerByNo(containerNo, true)
    if (container) {
      const oldPriority = container.priority
      container.priority = priority
      container.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      
      addLifecycleEvent({
        containerNo,
        eventType: 'adjust_priority',
        operator: '当前用户',
        oldPriority,
        newPriority: priority,
        remarks: `优先级从 P${oldPriority} 调整为 P${priority}`
      })
      
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
      remarks: record.remarks,
      cycleIndex: record.cycleIndex,
      isReArrival: record.isReArrival
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
      remarks: record.remarks,
      cycleIndex: record.cycleIndex,
      hasReArrived: false
    }
    departureRecords.value.unshift(newRecord)
    saveAll()
    return newRecord
  }

  function getTurnoverStats(period: 'day' | 'week' | 'month', zoneCode?: string, size?: string) {
    const days = period === 'day' ? 7 : period === 'week' ? 8 : 30
    const stats = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, period === 'day' ? 'day' : period === 'week' ? 'week' : 'month')
      const dateStr = date.format(period === 'day' ? 'YYYY-MM-DD' : period === 'week' ? 'YYYY年第WW周' : 'YYYY-MM')
      
      const arrivals = arrivalRecords.value.filter(r => {
        if (zoneCode && r.location.charAt(0) !== zoneCode) return false
        return dayjs(r.arrivalTime).isSame(date, period === 'day' ? 'day' : period === 'week' ? 'week' : 'month')
      })
      
      const departures = departureRecords.value.filter(r => {
        if (zoneCode && r.fromLocation.charAt(0) !== zoneCode) return false
        return dayjs(r.departureTime).isSame(date, period === 'day' ? 'day' : period === 'week' ? 'week' : 'month')
      })
      
      const reArrivals = arrivals.filter(a => a.isReArrival).length
      const activeContainersOnDate = activeContainers.value.filter(c => {
        const arrDate = dayjs(c.arrivalTime)
        const depDate = c.departureTime ? dayjs(c.departureTime) : null
        return arrDate.isBefore(date.endOf(period === 'day' ? 'day' : period === 'week' ? 'week' : 'month')) &&
               (!depDate || depDate.isAfter(date.startOf(period === 'day' ? 'day' : period === 'week' ? 'week' : 'month')))
      })
      
      const avgStayDays = activeContainersOnDate.length > 0
        ? activeContainersOnDate.reduce((sum, c) => {
            const start = dayjs(c.arrivalTime)
            const end = c.departureTime ? dayjs(c.departureTime) : dayjs()
            return sum + end.diff(start, 'day')
          }, 0) / activeContainersOnDate.length
        : 0
      
      const overdueCount = departures.filter(d => {
        const c = findContainerByNo(d.containerNo, true)
        return c && c.isOverdue
      }).length
      
      stats.push({
        date: dateStr,
        arrivals: arrivals.length,
        departures: departures.length,
        reArrivals,
        avgStayDays: avgStayDays.toFixed(1),
        overdueCount
      })
    }
    
    return stats
  }

  initData()

  watch([containers, moveTasks, arrivalRecords, departureRecords, slotsCache, yardZones, lifecycleEvents], () => {
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
    lifecycleEvents,
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
    departedContainers,
    findContainerByNo,
    findDepartedContainerByNo,
    isContainerDeparted,
    getDepartureInfo,
    getContainerLifecycle,
    getContainerTasks,
    getZoneSlots,
    isSlotOccupied,
    checkSlotReleaseErrors,
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
    batchDeparture,
    adjustContainerPriority,
    createArrivalRecord,
    createDepartureRecord,
    getTurnoverStats,
    saveAll,
    releaseSlot,
    getTaskTypeName
  }
})
