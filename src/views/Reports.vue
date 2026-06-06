<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">统计报表</h2>
      <div class="header-actions no-print">
        <el-radio-group v-model="reportType" size="default">
          <el-radio-button value="daily">日报表</el-radio-button>
          <el-radio-button value="weekly">周报表</el-radio-button>
          <el-radio-button value="monthly">月报表</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="reportDate"
          type="date"
          placeholder="选择日期"
          style="margin-left: 12px; width: 180px;"
        />
        <el-button type="primary" style="margin-left: 12px;" @click="generateReport">
          <el-icon><DataAnalysis /></el-icon>
          <span>生成报表</span>
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          <span>导出Excel</span>
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          <span>打印</span>
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stat-cards">
      <el-col :span="4">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-value" style="color: #1890ff;">{{ summary.totalIn }}</div>
          <div class="stat-label">进场箱量</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><Promotion /></el-icon>
          </div>
          <div class="stat-value" style="color: #52c41a;">{{ summary.totalOut }}</div>
          <div class="stat-label">出场箱量</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Rank /></el-icon>
          </div>
          <div class="stat-value" style="color: #fa8c16;">{{ summary.totalMoves }}</div>
          <div class="stat-label">移箱作业</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff0f6; color: #eb2f96;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-value" style="color: #eb2f96;">{{ summary.avgStayDays }}</div>
          <div class="stat-label">平均堆存(天)</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f9f0ff; color: #722ed1;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-value" style="color: #722ed1;">{{ summary.utilizationRate }}%</div>
          <div class="stat-label">堆场利用率</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6fffb; color: #13c2c2;">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-value" style="color: #13c2c2;">{{ summary.exceptionCount }}</div>
          <div class="stat-label">异常数量</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="card-shadow" title="箱量趋势">
          <div ref="trendChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-shadow" title="箱型分布">
          <div ref="typeChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow" title="各箱区吞吐量">
          <div ref="zoneChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" title="作业效率分析">
          <div ref="efficiencyChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>班次效率汇总</span>
              <div class="no-print">
                <el-button size="small" @click="printShiftList">
                  <el-icon><Printer /></el-icon>
                  打印班次清单
                </el-button>
              </div>
            </div>
          </template>
          <el-table :data="yardStore.shiftReports" border stripe>
            <el-table-column prop="shiftDate" label="日期" width="120" />
            <el-table-column prop="shiftType" label="班次" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getShiftTagType(row.shiftType)" size="small">
                  {{ getShiftName(row.shiftType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="teamName" label="班组" width="100" />
            <el-table-column prop="containersIn" label="进场箱量" width="100" align="center" />
            <el-table-column prop="containersOut" label="出场箱量" width="100" align="center" />
            <el-table-column prop="movesCompleted" label="移箱作业" width="100" align="center" />
            <el-table-column prop="reeferChecks" label="冷藏巡检" width="100" align="center" />
            <el-table-column prop="exceptions" label="异常处理" width="100" align="center" />
            <el-table-column label="总作业量" width="100" align="center">
              <template #default="{ row }">
                <strong>{{ row.containersIn + row.containersOut + row.movesCompleted }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="班长" width="100" />
            <el-table-column prop="startTime" label="开始时间" width="160" />
            <el-table-column prop="endTime" label="结束时间" width="160" />
            <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow" title="超期堆存箱列表">
          <el-table :data="overdueList" border stripe size="small" max-height="300">
            <el-table-column prop="containerNo" label="箱号" width="140" />
            <el-table-column prop="size" label="尺寸" width="80" align="center" />
            <el-table-column prop="location" label="位置" width="100" align="center" />
            <el-table-column label="优先级" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getPriorityTagType(row.priority)" size="small">P{{ row.priority }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="arrivalTime" label="到场时间" width="160" />
            <el-table-column prop="overdueDays" label="超期天数" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.overdueDays }}天</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="consignee" label="收货人" width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="100" class="no-print">
              <template #default="{ row }">
                <el-button type="warning" link size="small" @click="adjustPriority(row)">优先级</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" title="危险品箱清单">
          <el-table :data="hazardousList" border stripe size="small" max-height="300">
            <el-table-column prop="containerNo" label="箱号" width="140" />
            <el-table-column prop="size" label="尺寸" width="80" align="center" />
            <el-table-column prop="location" label="位置" width="100" align="center" />
            <el-table-column label="优先级" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getPriorityTagType(row.priority)" size="small">P{{ row.priority }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hazardLevel" label="危品等级" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="small">第{{ row.hazardLevel }}类</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="arrivalTime" label="到场时间" width="160" />
            <el-table-column label="操作" width="100" class="no-print">
              <template #default="{ row }">
                <el-button type="warning" link size="small" @click="adjustPriority(row)">优先级</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-shadow" title="作业进度跟踪">
          <el-table :data="progressData" border stripe>
            <el-table-column prop="taskName" label="作业项目" width="200" />
            <el-table-column prop="planCount" label="计划量" width="100" align="center" />
            <el-table-column prop="actualCount" label="已完成" width="100" align="center" />
            <el-table-column label="完成进度" width="300">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.round((row.actualCount / row.planCount) * 100)" 
                  :color="getProgressColor(row.actualCount / row.planCount)"
                  :stroke-width="16"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'primary'" size="small">
                  {{ row.status === 'completed' ? '已完成' : '进行中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="负责人" width="100" />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="priorityDialogVisible" title="调整出箱优先级" width="450px" class="no-print">
      <el-form label-width="100px">
        <el-form-item label="当前箱号">
          <span><strong>{{ priorityContainer?.containerNo }}</strong></span>
        </el-form-item>
        <el-form-item label="当前优先级">
          <el-tag v-if="priorityContainer" :type="getPriorityTagType(priorityContainer.priority)">
            P{{ priorityContainer.priority }}
          </el-tag>
        </el-form-item>
        <el-form-item label="调整为">
          <el-radio-group v-model="newPriority">
            <el-radio :value="1">P1 - 最高优先</el-radio>
            <el-radio :value="2">P2 - 高优先</el-radio>
            <el-radio :value="3">P3 - 正常</el-radio>
            <el-radio :value="4">P4 - 低优先</el-radio>
            <el-radio :value="5">P5 - 最低优先</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="priorityDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdjustPriority">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { Container } from '@/types'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const yardStore = useYardStore()
const reportType = ref('daily')
const reportDate = ref(new Date())
const trendChart = ref<HTMLElement>()
const typeChart = ref<HTMLElement>()
const zoneChart = ref<HTMLElement>()
const efficiencyChart = ref<HTMLElement>()
const priorityDialogVisible = ref(false)
const priorityContainer = ref<Container | null>(null)
const newPriority = ref(3)

const summary = reactive({
  totalIn: 186,
  totalOut: 172,
  totalMoves: 245,
  avgStayDays: 4.2,
  utilizationRate: 76.8,
  exceptionCount: 8
})

const overdueList = computed(() => yardStore.activeContainers.filter(c => c.isOverdue).slice(0, 10))
const hazardousList = computed(() => yardStore.activeContainers.filter(c => c.isHazardous).slice(0, 10))

const progressData = [
  { taskName: '马士基号 V0123E 卸船作业', planCount: 150, actualCount: 142, status: 'in_progress', operator: '甲班', remark: '预计2小时内完成' },
  { taskName: '中远之星 V0456W 装船作业', planCount: 200, actualCount: 156, status: 'in_progress', operator: '乙班', remark: '' },
  { taskName: 'A区翻箱整理', planCount: 80, actualCount: 80, status: 'completed', operator: '丙班', remark: '' },
  { taskName: '冷藏箱温度巡检', planCount: 45, actualCount: 30, status: 'in_progress', operator: '丁班', remark: '' },
  { taskName: '危险品箱安全检查', planCount: 23, actualCount: 23, status: 'completed', operator: '安全部', remark: '全部合格' },
  { taskName: 'B区箱位优化', planCount: 60, actualCount: 25, status: 'in_progress', operator: '甲班', remark: '' }
]

function getShiftName(type: string) {
  const map: Record<string, string> = { morning: '白班', afternoon: '中班', night: '夜班' }
  return map[type] || type
}

function getShiftTagType(type: string) {
  const map: Record<string, string> = { morning: '', afternoon: 'warning', night: 'info' }
  return map[type] || ''
}

function getProgressColor(rate: number) {
  if (rate < 0.5) return '#f5222d'
  if (rate < 0.8) return '#faad14'
  return '#52c41a'
}

function generateReport() {
  ElMessage.success('报表已生成')
}

function handleExport() {
  ElMessage.success('正在导出Excel...')
}

function handlePrint() {
  window.print()
}

function printShiftList() {
  window.print()
}

function getPriorityTagType(priority: number) {
  if (priority <= 1) return 'danger'
  if (priority <= 2) return 'warning'
  if (priority <= 3) return ''
  return 'info'
}

function adjustPriority(container: Container) {
  priorityContainer.value = container
  newPriority.value = container.priority
  priorityDialogVisible.value = true
}

function confirmAdjustPriority() {
  if (priorityContainer.value) {
    yardStore.adjustContainerPriority(priorityContainer.value.containerNo, newPriority.value)
    ElMessage.success(`优先级已调整为 P${newPriority.value}`)
    priorityDialogVisible.value = false
  }
}

function initCharts() {
  nextTick(() => {
    if (trendChart.value) {
      const chart = echarts.init(trendChart.value)
      const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['进场', '出场', '移箱'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: days },
        yAxis: { type: 'value' },
        series: [
          { name: '进场', type: 'line', smooth: true, data: [165, 189, 172, 198, 168, 175, 186], itemStyle: { color: '#1890ff' } },
          { name: '出场', type: 'line', smooth: true, data: [158, 176, 165, 182, 160, 168, 172], itemStyle: { color: '#52c41a' } },
          { name: '移箱', type: 'line', smooth: true, data: [210, 235, 228, 256, 220, 240, 245], itemStyle: { color: '#faad14' } }
        ]
      })
    }

    if (typeChart.value) {
      const chart = echarts.init(typeChart.value)
      chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          name: '箱型分布',
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 85, name: '20GP', itemStyle: { color: '#1890ff' } },
            { value: 62, name: '40GP', itemStyle: { color: '#52c41a' } },
            { value: 35, name: '40HQ', itemStyle: { color: '#faad14' } },
            { value: 18, name: '20RF', itemStyle: { color: '#13c2c2' } },
            { value: 12, name: '40RF', itemStyle: { color: '#722ed1' } }
          ],
          label: { formatter: '{b}: {c}' }
        }]
      })
    }

    if (zoneChart.value) {
      const chart = echarts.init(zoneChart.value)
      const zones = ['A区', 'B区', 'C区', 'D区', 'E区', 'F区']
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['进场', '出场'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: zones },
        yAxis: { type: 'value' },
        series: [
          { name: '进场', type: 'bar', data: [45, 42, 28, 15, 48, 8], itemStyle: { color: '#1890ff' } },
          { name: '出场', type: 'bar', data: [40, 38, 26, 12, 45, 11], itemStyle: { color: '#52c41a' } }
        ]
      })
    }

    if (efficiencyChart.value) {
      const chart = echarts.init(efficiencyChart.value)
      const shifts = ['甲班', '乙班', '丙班', '丁班']
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['作业效率', '平均时效(分钟/箱)'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: shifts },
        yAxis: [
          { type: 'value', name: '箱/小时', position: 'left' },
          { type: 'value', name: '分钟', position: 'right' }
        ],
        series: [
          { name: '作业效率', type: 'bar', data: [28, 25, 30, 26], itemStyle: { color: '#1890ff' }, yAxisIndex: 0 },
          { name: '平均时效(分钟/箱)', type: 'line', data: [2.2, 2.5, 2.0, 2.4], itemStyle: { color: '#fa8c16' }, yAxisIndex: 1 }
        ]
      })
    }
  })
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', () => {
    if (trendChart.value) echarts.getInstanceByDom(trendChart.value)?.resize()
    if (typeChart.value) echarts.getInstanceByDom(typeChart.value)?.resize()
    if (zoneChart.value) echarts.getInstanceByDom(zoneChart.value)?.resize()
    if (efficiencyChart.value) echarts.getInstanceByDom(efficiencyChart.value)?.resize()
  })
})
</script>
