<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">异常处理</h2>
      <div class="header-actions no-print">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          <span>上报异常</span>
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          <span>打印</span>
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff1f0; color: #cf1322;">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-value" style="color: #cf1322;">{{ yardStore.criticalExceptions }}</div>
          <div class="stat-label">严重异常</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-value" style="color: #fa8c16;">{{ highCount }}</div>
          <div class="stat-label">高优先级</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-value" style="color: #1890ff;">{{ yardStore.openExceptions }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-value" style="color: #52c41a;">{{ resolvedCount }}</div>
          <div class="stat-label">已解决</div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar no-print" style="margin-top: 16px;">
      <el-select v-model="filterType" placeholder="异常类型" clearable style="width: 160px;">
        <el-option label="破损箱" value="damaged" />
        <el-option label="超期堆存" value="overdue" />
        <el-option label="温度异常" value="temperature_abnormal" />
        <el-option label="位置错误" value="location_error" />
        <el-option label="危险品泄漏" value="hazardous_leak" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select v-model="filterSeverity" placeholder="严重程度" clearable style="width: 140px;">
        <el-option label="严重" value="critical" />
        <el-option label="高" value="high" />
        <el-option label="中等" value="medium" />
        <el-option label="低" value="low" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="处理状态" clearable style="width: 140px;">
        <el-option label="待处理" value="open" />
        <el-option label="处理中" value="in_progress" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索箱号/异常编号" clearable style="width: 220px;">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-card class="card-shadow">
      <el-table :data="filteredExceptions" border stripe>
        <el-table-column prop="exceptionNo" label="异常编号" width="160" fixed="left" />
        <el-table-column prop="exceptionType" label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getExceptionTypeName(row.exceptionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100" align="center">
          <template #default="{ row }">
            <span :class="['tag-status', row.severity]">{{ getSeverityName(row.severity) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="containerNo" label="箱号" width="140" />
        <el-table-column prop="location" label="位置" width="120" align="center" />
        <el-table-column prop="description" label="异常描述" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <span :class="['tag-status', row.status]">{{ getStatusName(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reportedBy" label="上报人" width="100" />
        <el-table-column prop="reportedAt" label="上报时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right" class="no-print">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewException(row)">详情</el-button>
            <el-button v-if="row.status === 'open'" type="success" link size="small" @click="startHandle(row)">开始处理</el-button>
            <el-button v-if="row.status === 'in_progress'" type="warning" link size="small" @click="resolveException(row)">标记解决</el-button>
            <el-button type="danger" link size="small" @click="closeException(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow" title="异常类型分布">
          <div ref="typeChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" title="处理时效统计">
          <div ref="timelineChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreateDialog" title="上报异常" width="600px" class="no-print">
      <el-form :model="exceptionForm" label-width="100px">
        <el-form-item label="异常类型">
          <el-select v-model="exceptionForm.exceptionType" style="width: 100%;">
            <el-option label="破损箱" value="damaged" />
            <el-option label="超期堆存" value="overdue" />
            <el-option label="温度异常" value="temperature_abnormal" />
            <el-option label="位置错误" value="location_error" />
            <el-option label="危险品泄漏" value="hazardous_leak" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-radio-group v-model="exceptionForm.severity">
            <el-radio value="low">低</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="high">高</el-radio>
            <el-radio value="critical">严重</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="箱号">
          <el-input v-model="exceptionForm.containerNo" placeholder="请输入箱号" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="exceptionForm.location" placeholder="请输入位置" />
        </el-form-item>
        <el-form-item label="异常描述">
          <el-input v-model="exceptionForm.description" type="textarea" :rows="4" placeholder="请详细描述异常情况" />
        </el-form-item>
        <el-form-item label="上传照片">
          <el-upload action="#" list-type="picture-card" :auto-upload="false" :limit="3">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitException">提交上报</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="异常详情" width="650px">
      <el-descriptions v-if="selectedException" :column="2" border size="small">
        <el-descriptions-item label="异常编号">{{ selectedException.exceptionNo }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">{{ getExceptionTypeName(selectedException.exceptionType) }}</el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <span :class="['tag-status', selectedException.severity]">{{ getSeverityName(selectedException.severity) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="['tag-status', selectedException.status]">{{ getStatusName(selectedException.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="箱号">{{ selectedException.containerNo || '无' }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ selectedException.location || '无' }}</el-descriptions-item>
        <el-descriptions-item label="上报人">{{ selectedException.reportedBy }}</el-descriptions-item>
        <el-descriptions-item label="上报时间">{{ selectedException.reportedAt }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedException.handledBy" label="处理人">{{ selectedException.handledBy }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedException.handledAt" label="处理时间">{{ selectedException.handledAt }}</el-descriptions-item>
        <el-descriptions-item label="异常描述" :span="2">{{ selectedException.description }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedException.resolution" label="处理方案" :span="2">{{ selectedException.resolution }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="selectedException && selectedException.status !== 'closed'" class="no-print" style="margin-top: 20px;">
        <el-divider content-position="left">处理记录</el-divider>
        <el-input
          v-model="handleRemark"
          type="textarea"
          :rows="3"
          placeholder="请输入处理备注..."
        />
        <div style="margin-top: 12px; text-align: right;">
          <el-button type="primary" @click="submitHandle">提交处理</el-button>
        </div>
      </div>
      <template #footer class="no-print">
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="printException">打印异常单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResolveDialog" title="标记解决" width="450px" class="no-print">
      <el-form label-width="100px">
        <el-form-item label="处理方案">
          <el-input v-model="resolveRemark" type="textarea" :rows="4" placeholder="请输入处理方案和结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmResolve">确认解决</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { Exception } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const yardStore = useYardStore()
const filterType = ref('')
const filterSeverity = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showResolveDialog = ref(false)
const selectedException = ref<Exception | null>(null)
const handleRemark = ref('')
const resolveRemark = ref('')
const typeChart = ref<HTMLElement>()
const timelineChart = ref<HTMLElement>()

const exceptionForm = reactive({
  exceptionType: 'damaged',
  severity: 'medium',
  containerNo: '',
  location: '',
  description: ''
})

const highCount = computed(() => yardStore.exceptions.filter(e => e.severity === 'high' && e.status !== 'closed').length)
const resolvedCount = computed(() => yardStore.exceptions.filter(e => e.status === 'resolved' || e.status === 'closed').length)

const filteredExceptions = computed(() => {
  let exceptions = [...yardStore.exceptions]
  
  if (filterType.value) {
    exceptions = exceptions.filter(e => e.exceptionType === filterType.value)
  }
  if (filterSeverity.value) {
    exceptions = exceptions.filter(e => e.severity === filterSeverity.value)
  }
  if (filterStatus.value) {
    exceptions = exceptions.filter(e => e.status === filterStatus.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    exceptions = exceptions.filter(e => 
      e.exceptionNo.toLowerCase().includes(kw) ||
      (e.containerNo && e.containerNo.toLowerCase().includes(kw))
    )
  }
  
  return exceptions
})

function getExceptionTypeName(type: string) {
  const map: Record<string, string> = {
    damaged: '破损箱',
    overdue: '超期堆存',
    temperature_abnormal: '温度异常',
    location_error: '位置错误',
    hazardous_leak: '危险品泄漏',
    other: '其他'
  }
  return map[type] || type
}

function getSeverityName(severity: string) {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  }
  return map[severity] || severity
}

function getStatusName(status: string) {
  const map: Record<string, string> = {
    open: '待处理',
    in_progress: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

function viewException(exc: Exception) {
  selectedException.value = exc
  handleRemark.value = ''
  showDetailDialog.value = true
}

function startHandle(exc: Exception) {
  yardStore.updateException(exc.exceptionNo, {
    status: 'in_progress',
    handledBy: '当前用户',
    handledAt: dayjs().format('YYYY-MM-DD HH:mm')
  })
  ElMessage.success('已开始处理')
}

function resolveException(exc: Exception) {
  selectedException.value = exc
  resolveRemark.value = ''
  showResolveDialog.value = true
}

function confirmResolve() {
  if (selectedException.value) {
    yardStore.updateException(selectedException.value.exceptionNo, {
      status: 'resolved',
      resolution: resolveRemark.value
    })
    ElMessage.success('已标记为解决')
    showResolveDialog.value = false
  }
}

function closeException(exc: Exception) {
  ElMessageBox.confirm('确认关闭该异常？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    yardStore.updateException(exc.exceptionNo, { status: 'closed' })
    ElMessage.success('异常已关闭')
  }).catch(() => {})
}

function submitHandle() {
  if (selectedException.value && handleRemark.value.trim()) {
    ElMessage.success('处理记录已提交')
    handleRemark.value = ''
  } else {
    ElMessage.warning('请输入处理备注')
  }
}

function submitException() {
  if (!exceptionForm.description.trim()) {
    ElMessage.warning('请填写异常描述')
    return
  }
  
  yardStore.createException({
    exceptionType: exceptionForm.exceptionType as Exception['exceptionType'],
    severity: exceptionForm.severity as Exception['severity'],
    containerNo: exceptionForm.containerNo,
    location: exceptionForm.location,
    description: exceptionForm.description
  })
  
  ElMessage.success('异常已上报')
  showCreateDialog.value = false
  
  exceptionForm.containerNo = ''
  exceptionForm.location = ''
  exceptionForm.description = ''
  exceptionForm.severity = 'medium'
}

function handlePrint() {
  window.print()
}

function printException() {
  window.print()
}

function initCharts() {
  nextTick(() => {
    if (typeChart.value) {
      const chart = echarts.init(typeChart.value)
      const typeData = [
        { value: yardStore.exceptions.filter(e => e.exceptionType === 'damaged').length, name: '破损箱', itemStyle: { color: '#f5222d' } },
        { value: yardStore.exceptions.filter(e => e.exceptionType === 'overdue').length, name: '超期堆存', itemStyle: { color: '#fa8c16' } },
        { value: yardStore.exceptions.filter(e => e.exceptionType === 'temperature_abnormal').length, name: '温度异常', itemStyle: { color: '#1890ff' } },
        { value: yardStore.exceptions.filter(e => e.exceptionType === 'location_error').length, name: '位置错误', itemStyle: { color: '#722ed1' } },
        { value: yardStore.exceptions.filter(e => e.exceptionType === 'other').length, name: '其他', itemStyle: { color: '#8c8c8c' } }
      ]
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
          name: '异常类型',
          type: 'pie',
          radius: ['40%', '70%'],
          data: typeData,
          label: { formatter: '{b}: {c}' }
        }]
      })
    }

    if (timelineChart.value) {
      const chart = echarts.init(timelineChart.value)
      const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['新增异常', '处理完成'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: days },
        yAxis: { type: 'value' },
        series: [
          {
            name: '新增异常', type: 'bar',
            data: [3, 5, 2, 8, 4, 6, 3],
            itemStyle: { color: '#faad14' }
          },
          {
            name: '处理完成', type: 'bar',
            data: [2, 4, 3, 6, 5, 4, 2],
            itemStyle: { color: '#52c41a' }
          }
        ]
      })
    }
  })
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', () => {
    if (typeChart.value) echarts.getInstanceByDom(typeChart.value)?.resize()
    if (timelineChart.value) echarts.getInstanceByDom(timelineChart.value)?.resize()
  })
})
</script>
