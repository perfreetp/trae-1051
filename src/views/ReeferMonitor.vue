<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">冷藏箱监控</h2>
      <div class="header-actions no-print">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          <span>刷新数据</span>
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          <span>导出报表</span>
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6f7ff; color: #13c2c2;">
            <el-icon><Snowflake /></el-icon>
          </div>
          <div class="stat-value" style="color: #13c2c2;">{{ yardStore.reeferCount }}</div>
          <div class="stat-label">冷藏箱总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-value" style="color: #52c41a;">{{ normalCount }}</div>
          <div class="stat-label">温度正常</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff7e6; color: #faad14;">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-value" style="color: #faad14;">{{ warningCount }}</div>
          <div class="stat-label">温度预警</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff1f0; color: #f5222d;">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-value" style="color: #f5222d;">{{ criticalCount }}</div>
          <div class="stat-label">严重报警</div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar no-print" style="margin-top: 16px;">
      <el-select v-model="filterAlarm" placeholder="报警状态" clearable style="width: 140px;">
        <el-option label="全部" value="" />
        <el-option label="正常" value="normal" />
        <el-option label="预警" value="warning" />
        <el-option label="严重" value="critical" />
      </el-select>
      <el-select v-model="filterPower" placeholder="供电状态" clearable style="width: 140px;">
        <el-option label="供电中" value="on" />
        <el-option label="断电" value="off" />
        <el-option label="故障" value="error" />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索箱号/位置" clearable style="width: 200px;">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-row :gutter="16">
      <el-col :span="24">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>冷藏箱实时监控</span>
              <div class="no-print">
                <el-switch v-model="autoRefresh" active-text="自动刷新" />
              </div>
            </div>
          </template>
          
          <el-table :data="filteredMonitors" border stripe>
            <el-table-column prop="containerNo" label="箱号" width="140" fixed="left" />
            <el-table-column prop="location" label="位置" width="120" align="center" />
            <el-table-column label="供电状态" width="120" align="center">
              <template #default="{ row }">
                <span :class="['power-indicator', `power-${row.powerStatus}`]"></span>
                {{ getPowerStatusName(row.powerStatus) }}
              </template>
            </el-table-column>
            <el-table-column label="设定温度" width="120" align="center">
              <template #default="{ row }">
                <span style="font-family: monospace;">{{ row.setTemp }}°C</span>
              </template>
            </el-table-column>
            <el-table-column label="当前温度" width="160" align="center">
              <template #default="{ row }">
                <span 
                  class="temp-display"
                  :class="getTempClass(row.alarmStatus)"
                >
                  {{ row.currentTemp }}°C
                </span>
              </template>
            </el-table-column>
            <el-table-column label="湿度" width="100" align="center">
              <template #default="{ row }">
                {{ row.humidity }}%
              </template>
            </el-table-column>
            <el-table-column label="报警状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getAlarmTagType(row.alarmStatus)" size="small">
                  {{ getAlarmStatusName(row.alarmStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastChecked" label="最近检查" width="160" />
            <el-table-column prop="nextCheck" label="下次检查" width="160" />
            <el-table-column label="操作" width="150" fixed="right" class="no-print">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewMonitor(row)">详情</el-button>
                <el-button type="warning" link size="small" @click="adjustTemp(row)">调温</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow" title="温度趋势">
          <div ref="tempChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" title="报警统计">
          <div ref="alarmChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-shadow" title="告警列表（按严重程度排序）">
          <el-table :data="alarmMonitors" border stripe size="small">
            <el-table-column label="严重程度" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.alarmStatus === 'critical' ? 'danger' : 'warning'" size="small">
                  {{ row.alarmStatus === 'critical' ? '严重' : '预警' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="containerNo" label="箱号" width="140" />
            <el-table-column prop="location" label="位置" width="120" align="center" />
            <el-table-column label="温度偏差" width="120" align="center">
              <template #default="{ row }">
                <span :class="row.alarmStatus === 'critical' ? 'temp-critical' : 'temp-warning'">
                  {{ (row.currentTemp - row.targetTemp) > 0 ? '+' : '' }}{{ (row.currentTemp - row.targetTemp).toFixed(1) }}°C
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="lastChecked" label="发生时间" width="160" />
            <el-table-column label="操作" width="150" class="no-print">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleAlarm(row)">处理</el-button>
                <el-button type="success" link size="small" @click="ignoreAlarm(row)">忽略</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showDetailDialog" title="冷藏箱详情" width="600px">
      <el-descriptions v-if="selectedMonitor" :column="2" border>
        <el-descriptions-item label="箱号">{{ selectedMonitor.containerNo }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ selectedMonitor.location }}</el-descriptions-item>
        <el-descriptions-item label="目标温度">{{ selectedMonitor.targetTemp }}°C</el-descriptions-item>
        <el-descriptions-item label="设定温度">{{ selectedMonitor.setTemp }}°C</el-descriptions-item>
        <el-descriptions-item label="当前温度">
          <span class="temp-display" :class="getTempClass(selectedMonitor.alarmStatus)">
            {{ selectedMonitor.currentTemp }}°C
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="湿度">{{ selectedMonitor.humidity }}%</el-descriptions-item>
        <el-descriptions-item label="供电状态">
          <span :class="['power-indicator', `power-${selectedMonitor.powerStatus}`]"></span>
          {{ getPowerStatusName(selectedMonitor.powerStatus) }}
        </el-descriptions-item>
        <el-descriptions-item label="报警状态">
          <el-tag :type="getAlarmTagType(selectedMonitor.alarmStatus)" size="small">
            {{ getAlarmStatusName(selectedMonitor.alarmStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最近检查">{{ selectedMonitor.lastChecked }}</el-descriptions-item>
        <el-descriptions-item label="下次检查">{{ selectedMonitor.nextCheck }}</el-descriptions-item>
      </el-descriptions>
      <template #footer class="no-print">
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="printMonitor">打印监控单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTempDialog" title="调整温度设定" width="400px" class="no-print">
      <el-form label-width="100px">
        <el-form-item label="箱号">
          <el-input v-if="selectedMonitor" :value="selectedMonitor.containerNo" disabled />
        </el-form-item>
        <el-form-item label="当前设定">
          <el-input v-if="selectedMonitor" :value="selectedMonitor.setTemp + '°C'" disabled />
        </el-form-item>
        <el-form-item label="新设定温度">
          <el-input-number v-model="newTemp" :min="-30" :max="30" :step="0.5" />
          <span style="margin-left: 8px;">°C</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTempDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmTempAdjust">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { ReeferMonitor } from '@/types'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const yardStore = useYardStore()
const filterAlarm = ref('')
const filterPower = ref('')
const searchKeyword = ref('')
const autoRefresh = ref(true)
const showDetailDialog = ref(false)
const showTempDialog = ref(false)
const selectedMonitor = ref<ReeferMonitor | null>(null)
const newTemp = ref(0)
const tempChart = ref<HTMLElement>()
const alarmChart = ref<HTMLElement>()

const normalCount = computed(() => yardStore.reeferMonitors.filter(r => r.alarmStatus === 'normal').length)
const warningCount = computed(() => yardStore.reeferMonitors.filter(r => r.alarmStatus === 'warning').length)
const criticalCount = computed(() => yardStore.reeferMonitors.filter(r => r.alarmStatus === 'critical').length)

const filteredMonitors = computed(() => {
  let monitors = [...yardStore.reeferMonitors]
  if (filterAlarm.value) {
    monitors = monitors.filter(r => r.alarmStatus === filterAlarm.value)
  }
  if (filterPower.value) {
    monitors = monitors.filter(r => r.powerStatus === filterPower.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    monitors = monitors.filter(r => 
      r.containerNo.toLowerCase().includes(kw) ||
      r.location.toLowerCase().includes(kw)
    )
  }
  return monitors
})

const alarmMonitors = computed(() => {
  return yardStore.reeferMonitors
    .filter(r => r.alarmStatus !== 'normal')
    .sort((a, b) => {
      const priority: Record<string, number> = { critical: 0, warning: 1 }
      return (priority[a.alarmStatus] || 0) - (priority[b.alarmStatus] || 0)
    })
})

function getPowerStatusName(status: string) {
  const map: Record<string, string> = { on: '供电中', off: '断电', error: '故障' }
  return map[status] || status
}

function getAlarmStatusName(status: string) {
  const map: Record<string, string> = { normal: '正常', warning: '预警', critical: '严重' }
  return map[status] || status
}

function getAlarmTagType(status: string) {
  const map: Record<string, string> = { normal: 'success', warning: 'warning', critical: 'danger' }
  return map[status] || ''
}

function getTempClass(status: string) {
  const map: Record<string, string> = { normal: 'temp-normal', warning: 'temp-warning', critical: 'temp-critical' }
  return map[status] || ''
}

function viewMonitor(monitor: ReeferMonitor) {
  selectedMonitor.value = monitor
  showDetailDialog.value = true
}

function adjustTemp(monitor: ReeferMonitor) {
  selectedMonitor.value = monitor
  newTemp.value = monitor.setTemp
  showTempDialog.value = true
}

function confirmTempAdjust() {
  if (selectedMonitor.value) {
    yardStore.updateReeferMonitor(selectedMonitor.value.containerId, { setTemp: newTemp.value })
    ElMessage.success('温度设定已调整')
    showTempDialog.value = false
  }
}

function handleAlarm(monitor: ReeferMonitor) {
  ElMessage.info(`正在处理告警: ${monitor.containerNo}`)
}

function ignoreAlarm(monitor: ReeferMonitor) {
  ElMessage.info(`已忽略告警: ${monitor.containerNo}`)
}

function handleRefresh() {
  ElMessage.success('数据已刷新')
}

function handleExport() {
  ElMessage.success('报表导出中...')
}

function printMonitor() {
  window.print()
}

function initCharts() {
  nextTick(() => {
    if (tempChart.value) {
      const chart = echarts.init(tempChart.value)
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['平均温度', '最高温度', '最低温度'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: hours },
        yAxis: { type: 'value', name: '温度(°C)' },
        series: [
          {
            name: '平均温度', type: 'line', smooth: true,
            data: hours.map(() => (-5 + Math.random() * 10).toFixed(1)),
            itemStyle: { color: '#1890ff' }
          },
          {
            name: '最高温度', type: 'line', smooth: true,
            data: hours.map(() => (0 + Math.random() * 8).toFixed(1)),
            itemStyle: { color: '#faad14' }
          },
          {
            name: '最低温度', type: 'line', smooth: true,
            data: hours.map(() => (-12 + Math.random() * 6).toFixed(1)),
            itemStyle: { color: '#13c2c2' }
          }
        ]
      })
    }

    if (alarmChart.value) {
      const chart = echarts.init(alarmChart.value)
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
          name: '报警类型', type: 'pie', radius: ['40%', '70%'],
          data: [
            { value: normalCount.value, name: '正常', itemStyle: { color: '#52c41a' } },
            { value: warningCount.value, name: '预警', itemStyle: { color: '#faad14' } },
            { value: criticalCount.value, name: '严重', itemStyle: { color: '#f5222d' } }
          ],
          label: { formatter: '{b}: {c} ({d}%)' }
        }]
      })
    }
  })
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', () => {
    if (tempChart.value) echarts.getInstanceByDom(tempChart.value)?.resize()
    if (alarmChart.value) echarts.getInstanceByDom(alarmChart.value)?.resize()
  })
})
</script>
