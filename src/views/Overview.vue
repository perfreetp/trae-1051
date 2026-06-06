<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">堆场总览</h2>
      <div class="header-actions no-print">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          <span>刷新数据</span>
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
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-value" style="color: #1890ff;">{{ yardStore.totalContainers }}</div>
          <div class="stat-label">在堆集装箱</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="stat-value" style="color: #52c41a;">{{ yardStore.occupiedSlots }} / {{ yardStore.totalSlots }}</div>
          <div class="stat-label">已用/总箱位</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-value" style="color: #fa8c16;">{{ yardStore.utilizationRate }}%</div>
          <div class="stat-label">堆场利用率</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff1f0; color: #f5222d;">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-value" style="color: #f5222d;">{{ yardStore.openExceptions }}</div>
          <div class="stat-label">待处理异常</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="8">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6f7ff; color: #13c2c2;">
            <el-icon><Snowflake /></el-icon>
          </div>
          <div class="stat-value" style="color: #13c2c2;">{{ yardStore.reeferCount }}</div>
          <div class="stat-label">冷藏箱</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff7e6; color: #fa541c;">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-value" style="color: #fa541c;">{{ yardStore.hazardousCount }}</div>
          <div class="stat-label">危险品箱</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff0f6; color: #eb2f96;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-value" style="color: #eb2f96;">{{ yardStore.overdueCount }}</div>
          <div class="stat-label">超期堆存</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow" header="箱区容量分布">
          <div ref="utilizationChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" header="作业任务统计">
          <div ref="taskChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-shadow" header="各箱区详情">
          <el-table :data="yardStore.yardZones" border stripe>
            <el-table-column prop="zoneCode" label="箱区" width="80" align="center" />
            <el-table-column prop="zoneName" label="箱区名称" width="160" />
            <el-table-column prop="zoneType" label="类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getZoneTypeTag(row.zoneType)">{{ getZoneTypeName(row.zoneType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalSlots" label="总箱位" width="100" align="center" />
            <el-table-column prop="occupiedSlots" label="已占用" width="100" align="center" />
            <el-table-column label="利用率" width="140" align="center">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.round((row.occupiedSlots / row.totalSlots) * 100)" 
                  :color="getProgressColor(row.occupiedSlots / row.totalSlots)"
                  :stroke-width="12"
                />
              </template>
            </el-table-column>
            <el-table-column prop="maxTier" label="最大层" width="100" align="center" />
            <el-table-column prop="description" label="说明" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>集装箱列表</span>
              <div class="no-print">
                <el-input
                  v-model="localSearch"
                  placeholder="搜索箱号、位置、提单号..."
                  style="width: 300px;"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
          </template>
          <el-table :data="displayContainers" border stripe max-height="400">
            <el-table-column prop="containerNo" label="箱号" width="140" fixed="left" />
            <el-table-column prop="size" label="尺寸" width="90" align="center" />
            <el-table-column prop="location" label="位置" width="100" align="center" />
            <el-table-column label="属性" width="120" align="center">
              <template #default="{ row }">
                <div style="display: flex; gap: 4px; justify-content: center;">
                  <el-tag v-if="row.isReefer" type="success" size="small">冷藏</el-tag>
                  <el-tag v-if="row.isHazardous" type="danger" size="small">危品</el-tag>
                  <el-tag v-if="row.isOverdue" type="warning" size="small">超期</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="重量(kg)" width="110" align="center" />
            <el-table-column prop="vesselName" label="船名" width="120" />
            <el-table-column prop="blNo" label="提单号" width="130" />
            <el-table-column prop="consignee" label="收货人" width="130" show-overflow-tooltip />
            <el-table-column prop="arrivalTime" label="到场时间" width="160" />
            <el-table-column label="操作" width="120" fixed="right" class="no-print">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewContainer(row)">详情</el-button>
                <el-button type="primary" link size="small" @click="locateOnMap(row)">定位</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="detailVisible" title="集装箱详情" width="600px">
      <el-descriptions v-if="selectedContainer" :column="2" border>
        <el-descriptions-item label="箱号">{{ selectedContainer.containerNo }}</el-descriptions-item>
        <el-descriptions-item label="尺寸">{{ selectedContainer.size }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ selectedContainer.type }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ selectedContainer.location }}</el-descriptions-item>
        <el-descriptions-item label="重量">{{ selectedContainer.weight }} kg</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ selectedContainer.priority }}</el-descriptions-item>
        <el-descriptions-item label="冷藏箱">{{ selectedContainer.isReefer ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="危险品">{{ selectedContainer.isHazardous ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedContainer.isHazardous" label="危险品等级">{{ selectedContainer.hazardLevel }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedContainer.isReefer" label="目标温度">{{ selectedContainer.targetTemp }}°C</el-descriptions-item>
        <el-descriptions-item label="船名">{{ selectedContainer.vesselName }}</el-descriptions-item>
        <el-descriptions-item label="航次">{{ selectedContainer.voyageNo }}</el-descriptions-item>
        <el-descriptions-item label="提单号">{{ selectedContainer.blNo }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ selectedContainer.consignee }}</el-descriptions-item>
        <el-descriptions-item label="发货人">{{ selectedContainer.shipper }}</el-descriptions-item>
        <el-descriptions-item label="到场时间">{{ selectedContainer.arrivalTime }}</el-descriptions-item>
        <el-descriptions-item label="预计离港">{{ selectedContainer.departureTime || '未安排' }}</el-descriptions-item>
        <el-descriptions-item label="超期堆存">{{ selectedContainer.isOverdue ? `是 (${selectedContainer.overdueDays}天)` : '否' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer class="no-print">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="createMoveTask">创建移箱任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useYardStore } from '@/stores/yard'
import type { Container } from '@/types'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const router = useRouter()
const yardStore = useYardStore()
const utilizationChart = ref<HTMLElement>()
const taskChart = ref<HTMLElement>()
const localSearch = ref('')
const detailVisible = ref(false)
const selectedContainer = ref<Container | null>(null)

const displayContainers = computed(() => {
  if (!localSearch.value) return yardStore.containers.slice(0, 50)
  const keyword = localSearch.value.toLowerCase()
  return yardStore.containers.filter(c => 
    c.containerNo.toLowerCase().includes(keyword) ||
    c.location.toLowerCase().includes(keyword) ||
    c.blNo?.toLowerCase().includes(keyword) ||
    c.consignee?.toLowerCase().includes(keyword)
  ).slice(0, 50)
})

function getZoneTypeTag(type: string) {
  const map: Record<string, string> = {
    general: '',
    reefer: 'success',
    hazardous: 'danger',
    empty: 'info',
    oversize: 'warning'
  }
  return map[type] || ''
}

function getZoneTypeName(type: string) {
  const map: Record<string, string> = {
    general: '普通箱区',
    reefer: '冷藏箱区',
    hazardous: '危险品区',
    empty: '空箱区',
    oversize: '特种箱区'
  }
  return map[type] || type
}

function getProgressColor(rate: number) {
  if (rate < 0.6) return '#52c41a'
  if (rate < 0.85) return '#faad14'
  return '#f5222d'
}

function viewContainer(container: Container) {
  selectedContainer.value = container
  detailVisible.value = true
}

function locateOnMap(container: Container) {
  yardStore.searchKeyword = container.containerNo
  router.push('/yard-map')
}

function createMoveTask() {
  if (selectedContainer.value) {
    yardStore.createMoveTask({
      containerNo: selectedContainer.value.containerNo,
      fromLocation: selectedContainer.value.location,
      taskType: 'move'
    })
    ElMessage.success('移箱任务已创建')
    detailVisible.value = false
    router.push('/move-tasks')
  }
}

function handleRefresh() {
  ElMessage.success('数据已刷新')
}

function handlePrint() {
  window.print()
}

function initCharts() {
  nextTick(() => {
    if (utilizationChart.value) {
      const chart = echarts.init(utilizationChart.value)
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['已占用', '空闲'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: yardStore.yardZones.map(z => z.zoneCode + '区')
        },
        yAxis: { type: 'value' },
        series: [
          {
            name: '已占用',
            type: 'bar',
            stack: 'total',
            data: yardStore.yardZones.map(z => z.occupiedSlots),
            itemStyle: { color: '#1890ff' }
          },
          {
            name: '空闲',
            type: 'bar',
            stack: 'total',
            data: yardStore.yardZones.map(z => z.totalSlots - z.occupiedSlots),
            itemStyle: { color: '#e8e8e8' }
          }
        ]
      })
    }

    if (taskChart.value) {
      const chart = echarts.init(taskChart.value)
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
          name: '任务状态',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: [
            { value: yardStore.pendingTasks, name: '待处理', itemStyle: { color: '#faad14' } },
            { value: yardStore.inProgressTasks, name: '进行中', itemStyle: { color: '#1890ff' } },
            { value: yardStore.completedTasks, name: '已完成', itemStyle: { color: '#52c41a' } }
          ]
        }]
      })
    }
  })
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', () => {
    if (utilizationChart.value) echarts.getInstanceByDom(utilizationChart.value)?.resize()
    if (taskChart.value) echarts.getInstanceByDom(taskChart.value)?.resize()
  })
})
</script>

<style scoped>
.stat-cards {
  margin-bottom: 16px;
}
</style>
