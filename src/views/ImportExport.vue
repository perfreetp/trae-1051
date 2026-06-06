<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">进出口计划</h2>
      <div class="header-actions no-print">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          <span>新建计划</span>
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
      <el-date-picker v-model="filterDate" type="date" placeholder="选择日期" style="width: 180px;" />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>
        查询
      </el-button>
      <el-button @click="handleReset">
        <el-icon><RefreshRight /></el-icon>
        重置
      </el-button>
    </div>

    <el-card class="card-shadow">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="进口计划" name="import">
          <el-table :data="importPlans" border stripe>
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
            <el-table-column label="操作" width="200" fixed="right" class="no-print">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewPlan(row)">查看</el-button>
                <el-button type="primary" link size="small" @click="editPlan(row)">编辑</el-button>
                <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="approvePlan(row)">审批</el-button>
                <el-button v-if="row.status === 'approved'" type="warning" link size="small" @click="startPlan(row)">开始执行</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="出口计划" name="export">
          <el-table :data="exportPlans" border stripe>
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
            <el-table-column label="操作" width="200" fixed="right" class="no-print">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewPlan(row)">查看</el-button>
                <el-button type="primary" link size="small" @click="editPlan(row)">编辑</el-button>
                <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="approvePlan(row)">审批</el-button>
                <el-button v-if="row.status === 'approved'" type="warning" link size="small" @click="startPlan(row)">开始执行</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow" title="到港记录">
          <el-table :data="arrivalRecords" border stripe max-height="350">
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
        <el-card class="card-shadow" title="离港记录">
          <el-table :data="departureRecords" border stripe max-height="350">
            <el-table-column prop="containerNo" label="箱号" width="140" />
            <el-table-column prop="size" label="尺寸" width="90" align="center" />
            <el-table-column prop="vesselName" label="船名" width="120" />
            <el-table-column prop="fromLocation" label="原位置" width="110" align="center" />
            <el-table-column prop="departureTime" label="离场时间" width="160" />
            <el-table-column prop="operator" label="操作员" width="100" />
            <el-table-column label="状态" width="90" align="center">
              <template #default>
                <el-tag type="info" size="small">已离场</el-tag>
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
          <el-date-picker v-model="planForm.eta" type="datetime" placeholder="选择时间" style="width: 100%;" />
        </el-form-item>
        <el-form-item v-if="planForm.planType === 'export'" label="预计离港">
          <el-date-picker v-model="planForm.etd" type="datetime" placeholder="选择时间" style="width: 100%;" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { YardPlan } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const yardStore = useYardStore()
const activeTab = ref('import')
const filterType = ref('')
const filterStatus = ref('')
const filterDate = ref('')
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const selectedPlan = ref<YardPlan | null>(null)

const planForm = reactive({
  planType: 'import',
  vesselName: '',
  voyageNo: '',
  eta: '',
  etd: '',
  containerCount: 1,
  remarks: ''
})

const importPlans = computed(() => yardStore.yardPlans.filter(p => p.planType === 'import'))
const exportPlans = computed(() => yardStore.yardPlans.filter(p => p.planType === 'export'))

const arrivalRecords = computed(() => {
  return yardStore.containers.slice(0, 10).map(c => ({
    containerNo: c.containerNo,
    size: c.size,
    vesselName: c.vesselName,
    location: c.location,
    arrivalTime: c.arrivalTime,
    operator: '张三'
  }))
})

const departureRecords = computed(() => {
  return yardStore.containers.slice(10, 20).map(c => ({
    containerNo: c.containerNo,
    size: c.size,
    vesselName: c.vesselName,
    fromLocation: c.location,
    departureTime: c.departureTime || dayjs().format('YYYY-MM-DD HH:mm'),
    operator: '李四'
  }))
})

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
    eta: planForm.eta ? dayjs(planForm.eta).format('YYYY-MM-DD HH:mm') : undefined,
    etd: planForm.etd ? dayjs(planForm.etd).format('YYYY-MM-DD HH:mm') : undefined,
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
  ElMessage.success('查询完成')
}

function handleReset() {
  filterType.value = ''
  filterStatus.value = ''
  filterDate.value = ''
}

function handlePrint() {
  window.print()
}

function printPlan() {
  window.print()
}
</script>
