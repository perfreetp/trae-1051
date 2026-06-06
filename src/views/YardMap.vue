<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">箱区平面图</h2>
      <div class="header-actions no-print">
        <el-select v-model="selectedZoneCode" style="width: 200px; margin-right: 12px;" @change="onZoneChange">
          <el-option v-for="zone in yardStore.yardZones" :key="zone.id" :label="zone.zoneName" :value="zone.zoneCode" />
        </el-select>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          <span>打印箱位图</span>
        </el-button>
      </div>
    </div>

    <div class="legend no-print">
      <div class="legend-item">
        <div class="legend-color" style="background: #fafafa;"></div>
        <span>空闲箱位</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #bae7ff;"></div>
        <span>已占用</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #d9f7be;"></div>
        <span>冷藏箱位</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #ffccc7;"></div>
        <span>危险品箱位</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #91d5ff; border: 2px solid #1890ff;"></div>
        <span>当前选中</span>
      </div>
    </div>

    <el-card v-if="currentZone" class="card-shadow" style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h3 style="margin: 0;">{{ currentZone.zoneName }}</h3>
          <p style="margin: 4px 0 0; color: #666; font-size: 13px;">
            {{ currentZone.description }} | 
            总箱位: {{ currentZone.totalSlots }} | 
            已占用: {{ occupiedCount }} | 
            利用率: {{ utilizationPercent }}% |
            贝位: {{ currentZone.maxBay }} |
            排位: {{ currentZone.maxRow }} |
            层位: {{ currentZone.maxTier }}
          </p>
        </div>
        <div class="no-print">
          <el-button size="small" @click="showAssignDialog = true">
            <el-icon><Plus /></el-icon>
            分配箱位
          </el-button>
          <el-button size="small" type="primary" @click="showStackingRules">
            <el-icon><Setting /></el-icon>
            堆存规则
          </el-button>
        </div>
      </div>

      <div class="yard-grid-container">
        <div class="row-header">
          <div class="corner-cell"></div>
          <div class="row-labels">
            <div class="row-label" v-for="row in currentZone.maxRow" :key="row">
              <span>排{{ row }}</span>
            </div>
          </div>
        </div>
        
        <div class="bays-container">
          <div v-for="bay in currentZone.maxBay" :key="bay" class="bay-column">
            <div class="bay-label">B{{ bay }}</div>
            <div class="bay-slots">
              <div v-for="row in currentZone.maxRow" :key="row" class="row-slots">
                <div 
                  v-for="tier in currentZone.maxTier" 
                  :key="tier"
                  class="slot-cell"
                  :class="getSlotClass(bay, row, tier)"
                  @click="selectSlot(bay, row, tier)"
                >
                  <span class="slot-position">{{ bay }}-{{ row }}-{{ tier }}</span>
                  <span v-if="getSlot(bay, row, tier)?.containerNo" class="slot-no">
                    {{ getSlot(bay, row, tier)?.containerNo?.slice(-4) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="tier-legend" style="margin-top: 12px; text-align: center; color: #666; font-size: 12px;">
        每层从下往上：第1层 → 第{{ currentZone.maxTier }}层 | 每格显示：贝位-排位-层位
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="card-shadow" title="选中箱位信息">
          <el-descriptions v-if="selectedSlot" :column="2" border size="small">
            <el-descriptions-item label="箱位编号">{{ selectedSlot.id }}</el-descriptions-item>
            <el-descriptions-item label="所在箱区">{{ selectedSlot.zoneCode }}区</el-descriptions-item>
            <el-descriptions-item label="贝位">{{ selectedSlot.bay }}</el-descriptions-item>
            <el-descriptions-item label="排位">{{ selectedSlot.row }}</el-descriptions-item>
            <el-descriptions-item label="层位">{{ selectedSlot.tier }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedSlot.isOccupied ? 'success' : 'info'">
                {{ selectedSlot.isOccupied ? '已占用' : '空闲' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedSlot.isOccupied" label="箱号">
              <strong>{{ selectedSlot.containerNo }}</strong>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedSlot.isOccupied" label="尺寸">
              {{ selectedContainer?.size || '-' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedSlot.isOccupied" label="优先级">
              <el-tag :type="getPriorityTagType(selectedContainer?.priority || 3)">
                P{{ selectedContainer?.priority || 3 }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="箱位类型">
              <span v-if="selectedSlot.isReeferSlot">
                <el-tag type="success" size="small">冷藏</el-tag>
              </span>
              <span v-if="selectedSlot.isHazardousSlot">
                <el-tag type="danger" size="small">危险品</el-tag>
              </span>
              <span v-if="!selectedSlot.isReeferSlot && !selectedSlot.isHazardousSlot">普通</span>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="请点击箱位查看详情" />
          
          <div v-if="selectedSlot && selectedSlot.isOccupied" class="no-print" style="margin-top: 16px;">
            <el-button type="primary" size="small" @click="handleMoveOut">移箱</el-button>
            <el-button size="small" @click="viewContainerDetail">查看详情</el-button>
            <el-button size="small" type="warning" @click="showAdjustPriority = true">调整优先级</el-button>
          </div>
          <div v-if="selectedSlot && !selectedSlot.isOccupied" class="no-print" style="margin-top: 16px;">
            <el-button type="success" size="small" @click="handleAssign">分配此箱位</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" title="快速查询">
          <el-input
            v-model="searchNo"
            placeholder="输入箱号查询位置..."
            clearable
            @keyup.enter="searchContainer"
            style="margin-bottom: 16px;"
          >
            <template #append>
              <el-button @click="searchContainer">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
          
          <div v-if="foundContainer" class="search-result">
            <el-alert title="找到集装箱" type="success" show-icon style="margin-bottom: 12px;">
              <template #default>
                <p style="margin: 4px 0;">箱号: <strong>{{ foundContainer.containerNo }}</strong></p>
                <p style="margin: 4px 0;">位置: <strong>{{ foundContainer.location }}</strong></p>
                <p style="margin: 4px 0;">尺寸: {{ foundContainer.size }}</p>
                <p style="margin: 4px 0;">优先级: P{{ foundContainer.priority }}</p>
              </template>
            </el-alert>
            <el-button type="primary" size="small" @click="highlightContainer">在图上定位并高亮</el-button>
          </div>
          <el-empty v-else-if="searchNo && !foundContainer" description="未找到该集装箱" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAssignDialog" title="分配箱位" width="500px" class="no-print">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="箱号">
          <el-input v-model="assignForm.containerNo" placeholder="请输入箱号" />
        </el-form-item>
        <el-form-item label="箱区">
          <el-select v-model="assignForm.zoneCode" style="width: 100%;" @change="updateZoneLimits">
            <el-option v-for="zone in yardStore.yardZones" :key="zone.id" :label="zone.zoneName" :value="zone.zoneCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="贝位">
          <el-input-number v-model="assignForm.bay" :min="1" :max="maxBay" />
        </el-form-item>
        <el-form-item label="排位">
          <el-input-number v-model="assignForm.row" :min="1" :max="maxRow" />
        </el-form-item>
        <el-form-item label="层位">
          <el-input-number v-model="assignForm.tier" :min="1" :max="maxTier" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRulesDialog" title="堆存规则设置" width="600px" class="no-print">
      <el-form label-width="120px">
        <el-form-item label="按重量分层">
          <el-switch v-model="rules.byWeight" />
          <span style="margin-left: 8px; color: #666; font-size: 13px;">重箱在下，轻箱在上</span>
        </el-form-item>
        <el-form-item label="按港序堆放">
          <el-switch v-model="rules.byPort" />
          <span style="margin-left: 8px; color: #666; font-size: 13px;">同港口集装箱集中堆放</span>
        </el-form-item>
        <el-form-item label="危险品隔离">
          <el-switch v-model="rules.hazardousIsolation" />
          <span style="margin-left: 8px; color: #666; font-size: 13px;">危险品箱按等级隔离</span>
        </el-form-item>
        <el-form-item label="冷藏箱专区">
          <el-switch v-model="rules.reeferZone" />
          <span style="margin-left: 8px; color: #666; font-size: 13px;">冷藏箱限定在冷藏区</span>
        </el-form-item>
        <el-form-item label="空箱最高层数">
          <el-input-number v-model="rules.maxEmptyTier" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="重箱最高层数">
          <el-input-number v-model="rules.maxHeavyTier" :min="1" :max="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRulesDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRules">保存规则</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAdjustPriority" title="调整出箱优先级" width="400px" class="no-print">
      <el-form label-width="100px">
        <el-form-item label="当前箱号">
          <span><strong>{{ selectedSlot?.containerNo }}</strong></span>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="newPriority">
            <el-radio :value="1">P1 - 最高</el-radio>
            <el-radio :value="2">P2 - 高</el-radio>
            <el-radio :value="3">P3 - 正常</el-radio>
            <el-radio :value="4">P4 - 低</el-radio>
            <el-radio :value="5">P5 - 最低</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdjustPriority = false">取消</el-button>
        <el-button type="primary" @click="confirmAdjustPriority">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { Slot, Container } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const yardStore = useYardStore()
const selectedZoneCode = ref('A')
const selectedSlotId = ref<string | null>(null)
const searchNo = ref('')
const foundContainer = ref<Container | null>(null)
const showAssignDialog = ref(false)
const showRulesDialog = ref(false)
const showAdjustPriority = ref(false)
const newPriority = ref(3)
const highlightSlotId = ref<string | null>(null)

const assignForm = reactive({
  containerNo: '',
  zoneCode: 'A',
  bay: 1,
  row: 1,
  tier: 1
})

const rules = reactive({
  byWeight: true,
  byPort: true,
  hazardousIsolation: true,
  reeferZone: true,
  maxEmptyTier: 6,
  maxHeavyTier: 4
})

const currentZone = computed(() => yardStore.yardZones.find(z => z.zoneCode === selectedZoneCode.value))

const zoneSlots = computed(() => {
  if (!currentZone.value) return []
  return yardStore.getZoneSlots(selectedZoneCode.value)
})

const occupiedCount = computed(() => zoneSlots.value.filter(s => s.isOccupied).length)

const utilizationPercent = computed(() => {
  if (!currentZone.value) return '0'
  return ((occupiedCount.value / currentZone.value.totalSlots) * 100).toFixed(1)
})

const selectedSlot = computed(() => {
  if (!selectedSlotId.value) return null
  return zoneSlots.value.find(s => s.id === selectedSlotId.value) || null
})

const selectedContainer = computed(() => {
  if (!selectedSlot.value?.containerNo) return null
  return yardStore.findContainerByNo(selectedSlot.value.containerNo) || null
})

const maxBay = computed(() => currentZone.value?.maxBay || 10)
const maxRow = computed(() => currentZone.value?.maxRow || 5)
const maxTier = computed(() => currentZone.value?.maxTier || 4)

watch(() => selectedZoneCode.value, () => {
  selectedSlotId.value = null
  highlightSlotId.value = null
})

function getSlot(bay: number, row: number, tier: number): Slot | undefined {
  return zoneSlots.value.find(s => s.bay === bay && s.row === row && s.tier === tier)
}

function getSlotClass(bay: number, row: number, tier: number) {
  const slot = getSlot(bay, row, tier)
  const slotId = slot?.id
  return {
    occupied: slot?.isOccupied,
    reefer: currentZone.value?.zoneType === 'reefer',
    hazardous: currentZone.value?.zoneType === 'hazardous',
    selected: selectedSlotId.value === slotId,
    highlight: highlightSlotId.value === slotId
  }
}

function onZoneChange() {
  selectedSlotId.value = null
  highlightSlotId.value = null
  updateZoneLimits()
}

function selectSlot(bay: number, row: number, tier: number) {
  const slot = getSlot(bay, row, tier)
  if (slot) {
    selectedSlotId.value = slot.id
    highlightSlotId.value = null
  }
}

function updateZoneLimits() {
  const zone = yardStore.yardZones.find(z => z.zoneCode === assignForm.zoneCode)
  if (zone) {
    if (assignForm.bay > zone.maxBay) assignForm.bay = zone.maxBay
    if (assignForm.row > zone.maxRow) assignForm.row = zone.maxRow
    if (assignForm.tier > zone.maxTier) assignForm.tier = zone.maxTier
  }
}

function searchContainer() {
  if (!searchNo.value.trim()) {
    foundContainer.value = null
    return
  }
  const no = searchNo.value.trim()
  if (yardStore.isContainerDeparted(no)) {
    ElMessage.warning('该箱号已离场，不在堆场中')
    foundContainer.value = null
    return
  }
  foundContainer.value = yardStore.findContainerByNo(no) || null
  if (!foundContainer.value) {
    ElMessage.warning('未找到该集装箱')
  }
}

function highlightContainer() {
  if (foundContainer.value && foundContainer.value.location) {
    const zoneCode = foundContainer.value.location.charAt(0)
    selectedZoneCode.value = zoneCode
    
    nextTick(() => {
      const container = foundContainer.value
      if (container) {
        const bay = container.bay || parseInt(container.location.charAt(1))
        const row = container.row || parseInt(container.location.charAt(2))
        const tier = container.tier || parseInt(container.location.charAt(3))
        const slot = getSlot(bay, row, tier)
        if (slot) {
          selectedSlotId.value = slot.id
          highlightSlotId.value = slot.id
          ElMessage.success(`已定位到${zoneCode}区 ${bay}-${row}-${tier} 箱位，并已高亮显示`)
        }
      }
    })
  }
}

function handleMoveOut() {
  if (selectedSlot.value?.containerNo) {
    const container = yardStore.findContainerByNo(selectedSlot.value.containerNo)
    yardStore.createMoveTask({
      containerNo: selectedSlot.value.containerNo,
      fromLocation: selectedSlot.value.id.replace(/-/g, ''),
      taskType: 'retrieve',
      priority: container?.priority || 3
    })
    ElMessage.success('已创建提箱任务')
    router.push('/move-tasks')
  }
}

function viewContainerDetail() {
  if (selectedSlot.value?.containerNo) {
    const container = yardStore.findContainerByNo(selectedSlot.value.containerNo)
    if (container) {
      ElMessage.info(`集装箱: ${container.containerNo}, 尺寸: ${container.size}, 状态: ${container.status}`)
    }
  }
}

function handleAssign() {
  if (selectedSlot.value) {
    assignForm.zoneCode = selectedSlot.value.zoneCode
    assignForm.bay = selectedSlot.value.bay
    assignForm.row = selectedSlot.value.row
    assignForm.tier = selectedSlot.value.tier
    showAssignDialog.value = true
  }
}

function confirmAssign() {
  if (!assignForm.containerNo.trim()) {
    ElMessage.warning('请输入箱号')
    return
  }
  
  const no = assignForm.containerNo.trim()
  
  if (yardStore.isContainerDeparted(no)) {
    ElMessageBox.confirm(
      '该箱号已离场，是否先重新登记到场再分配箱位？',
      '箱号已离场',
      {
        confirmButtonText: '重新登记并分配',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const result = yardStore.recordContainerArrival({ containerNo: no })
      if (result.success && result.container) {
        doAssign(result.container.containerNo)
      } else {
        ElMessage.error(result.message)
      }
    }).catch(() => {})
    return
  }
  
  const container = yardStore.findContainerByNo(no)
  
  if (!container) {
    ElMessageBox.confirm(
      '该箱号不存在，是否自动登记为待入场集装箱？',
      '箱号不存在',
      {
        confirmButtonText: '自动登记',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const result = yardStore.recordContainerArrival({ containerNo: no })
      if (result.success && result.container) {
        doAssign(result.container.containerNo)
      } else {
        ElMessage.error(result.message)
      }
    }).catch(() => {})
    return
  }
  
  doAssign(no)
}

function doAssign(containerNo: string) {
  const location = `${assignForm.zoneCode}${assignForm.bay}${assignForm.row}${assignForm.tier}`
  const result = yardStore.assignSlot(
    containerNo, 
    location, 
    assignForm.zoneCode, 
    assignForm.bay, 
    assignForm.row, 
    assignForm.tier
  )
  
  if (result.success) {
    ElMessage.success(result.message)
    showAssignDialog.value = false
    selectedSlotId.value = `${assignForm.zoneCode}-${assignForm.bay}-${assignForm.row}-${assignForm.tier}`
    assignForm.containerNo = ''
  } else {
    ElMessage.error(result.message)
  }
}

function confirmAdjustPriority() {
  if (selectedSlot.value?.containerNo) {
    yardStore.adjustContainerPriority(selectedSlot.value.containerNo, newPriority.value)
    ElMessage.success(`优先级已调整为 P${newPriority.value}`)
    showAdjustPriority.value = false
  }
}

function getPriorityTagType(priority: number) {
  if (priority <= 1) return 'danger'
  if (priority <= 2) return 'warning'
  if (priority <= 3) return ''
  return 'info'
}

function showStackingRules() {
  showRulesDialog.value = true
}

function saveRules() {
  ElMessage.success('堆存规则已保存')
  showRulesDialog.value = false
}

function handlePrint() {
  window.print()
}
</script>

<style scoped>
.search-result {
  padding: 8px 0;
}

.slot-cell.selected,
.slot-cell.highlight {
  background: #91d5ff !important;
  border-color: #1890ff !important;
  border-width: 2px;
  transform: scale(1.05);
  z-index: 10;
}

.slot-cell.highlight {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(24, 144, 255, 0);
  }
}

.yard-grid-container {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
}

.row-header {
  display: flex;
  margin-bottom: 4px;
}

.corner-cell {
  width: 50px;
  min-width: 50px;
  flex-shrink: 0;
}

.row-labels {
  display: flex;
  flex: 1;
  justify-content: space-around;
}

.row-label {
  flex: 1;
  text-align: center;
  font-weight: 600;
  color: #666;
  font-size: 12px;
  padding: 4px 0;
}

.bays-container {
  display: flex;
  gap: 8px;
}

.bay-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.bay-label {
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 4px;
  font-size: 13px;
}

.bay-slots {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row-slots {
  display: flex;
  gap: 2px;
}

.slot-cell {
  width: 48px;
  height: 48px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
  position: relative;
}

.slot-cell:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.slot-cell.occupied {
  background: #bae7ff;
}

.slot-cell.reefer {
  background: #d9f7be;
}

.slot-cell.reefer.occupied {
  background: #95de64;
}

.slot-cell.hazardous {
  background: #ffccc7;
}

.slot-cell.hazardous.occupied {
  background: #ff7875;
  color: #fff;
}

.slot-position {
  font-size: 10px;
  color: #888;
  line-height: 1;
}

.slot-cell.occupied .slot-position,
.slot-cell.reefer.occupied .slot-position,
.slot-cell.hazardous.occupied .slot-position {
  color: #333;
}

.slot-no {
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
  line-height: 1;
}
</style>
