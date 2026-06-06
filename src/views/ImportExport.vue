<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">进出口计划</h2>
      <div class="header-actions no-print">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          <span>新建计划</span>
        </el-button>
        <el-button type="success" @click="showArrivalDialog = true">
          <el-icon><Download /></el-icon>
          <span>登记到场</span>
        </el-button>
        <el-button type="warning" @click="showDepartureDialog = true">
          <el-icon><Upload /></el-icon>
          <span>登记离场</span>
        </el-button>
        <el-button type="info" @click="showBatchDepartureDialog = true">
          <el-icon><DocumentCopy /></el-icon>
          <span>批量离场</span>
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          <span>打印</span>
        </el-button>
      </div>
    </div>

    <div class="filter-bar no-print">
      <el-select v-model="filterType" placeholder="计划类型" clearable style="width: 120px;">
        <el-option label="进口计划" value="import" />
        <el-option label="出口计划" value="export" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px;">
        <el-option label="草稿" value="draft" />
        <el-option label="已审批" value="approved" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-date-picker 
        v-model="filterDate" 
        type="date" 
        placeholder="选择日期" 
        style="width: 180px;" 
        value-format="YYYY-MM-DD"
      />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>
        查询
      </el-button>
      <el-button @click="handleReset">
        <el-icon><RefreshRight /></el-icon>
        重置
      </el-button>
      <span style="margin-left: 12px; color: #666; font-size: 13px;">
        共 {{ filteredPlans.length }} 条记录
      </span>
    </div>

    <el-card class="card-shadow">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="进口计划" name="import">
          <el-table :data="filteredImportPlans" border stripe>
            <el-table-column prop="planNo" label="计划编号" width="180" />
            <el-table-column prop="vesselName" label="船名" width="140" />
            <el-table-column prop="voyageNo" label="航次" width="120" />
            <el-table-column prop="eta" label="预计到港" width="160" />
            <el-table-column prop="containerCount" label="集装箱数" width="120" align="center" />
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="{ row }">
                <span :class="['tag-status', row.status]">{{ getStatusName(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdBy" label="创建人" width="120" />
            <el-table-column prop="createdAt" label="创建时间" width="160" />
            <el-table-column label="操作" width="240" fixed="right" class="no-print">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewPlan(row)">查看</el-button>
                <el-button type="primary" link size="small" @click="editPlan(row)">编辑</el-button>
                <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="approvePlan(row)">审批</el-button>
                <el-button v-if="row.status === 'approved'" type="warning" link size="small" @click="startPlan(row)">开始执行</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="filteredImportPlans.length === 0" description="暂无进口计划数据" :image-size="80" />
        </el-tab-pane>
        <el-tab-pane label="出口计划" name="export">
          <el-table :data="filteredExportPlans" border stripe>
            <el-table-column prop="planNo" label="计划编号" width="180" />
            <el-table-column prop="vesselName" label="船名" width="140" />
            <el-table-column prop="voyageNo" label="航次" width="120" />
            <el-table-column prop="etd" label="预计离港" width="160" />
            <el-table-column prop="containerCount" label="集装箱数" width="120" align="center" />
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="{ row }">
                <span :class="['tag-status', row.status]">{{ getStatusName(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdBy" label="创建人" width="120" />
            <el-table-column prop="createdAt" label="创建时间" width="160" />
            <el-table-column label="操作" width="240" fixed="right" class="no-print">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewPlan(row)">查看</el-button>
                <el-button type="primary" link size="small" @click="editPlan(row)">编辑</el-button>
                <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="approvePlan(row)">审批</el-button>
                <el-button v-if="row.status === 'approved'" type="warning" link size="small" @click="startPlan(row)">开始执行</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="filteredExportPlans.length === 0" description="暂无出口计划数据" :image-size="80" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>到港记录 ({{ yardStore.arrivalRecords.length }})</span>
            </div>
          </template>
          <el-table :data="yardStore.arrivalRecords" border stripe max-height="350">
            <el-table-column prop="containerNo" label="箱号" width="140" />
            <el-table-column prop="size" label="尺寸" width="90" align="center" />
            <el-table-column prop="vesselName" label="船名" width="120" />
            <el-table-column prop="location" label="指定位置" width="110" align="center" />
            <el-table-column prop="arrivalTime" label="到场时间" width="160" />
            <el-table-column prop="operator" label="操作员" width="100" />
            <el-table-column label="状态" width="90" align="center">
              <template #default>
                <el-tag type="success" size="small">已到场</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>离港记录 ({{ filteredDepartureRecords.length }})</span>
            </div>
          </template>
          <div class="departure-filter-bar no-print">
            <el-input v-model="departureFilter.containerNo" placeholder="箱号" clearable style="width: 120px;" size="small" />
            <el-date-picker
              v-model="departureFilter.departureTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 280px;"
              size="small"
            />
            <el-input v-model="departureFilter.vesselName" placeholder="船名" clearable style="width: 120px;" size="small" />
            <el-select v-model="departureFilter.operator" placeholder="操作员" clearable style="width: 110px;" size="small">
              <el-option v-for="op in operatorOptions" :key="op" :label="op" :value="op" />
            </el-select>
            <el-button type="primary" size="small" @click="applyDepartureFilter">
              <el-icon><Search /></el-icon>
              筛选
            </el-button>
            <el-button size="small" @click="resetDepartureFilter">
              <el-icon><RefreshRight /></el-icon>
              重置
            </el-button>
          </div>
          <el-table 
            :data="filteredDepartureRecords" 
            border 
            stripe 
            max-height="350" 
            style="margin-top: 10px;"
            @row-click="viewDepartureDetail"
            highlight-current-row
          >
            <el-table-column prop="containerNo" label="箱号" width="140" />
            <el-table-column prop="size" label="尺寸" width="90" align="center" />
            <el-table-column prop="vesselName" label="船名" width="120" />
            <el-table-column prop="fromLocation" label="原位置" width="110" align="center" />
            <el-table-column prop="departureTime" label="离场时间" width="160" />
            <el-table-column prop="operator" label="操作员" width="100" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.hasReArrived" type="warning" size="small">已重进场</el-tag>
                <el-tag v-else type="info" size="small">已离场</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreateDialog" title="新建进出口计划" width="600px" class="no-print">
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="计划类型">
          <el-radio-group v-model="planForm.planType">
            <el-radio value="import">进口计划</el-radio>
            <el-radio value="export">出口计划</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="船名">
          <el-input v-model="planForm.vesselName" placeholder="请输入船名" />
        </el-form-item>
        <el-form-item label="航次">
          <el-input v-model="planForm.voyageNo" placeholder="请输入航次" />
        </el-form-item>
        <el-form-item v-if="planForm.planType === 'import'" label="预计到港">
          <el-date-picker v-model="planForm.eta" type="datetime" placeholder="选择时间" style="width: 100%;" value-format="YYYY-MM-DD HH:mm" />
        </el-form-item>
        <el-form-item v-if="planForm.planType === 'export'" label="预计离港">
          <el-date-picker v-model="planForm.etd" type="datetime" placeholder="选择时间" style="width: 100%;" value-format="YYYY-MM-DD HH:mm" />
        </el-form-item>
        <el-form-item label="集装箱数量">
          <el-input-number v-model="planForm.containerCount" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="planForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showArrivalDialog" title="登记到场" width="550px" class="no-print">
      <el-form :model="arrivalForm" label-width="100px">
        <el-form-item label="箱号" required>
          <el-input v-model="arrivalForm.containerNo" placeholder="请输入箱号" />
        </el-form-item>
        <el-form-item label="尺寸">
          <el-select v-model="arrivalForm.size" style="width: 100%;">
            <el-option label="20GP" value="20GP" />
            <el-option label="40GP" value="40GP" />
            <el-option label="40HQ" value="40HQ" />
            <el-option label="20RF" value="20RF" />
            <el-option label="40RF" value="40RF" />
          </el-select>
        </el-form-item>
        <el-form-item label="船名">
          <el-input v-model="arrivalForm.vesselName" placeholder="请输入船名" />
        </el-form-item>
        <el-form-item label="提单号">
          <el-input v-model="arrivalForm.blNo" placeholder="请输入提单号" />
        </el-form-item>
        <el-form-item label="箱区">
          <el-select v-model="arrivalForm.zoneCode" style="width: 100%;" @change="onArrivalZoneChange">
            <el-option v-for="zone in yardStore.yardZones" :key="zone.id" :label="zone.zoneName" :value="zone.zoneCode" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="贝位">
              <el-input-number v-model="arrivalForm.bay" :min="1" :max="arrivalMaxBay" style="width: 100%;" @change="checkSlotOccupied" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排位">
              <el-input-number v-model="arrivalForm.row" :min="1" :max="arrivalMaxRow" style="width: 100%;" @change="checkSlotOccupied" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="层位">
              <el-input-number v-model="arrivalForm.tier" :min="1" :max="arrivalMaxTier" style="width: 100%;" @change="checkSlotOccupied" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="slotOccupiedWarning">
          <el-alert :title="slotOccupiedWarning" type="error" :closable="false" show-icon size="small" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="arrivalForm.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showArrivalDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmArrival">确认登记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDepartureDialog" title="登记离场" width="500px" class="no-print">
      <el-form :model="departureForm" label-width="100px">
        <el-form-item label="箱号" required>
          <el-input v-model="departureForm.containerNo" placeholder="请输入箱号" @blur="loadContainerInfo" />
        </el-form-item>
        <el-form-item v-if="departureContainer" label="箱号信息">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="尺寸">{{ departureContainer.size }}</el-descriptions-item>
            <el-descriptions-item label="当前位置">{{ departureContainer.location }}</el-descriptions-item>
            <el-descriptions-item label="船名">{{ departureContainer.vesselName || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item v-else-if="departureForm.containerNo && !departureContainer">
          <el-alert title="未找到该箱号，请检查是否正确" type="warning" :closable="false" show-icon />
        </el-form-item>
        <el-form-item label="船名">
          <el-input v-model="departureForm.vesselName" placeholder="请输入船名" />
        </el-form-item>
        <el-form-item label="提单号">
          <el-input v-model="departureForm.blNo" placeholder="请输入提单号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="departureForm.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDepartureDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!departureContainer" @click="confirmDeparture">确认登记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="计划详情" width="700px">
      <el-descriptions v-if="selectedPlan" :column="2" border>
        <el-descriptions-item label="计划编号">{{ selectedPlan.planNo }}</el-descriptions-item>
        <el-descriptions-item label="计划类型">
          {{ selectedPlan.planType === 'import' ? '进口计划' : '出口计划' }}
        </el-descriptions-item>
        <el-descriptions-item label="船名">{{ selectedPlan.vesselName }}</el-descriptions-item>
        <el-descriptions-item label="航次">{{ selectedPlan.voyageNo }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedPlan.eta" label="预计到港">{{ selectedPlan.eta }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedPlan.etd" label="预计离港">{{ selectedPlan.etd }}</el-descriptions-item>
        <el-descriptions-item label="集装箱数量">{{ selectedPlan.containerCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="['tag-status', selectedPlan.status]">{{ getStatusName(selectedPlan.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ selectedPlan.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedPlan.createdAt }}</el-descriptions-item>
      </el-descriptions>
      <template #footer class="no-print">
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="printPlan">打印计划单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDepartureDetailDialog" title="离港记录详情" width="750px">
      <el-descriptions v-if="selectedDepartureRecord" :column="2" border>
        <el-descriptions-item label="箱号">{{ selectedDepartureRecord.containerNo }}</el-descriptions-item>
        <el-descriptions-item label="尺寸">{{ selectedDepartureRecord.size }}</el-descriptions-item>
        <el-descriptions-item label="船名">{{ selectedDepartureRecord.vesselName }}</el-descriptions-item>
        <el-descriptions-item label="提单号">{{ selectedDepartureRecord.blNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="离场前最后箱位">{{ selectedDepartureRecord.fromLocation }}</el-descriptions-item>
        <el-descriptions-item label="离场时间">{{ selectedDepartureRecord.departureTime }}</el-descriptions-item>
        <el-descriptions-item label="登记人">{{ selectedDepartureRecord.operator }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ selectedDepartureRecord.remarks || '-' }}</el-descriptions-item>
        <el-descriptions-item label="是否重新到场" :span="2">
          <el-tag v-if="selectedDepartureRecord.hasReArrived" type="success">
            是，重新到场时间：{{ selectedDepartureRecord.reArrivalTime }}
          </el-tag>
          <el-tag v-else type="info">否</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">生命周期时间线</el-divider>
      <div class="lifecycle-timeline">
        <el-timeline>
          <el-timeline-item
            v-for="event in containerLifecycle"
            :key="event.id"
            :timestamp="event.eventTime"
            placement="top"
          >
            <el-card shadow="hover">
              <h4>{{ getEventTypeName(event.eventType) }}</h4>
              <p>操作员：{{ event.operator }}</p>
              <p v-if="event.fromLocation">原位置：{{ event.fromLocation }}</p>
              <p v-if="event.toLocation">目标位置：{{ event.toLocation }}</p>
              <p v-if="event.taskNo">任务编号：{{ event.taskNo }}</p>
              <p v-if="event.remarks">备注：{{ event.remarks }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <template #footer>
        <el-button @click="showDepartureDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchDepartureDialog" title="批量离场登记" width="700px">
      <el-alert
        title="请输入多个箱号，支持一行一个或逗号分隔"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />
      <el-input
        v-model="batchDepartureInput"
        type="textarea"
        :rows="5"
        placeholder="例如：
CBHU1234567
MSKU9876543
或：CBHU1234567, MSKU9876543"
      />
      <div style="margin-top: 15px;">
        <el-button type="primary" @click="validateBatchContainers" :loading="validating">
          <el-icon><Check /></el-icon>
          校验
        </el-button>
        <el-button 
          type="warning" 
          @click="confirmBatchDeparture" 
          :disabled="!batchValidationResult || batchValidationResult.available.length === 0"
          :loading="departing"
        >
          <el-icon><Upload /></el-icon>
          确认离场
        </el-button>
      </div>
      
      <el-divider v-if="batchValidationResult" />
      
      <div v-if="batchValidationResult">
        <h4 style="margin-bottom: 10px;">校验结果</h4>
        <el-table :data="batchValidationResult.details" border stripe size="small">
          <el-table-column prop="containerNo" label="箱号" width="180" />
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'available'" type="success">在场</el-tag>
              <el-tag v-else-if="row.status === 'departed'" type="info">已离场</el-tag>
              <el-tag v-else type="danger">不存在</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="说明" />
        </el-table>
        <div style="margin-top: 10px; color: #666;">
          共 {{ batchValidationResult.details.length }} 个箱号，
          可离场：<span style="color: #67c23a; font-weight: bold;">{{ batchValidationResult.available.length }}</span> 个，
          不可离场：<span style="color: #f56c6c; font-weight: bold;">{{ batchValidationResult.unavailable.length }}</span> 个
        </div>
      </div>
      
      <el-divider v-if="batchDepartureResult" />
      
      <div v-if="batchDepartureResult">
        <h4 style="margin-bottom: 10px;">执行结果</h4>
        <el-alert
          :title="`成功 ${batchDepartureResult.success.length} 个，失败 ${batchDepartureResult.failed.length} 个`"
          :type="batchDepartureResult.failed.length === 0 ? 'success' : 'warning'"
          :closable="false"
          show-icon
          style="margin-bottom: 10px;"
        />
        <el-table v-if="batchDepartureResult.failed.length > 0" :data="batchDepartureResult.failed" border stripe size="small">
          <el-table-column prop="containerNo" label="箱号" width="180" />
          <el-table-column prop="reason" label="失败原因" />
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="closeBatchDepartureDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { YardPlan, Container, DepartureRecord, LifecycleEvent } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const yardStore = useYardStore()
const activeTab = ref('import')
const filterType = ref('')
const filterStatus = ref('')
const filterDate = ref('')
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showArrivalDialog = ref(false)
const showDepartureDialog = ref(false)
const selectedPlan = ref<YardPlan | null>(null)
const departureContainer = ref<Container | null>(null)
const slotOccupiedWarning = ref('')

const showDepartureDetailDialog = ref(false)
const showBatchDepartureDialog = ref(false)
const selectedDepartureRecord = ref<DepartureRecord | null>(null)
const batchDepartureInput = ref('')
const validating = ref(false)
const departing = ref(false)
const batchValidationResult = ref<{
  details: { containerNo: string; status: 'available' | 'departed' | 'not_found'; message: string }[]
  available: string[]
  unavailable: string[]
} | null>(null)
const batchDepartureResult = ref<{
  success: string[]
  failed: { containerNo: string; reason: string }[]
} | null>(null)

const departureFilter = reactive({
  containerNo: '',
  departureTimeRange: [] as string[],
  vesselName: '',
  operator: ''
})

const departureFilterApplied = reactive({
  containerNo: '',
  departureTimeRange: [] as string[],
  vesselName: '',
  operator: ''
})

const operatorOptions = computed(() => {
  const operators = new Set<string>()
  yardStore.departureRecords.forEach(r => {
    if (r.operator) operators.add(r.operator)
  })
  return Array.from(operators)
})

const filteredDepartureRecords = computed(() => {
  let records = [...yardStore.departureRecords]
  
  if (departureFilterApplied.containerNo) {
    const keyword = departureFilterApplied.containerNo.toLowerCase()
    records = records.filter(r => r.containerNo.toLowerCase().includes(keyword))
  }
  
  if (departureFilterApplied.departureTimeRange && departureFilterApplied.departureTimeRange.length === 2) {
    const [start, end] = departureFilterApplied.departureTimeRange
    records = records.filter(r => {
      const time = dayjs(r.departureTime)
      return time.isAfter(dayjs(start)) && time.isBefore(dayjs(end).endOf('day'))
    })
  }
  
  if (departureFilterApplied.vesselName) {
    const keyword = departureFilterApplied.vesselName.toLowerCase()
    records = records.filter(r => r.vesselName.toLowerCase().includes(keyword))
  }
  
  if (departureFilterApplied.operator) {
    records = records.filter(r => r.operator === departureFilterApplied.operator)
  }
  
  return records
})

const containerLifecycle = computed((): LifecycleEvent[] => {
  if (!selectedDepartureRecord.value) return []
  return yardStore.getContainerLifecycle(selectedDepartureRecord.value.containerNo)
})

const planForm = reactive({
  planType: 'import',
  vesselName: '',
  voyageNo: '',
  eta: '',
  etd: '',
  containerCount: 1,
  remarks: ''
})

const arrivalForm = reactive({
  containerNo: '',
  size: '20GP',
  vesselName: '',
  blNo: '',
  zoneCode: 'A',
  bay: 1,
  row: 1,
  tier: 1,
  remarks: ''
})

const departureForm = reactive({
  containerNo: '',
  vesselName: '',
  blNo: '',
  remarks: ''
})

const arrivalMaxBay = computed(() => {
  const zone = yardStore.yardZones.find(z => z.zoneCode === arrivalForm.zoneCode)
  return zone?.maxBay || 10
})
const arrivalMaxRow = computed(() => {
  const zone = yardStore.yardZones.find(z => z.zoneCode === arrivalForm.zoneCode)
  return zone?.maxRow || 5
})
const arrivalMaxTier = computed(() => {
  const zone = yardStore.yardZones.find(z => z.zoneCode === arrivalForm.zoneCode)
  return zone?.maxTier || 4
})

const allPlans = computed(() => yardStore.yardPlans)

const filteredPlans = computed(() => {
  let plans = [...allPlans.value]
  
  if (filterType.value) {
    plans = plans.filter(p => p.planType === filterType.value)
  }
  if (filterStatus.value) {
    plans = plans.filter(p => p.status === filterStatus.value)
  }
  if (filterDate.value) {
    const targetDate = dayjs(filterDate.value)
    plans = plans.filter(p => {
      const planDate = p.eta || p.etd
      if (!planDate) return false
      return dayjs(planDate).isSame(targetDate, 'day') || 
             dayjs(planDate).isSame(targetDate.subtract(1, 'day'), 'day') ||
             dayjs(planDate).isSame(targetDate.add(1, 'day'), 'day')
    })
  }
  
  return plans
})

const filteredImportPlans = computed(() => filteredPlans.value.filter(p => p.planType === 'import'))
const filteredExportPlans = computed(() => filteredPlans.value.filter(p => p.planType === 'export'))

function onTabChange() {
}

function getStatusName(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    approved: '已审批',
    in_progress: '进行中',
    completed: '已完成'
  }
  return map[status] || status
}

function viewPlan(plan: YardPlan) {
  selectedPlan.value = plan
  showDetailDialog.value = true
}

function editPlan(plan: YardPlan) {
  ElMessage.info('编辑计划功能')
}

function approvePlan(plan: YardPlan) {
  ElMessageBox.confirm('确认审批该计划？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = yardStore.yardPlans.findIndex(p => p.id === plan.id)
    if (idx !== -1) {
      yardStore.yardPlans[idx].status = 'approved'
      yardStore.yardPlans[idx].updatedAt = dayjs().format('YYYY-MM-DD HH:mm')
    }
    ElMessage.success('计划已审批')
  }).catch(() => {})
}

function startPlan(plan: YardPlan) {
  ElMessageBox.confirm('确认开始执行该计划？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = yardStore.yardPlans.findIndex(p => p.id === plan.id)
    if (idx !== -1) {
      yardStore.yardPlans[idx].status = 'in_progress'
      yardStore.yardPlans[idx].updatedAt = dayjs().format('YYYY-MM-DD HH:mm')
    }
    ElMessage.success('计划开始执行')
  }).catch(() => {})
}

function savePlan() {
  if (!planForm.vesselName || !planForm.voyageNo) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const newPlan: YardPlan = {
    id: Math.random().toString(36).substring(2, 15),
    planNo: `${planForm.planType === 'import' ? 'IP' : 'EP'}-${dayjs().format('YYYYMMDD')}-${(yardStore.yardPlans.length + 1).toString().padStart(3, '0')}`,
    planType: planForm.planType as 'import' | 'export',
    vesselName: planForm.vesselName,
    voyageNo: planForm.voyageNo,
    eta: planForm.eta || undefined,
    etd: planForm.etd || undefined,
    containerCount: planForm.containerCount,
    containers: [],
    status: 'draft',
    createdBy: '当前用户',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm')
  }
  
  yardStore.yardPlans.unshift(newPlan)
  ElMessage.success('计划创建成功')
  showCreateDialog.value = false
  
  planForm.vesselName = ''
  planForm.voyageNo = ''
  planForm.eta = ''
  planForm.etd = ''
  planForm.containerCount = 1
  planForm.remarks = ''
}

function handleSearch() {
  ElMessage.success(`查询完成，共找到 ${filteredPlans.value.length} 条记录`)
}

function handleReset() {
  filterType.value = ''
  filterStatus.value = ''
  filterDate.value = ''
  ElMessage.info('已重置筛选条件')
}

function onArrivalZoneChange() {
  if (arrivalForm.bay > arrivalMaxBay.value) arrivalForm.bay = arrivalMaxBay.value
  if (arrivalForm.row > arrivalMaxRow.value) arrivalForm.row = arrivalMaxRow.value
  if (arrivalForm.tier > arrivalMaxTier.value) arrivalForm.tier = arrivalMaxTier.value
  checkSlotOccupied()
}

function checkSlotOccupied() {
  const occupied = yardStore.isSlotOccupied(arrivalForm.zoneCode, arrivalForm.bay, arrivalForm.row, arrivalForm.tier)
  if (occupied) {
    slotOccupiedWarning.value = `该箱位 (${arrivalForm.zoneCode}${arrivalForm.bay}${arrivalForm.row}${arrivalForm.tier}) 已被占用，请选择其他位置`
  } else {
    slotOccupiedWarning.value = ''
  }
}

function confirmArrival() {
  if (!arrivalForm.containerNo.trim()) {
    ElMessage.warning('请输入箱号')
    return
  }
  
  const location = `${arrivalForm.zoneCode}${arrivalForm.bay}${arrivalForm.row}${arrivalForm.tier}`
  
  if (yardStore.isSlotOccupied(arrivalForm.zoneCode, arrivalForm.bay, arrivalForm.row, arrivalForm.tier)) {
    ElMessage.error(`箱位 ${location} 已被占用，请选择其他位置`)
    return
  }
  
  let container = yardStore.findContainerByNo(arrivalForm.containerNo.trim(), true)
  
  if (!container) {
    const arrivalResult = yardStore.recordContainerArrival({
      containerNo: arrivalForm.containerNo.trim(),
      size: arrivalForm.size as any,
      vesselName: arrivalForm.vesselName,
      blNo: arrivalForm.blNo
    })
    if (!arrivalResult.success || !arrivalResult.container) {
      ElMessage.error(arrivalResult.message)
      return
    }
    container = arrivalResult.container
  } else if (container.status === 'out') {
    const reArrivalResult = yardStore.recordContainerArrival({
      containerNo: arrivalForm.containerNo.trim(),
      size: arrivalForm.size as any,
      vesselName: arrivalForm.vesselName,
      blNo: arrivalForm.blNo
    })
    if (!reArrivalResult.success || !reArrivalResult.container) {
      ElMessage.error(reArrivalResult.message)
      return
    }
    container = reArrivalResult.container
  }
  
  const assignResult = yardStore.assignSlot(
    container.containerNo,
    location,
    arrivalForm.zoneCode,
    arrivalForm.bay,
    arrivalForm.row,
    arrivalForm.tier
  )
  
  if (!assignResult.success) {
    ElMessage.error(assignResult.message)
    return
  }
  
  yardStore.createArrivalRecord({
    containerNo: container.containerNo,
    size: container.size,
    vesselName: arrivalForm.vesselName || container.vesselName || '',
    blNo: arrivalForm.blNo || container.blNo,
    location,
    operator: '当前用户',
    remarks: arrivalForm.remarks
  })
  
  ElMessage.success(`到场登记成功，箱位已分配: ${location}`)
  showArrivalDialog.value = false
  slotOccupiedWarning.value = ''
  
  arrivalForm.containerNo = ''
  arrivalForm.size = '20GP'
  arrivalForm.vesselName = ''
  arrivalForm.blNo = ''
  arrivalForm.zoneCode = 'A'
  arrivalForm.bay = 1
  arrivalForm.row = 1
  arrivalForm.tier = 1
  arrivalForm.remarks = ''
}

function loadContainerInfo() {
  if (!departureForm.containerNo.trim()) {
    departureContainer.value = null
    return
  }
  if (yardStore.isContainerDeparted(departureForm.containerNo.trim())) {
    ElMessage.warning('该箱号已离场，无需重复登记')
    departureContainer.value = null
    return
  }
  departureContainer.value = yardStore.findContainerByNo(departureForm.containerNo.trim()) || null
  if (departureContainer.value) {
    departureForm.vesselName = departureContainer.value.vesselName || ''
  }
}

function confirmDeparture() {
  if (!departureContainer.value) {
    ElMessage.warning('请输入有效的箱号')
    return
  }
  
  if (yardStore.isContainerDeparted(departureContainer.value.containerNo)) {
    ElMessage.warning('该箱号已离场，无需重复登记')
    return
  }
  
  const oldLocation = departureContainer.value.location
  const depResult = yardStore.recordContainerDeparture(departureContainer.value.containerNo)
  
  if (!depResult.success) {
    ElMessage.error(depResult.message)
    return
  }
  
  yardStore.createDepartureRecord({
    containerNo: departureContainer.value.containerNo,
    size: departureContainer.value.size,
    vesselName: departureForm.vesselName || departureContainer.value.vesselName || '',
    blNo: departureForm.blNo || departureContainer.value.blNo,
    fromLocation: oldLocation,
    operator: '当前用户',
    remarks: departureForm.remarks
  })
  
  ElMessage.success('离场登记成功，箱位已释放')
  showDepartureDialog.value = false
  
  departureForm.containerNo = ''
  departureForm.vesselName = ''
  departureForm.blNo = ''
  departureForm.remarks = ''
  departureContainer.value = null
}

function handlePrint() {
  window.print()
}

function printPlan() {
  window.print()
}

function applyDepartureFilter() {
  departureFilterApplied.containerNo = departureFilter.containerNo
  departureFilterApplied.departureTimeRange = [...departureFilter.departureTimeRange]
  departureFilterApplied.vesselName = departureFilter.vesselName
  departureFilterApplied.operator = departureFilter.operator
  ElMessage.success(`筛选完成，共找到 ${filteredDepartureRecords.value.length} 条记录`)
}

function resetDepartureFilter() {
  departureFilter.containerNo = ''
  departureFilter.departureTimeRange = []
  departureFilter.vesselName = ''
  departureFilter.operator = ''
  departureFilterApplied.containerNo = ''
  departureFilterApplied.departureTimeRange = []
  departureFilterApplied.vesselName = ''
  departureFilterApplied.operator = ''
  ElMessage.info('已重置筛选条件')
}

function viewDepartureDetail(row: DepartureRecord) {
  selectedDepartureRecord.value = row
  showDepartureDetailDialog.value = true
}

function getEventTypeName(type: string): string {
  const map: Record<string, string> = {
    arrival: '到场登记',
    assign_slot: '分配箱位',
    adjust_priority: '调整优先级',
    create_task: '创建作业任务',
    complete_task: '完成作业任务',
    departure: '离场登记',
    re_arrival: '重新到场'
  }
  return map[type] || type
}

function validateBatchContainers() {
  if (!batchDepartureInput.value.trim()) {
    ElMessage.warning('请输入箱号')
    return
  }
  
  validating.value = true
  batchValidationResult.value = null
  batchDepartureResult.value = null
  
  setTimeout(() => {
    const input = batchDepartureInput.value
    const containerNos = input
      .split(/[\n,，]/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    const details: { containerNo: string; status: 'available' | 'departed' | 'not_found'; message: string }[] = []
    const available: string[] = []
    const unavailable: string[] = []
    
    containerNos.forEach(no => {
      if (yardStore.isContainerDeparted(no)) {
        details.push({ containerNo: no, status: 'departed', message: '该箱号已离场' })
        unavailable.push(no)
      } else {
        const container = yardStore.findContainerByNo(no)
        if (container) {
          details.push({ containerNo: no, status: 'available', message: `可离场，当前位置：${container.location}` })
          available.push(no)
        } else {
          details.push({ containerNo: no, status: 'not_found', message: '箱号不存在' })
          unavailable.push(no)
        }
      }
    })
    
    batchValidationResult.value = { details, available, unavailable }
    validating.value = false
  }, 300)
}

function confirmBatchDeparture() {
  if (!batchValidationResult.value || batchValidationResult.value.available.length === 0) {
    ElMessage.warning('没有可离场的箱号')
    return
  }
  
  ElMessageBox.confirm(
    `确认对 ${batchValidationResult.value.available.length} 个在场箱执行离场操作？`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    departing.value = true
    
    setTimeout(() => {
      const result = yardStore.batchDeparture(batchValidationResult.value!.available)
      batchDepartureResult.value = result
      departing.value = false
      
      if (result.failed.length === 0) {
        ElMessage.success(`成功登记 ${result.success.length} 个箱号离场`)
      } else {
        ElMessage.warning(`成功 ${result.success.length} 个，失败 ${result.failed.length} 个`)
      }
    }, 500)
  }).catch(() => {})
}

function closeBatchDepartureDialog() {
  showBatchDepartureDialog.value = false
  batchDepartureInput.value = ''
  batchValidationResult.value = null
  batchDepartureResult.value = null
}
</script>

<style scoped>
.departure-filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.lifecycle-timeline {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
}

.lifecycle-timeline h4 {
  margin: 0 0 8px 0;
  color: #409eff;
}

.lifecycle-timeline p {
  margin: 4px 0;
  color: #666;
  font-size: 13px;
}
</style>
