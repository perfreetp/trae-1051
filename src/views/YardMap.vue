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
        <div class="legend-color" style="background: #91d5ff;"></div>
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
            已占用: {{ currentZone.occupiedSlots }} | 
            利用率: {{ ((currentZone.occupiedSlots / currentZone.totalSlots) * 100).toFixed(1) }}%
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
        <div class="row-labels">
          <div class="row-label" v-for="row in currentZone.maxRow" :key="row">{{ row }}</div>
        </div>
        <div>
          <div class="tier-labels">
            <div class="tier-label" v-for="tier in currentZone.maxTier" :key="tier">第{{ tier }}层</div>
          </div>
          <div v-for="bay in currentZone.maxBay" :key="bay" style="display: flex; margin-bottom: 4px;">
            <div class="bay-label">B{{ bay }}</div>
            <div class="slot-row">
              <div 
                v-for="tier in currentZone.maxTier" 
                :key="tier"
                class="slot-cell"
                :class="{
                  occupied: getSlot(bay, 1, tier)?.isOccupied,
                  reefer: currentZone.zoneType === 'reefer',
                  hazardous: currentZone.zoneType === 'hazardous',
                  selected: selectedSlot?.id === getSlot(bay, 1, tier)?.id
                }"
                @click="selectSlot(getSlot(bay, 1, tier)!)"
              >
                <span class="slot-position">{{ bay }}-1-{{ tier }}</span>
                <span v-if="getSlot(bay, 1, tier)?.containerNo" class="slot-no">
                  {{ getSlot(bay, 1, tier)?.containerNo?.slice(-4) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="card-shadow" title="选中箱位信息">
          <el-descriptions v-if="selectedSlot" :column="2" border size="small">
            <el-descriptions-item label="箱位编号">{{ selectedSlot.id }}</el-descriptions-item>
            <el-descriptions-item label="所在箱区">{{ selectedSlot.zoneCode }}区</el-descriptions-item>
            <el-descriptions-item label="贝位">{{ selectedSlot.bay }}</el-descriptions-item>
            <el-descriptions-item label="列位">{{ selectedSlot.row }}</el-descriptions-item>
            <el-descriptions-item label="层位">{{ selectedSlot.tier }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedSlot.isOccupied ? 'success' : 'info'">
                {{ selectedSlot.isOccupied ? '已占用' : '空闲' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedSlot.isOccupied" label="箱号">{{ selectedSlot.containerNo }}</el-descriptions-item>
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
              </template>
            </el-alert>
            <el-button type="primary" size="small" @click="highlightContainer">在图上定位</el-button>
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
          <el-select v-model="assignForm.zoneCode" style="width: 100%;">
            <el-option v-for="zone in yardStore.yardZones" :key="zone.id" :label="zone.zoneName" :value="zone.zoneCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="贝位">
          <el-input-number v-model="assignForm.bay" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="列位">
          <el-input-number v-model="assignForm.row" :min="1" :max="5" />
        </el-form-item>
        <el-form-item label="层位">
          <el-input-number v-model="assignForm.tier" :min="1" :max="6" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { Slot, Container } from '@/types'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const yardStore = useYardStore()
const selectedZoneCode = ref('A')
const selectedSlot = ref<Slot | null>(null)
const searchNo = ref('')
const foundContainer = ref<Container | null>(null)
const showAssignDialog = ref(false)
const showRulesDialog = ref(false)

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
const zoneSlots = computed(() => currentZone.value ? yardStore.getZoneSlots(selectedZoneCode.value) : [])

function getSlot(bay: number, row: number, tier: number): Slot | undefined {
  return zoneSlots.value.find(s => s.bay === bay && s.row === row && s.tier === tier)
}

function onZoneChange() {
  selectedSlot.value = null
}

function selectSlot(slot: Slot) {
  selectedSlot.value = slot
}

function searchContainer() {
  if (!searchNo.value.trim()) {
    foundContainer.value = null
    return
  }
  foundContainer.value = yardStore.findContainerByNo(searchNo.value.trim()) || null
  if (!foundContainer.value) {
    ElMessage.warning('未找到该集装箱')
  }
}

function highlightContainer() {
  if (foundContainer.value) {
    const zoneCode = foundContainer.value.location.charAt(0)
    selectedZoneCode.value = zoneCode
    ElMessage.success(`已定位到${zoneCode}区`)
  }
}

function handleMoveOut() {
  if (selectedSlot.value?.containerNo) {
    yardStore.createMoveTask({
      containerNo: selectedSlot.value.containerNo,
      fromLocation: selectedSlot.value.id.replace(/-/g, ''),
      taskType: 'retrieve'
    })
    ElMessage.success('已创建提箱任务')
    router.push('/move-tasks')
  }
}

function viewContainerDetail() {
  if (selectedSlot.value?.containerNo) {
    const container = yardStore.findContainerByNo(selectedSlot.value.containerNo)
    if (container) {
      ElMessage.info(`集装箱: ${container.containerNo}, 尺寸: ${container.size}`)
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
  const location = `${assignForm.zoneCode}${assignForm.bay}${assignForm.row}${assignForm.tier}`
  yardStore.assignSlot(assignForm.containerNo, location, assignForm.zoneCode, assignForm.bay, assignForm.row, assignForm.tier)
  ElMessage.success(`箱位已分配: ${location}`)
  showAssignDialog.value = false
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

.slot-cell.selected {
  background: #91d5ff !important;
  border-color: #1890ff !important;
  border-width: 2px;
}
</style>
