<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">翻箱任务</h2>
      <div class="header-actions no-print">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          <span>新建任务</span>
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          <span>打印任务单</span>
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-value" style="color: #fa8c16;">{{ yardStore.pendingTasks }}</div>
          <div class="stat-label">待处理任务</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-value" style="color: #1890ff;">{{ yardStore.inProgressTasks }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-value" style="color: #52c41a;">{{ yardStore.completedTasks }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f0f5ff; color: #2f54eb;">
            <el-icon><List /></el-icon>
          </div>
          <div class="stat-value" style="color: #2f54eb;">{{ yardStore.moveTasks.length }}</div>
          <div class="stat-label">总任务数</div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar no-print" style="margin-top: 16px;">
      <el-select v-model="filterStatus" placeholder="任务状态" clearable style="width: 140px;">
        <el-option label="待处理" value="pending" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-select v-model="filterType" placeholder="任务类型" clearable style="width: 140px;">
        <el-option label="移箱" value="move" />
        <el-option label="吊装" value="lift" />
        <el-option label="堆码" value="stack" />
        <el-option label="提箱" value="retrieve" />
      </el-select>
      <el-select v-model="filterPriority" placeholder="优先级" clearable style="width: 120px;">
        <el-option label="紧急" :value="5" />
        <el-option label="高" :value="4" />
        <el-option label="普通" :value="3" />
        <el-option label="低" :value="2" />
        <el-option label="最低" :value="1" />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索箱号/任务号" clearable style="width: 200px;">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <el-card class="card-shadow">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>任务列表</span>
          <div class="no-print">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="list">列表视图</el-radio-button>
              <el-radio-button value="board">看板视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <div v-if="viewMode === 'list'">
        <el-table :data="filteredTasks" border stripe>
          <el-table-column prop="taskNo" label="任务编号" width="160" fixed="left" />
          <el-table-column prop="taskType" label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getTaskTypeTag(row.taskType)" size="small">{{ getTaskTypeName(row.taskType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="containerNo" label="箱号" width="140" />
          <el-table-column prop="fromLocation" label="起始位置" width="120" align="center" />
          <el-table-column prop="toLocation" label="目标位置" width="120" align="center" />
          <el-table-column prop="priority" label="优先级" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getPriorityTag(row.priority)" size="small">P{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110" align="center">
            <template #default="{ row }">
              <span :class="['tag-status', row.status]">{{ getStatusName(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="assignedTo" label="负责人" width="100" />
          <el-table-column prop="equipment" label="设备" width="100" />
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column label="操作" width="220" fixed="right" class="no-print">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewTask(row)">详情</el-button>
              <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="startTask(row)">开始</el-button>
              <el-button v-if="row.status === 'in_progress'" type="warning" link size="small" @click="completeTask(row)">完成</el-button>
              <el-button v-if="row.status === 'pending'" type="danger" link size="small" @click="cancelTask(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="kanban-board">
        <div class="kanban-column">
          <div class="kanban-header pending">
            <h4>待处理 ({{ pendingList.length }})</h4>
          </div>
          <div class="kanban-cards">
            <div v-for="task in pendingList" :key="task.id" class="kanban-card" @click="viewTask(task)">
              <div class="kanban-card-header">
                <span class="task-no">{{ task.taskNo }}</span>
                <el-tag :type="getPriorityTag(task.priority)" size="small">P{{ task.priority }}</el-tag>
              </div>
              <div class="kanban-card-body">
                <p><strong>箱号:</strong> {{ task.containerNo }}</p>
                <p><strong>从:</strong> {{ task.fromLocation }}</p>
                <p><strong>到:</strong> {{ task.toLocation }}</p>
              </div>
              <div class="kanban-card-footer">
                <span>{{ task.createdBy }}</span>
                <span>{{ task.createdAt.slice(5, 16) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kanban-column">
          <div class="kanban-header in_progress">
            <h4>进行中 ({{ inProgressList.length }})</h4>
          </div>
          <div class="kanban-cards">
            <div v-for="task in inProgressList" :key="task.id" class="kanban-card" @click="viewTask(task)">
              <div class="kanban-card-header">
                <span class="task-no">{{ task.taskNo }}</span>
                <el-tag :type="getPriorityTag(task.priority)" size="small">P{{ task.priority }}</el-tag>
              </div>
              <div class="kanban-card-body">
                <p><strong>箱号:</strong> {{ task.containerNo }}</p>
                <p><strong>从:</strong> {{ task.fromLocation }}</p>
                <p><strong>到:</strong> {{ task.toLocation }}</p>
              </div>
              <div class="kanban-card-footer">
                <span>{{ task.assignedTo }}</span>
                <el-tag type="primary" size="small">{{ task.equipment }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="kanban-column">
          <div class="kanban-header completed">
            <h4>已完成 ({{ completedList.length }})</h4>
          </div>
          <div class="kanban-cards">
            <div v-for="task in completedList.slice(0, 5)" :key="task.id" class="kanban-card" @click="viewTask(task)">
              <div class="kanban-card-header">
                <span class="task-no">{{ task.taskNo }}</span>
                <el-icon color="#52c41a"><CircleCheck /></el-icon>
              </div>
              <div class="kanban-card-body">
                <p><strong>箱号:</strong> {{ task.containerNo }}</p>
                <p><strong>位置:</strong> {{ task.toLocation }}</p>
              </div>
              <div class="kanban-card-footer">
                <span>{{ task.endTime?.slice(5, 16) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow" title="设备状态">
          <el-table :data="equipmentList" border stripe size="small">
            <el-table-column prop="equipmentNo" label="设备编号" width="120" />
            <el-table-column prop="equipmentType" label="类型" width="120">
              <template #default="{ row }">
                {{ getEquipmentTypeName(row.equipmentType) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getEquipmentStatusTag(row.status)" size="small">
                  {{ getEquipmentStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="currentOperator" label="操作员" width="100" />
            <el-table-column prop="location" label="位置" width="120" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" title="作业人员">
          <el-table :data="staffList" border stripe size="small">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="position" label="职位" width="120" />
            <el-table-column prop="team" label="班组" width="100" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'on_duty' ? 'success' : 'info'" size="small">
                  {{ row.status === 'on_duty' ? '在岗' : row.status === 'off_duty' ? '下班' : '休假' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系电话" width="140" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreateDialog" title="新建移箱任务" width="600px" class="no-print">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务类型">
          <el-select v-model="taskForm.taskType" style="width: 100%;">
            <el-option label="移箱" value="move" />
            <el-option label="吊装" value="lift" />
            <el-option label="堆码" value="stack" />
            <el-option label="提箱" value="retrieve" />
          </el-select>
        </el-form-item>
        <el-form-item label="箱号">
          <el-input v-model="taskForm.containerNo" placeholder="请输入箱号" />
        </el-form-item>
        <el-form-item label="起始位置">
          <el-input v-model="taskForm.fromLocation" placeholder="例如: A123" />
        </el-form-item>
        <el-form-item label="目标位置">
          <el-input v-model="taskForm.toLocation" placeholder="例如: B456" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="taskForm.priority">
            <el-radio :value="1">最低</el-radio>
            <el-radio :value="2">低</el-radio>
            <el-radio :value="3">普通</el-radio>
            <el-radio :value="4">高</el-radio>
            <el-radio :value="5">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="指派设备">
          <el-select v-model="taskForm.equipment" placeholder="选择设备" style="width: 100%;">
            <el-option v-for="eq in availableEquipments" :key="eq.id" :label="eq.equipmentNo" :value="eq.equipmentNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派人员">
          <el-select v-model="taskForm.assignedTo" placeholder="选择人员" style="width: 100%;">
            <el-option v-for="s in onDutyStaff" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="taskForm.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTask">创建任务</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="任务详情" width="600px">
      <el-descriptions v-if="selectedTask" :column="2" border size="small">
        <el-descriptions-item label="任务编号">{{ selectedTask.taskNo }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">{{ getTaskTypeName(selectedTask.taskType) }}</el-descriptions-item>
        <el-descriptions-item label="箱号">{{ selectedTask.containerNo }}</el-descriptions-item>
        <el-descriptions-item label="优先级">P{{ selectedTask.priority }}</el-descriptions-item>
        <el-descriptions-item label="起始位置">{{ selectedTask.fromLocation }}</el-descriptions-item>
        <el-descriptions-item label="目标位置">{{ selectedTask.toLocation }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="['tag-status', selectedTask.status]">{{ getStatusName(selectedTask.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="设备">{{ selectedTask.equipment || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ selectedTask.assignedTo || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ selectedTask.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedTask.createdAt }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedTask.startTime" label="开始时间">{{ selectedTask.startTime }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedTask.endTime" label="完成时间">{{ selectedTask.endTime }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedTask.remarks" label="备注" :span="2">{{ selectedTask.remarks }}</el-descriptions-item>
      </el-descriptions>
      <template #footer class="no-print">
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="printTask">打印作业单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useYardStore } from '@/stores/yard'
import type { MoveTask, Equipment, Staff } from '@/types'
import { mockEquipments, mockStaffs } from '@/types/mock'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const yardStore = useYardStore()
const filterStatus = ref('')
const filterType = ref('')
const filterPriority = ref<number | ''>('')
const searchKeyword = ref('')
const viewMode = ref('list')
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const selectedTask = ref<MoveTask | null>(null)
const equipmentList = ref<Equipment[]>(mockEquipments)
const staffList = ref<Staff[]>(mockStaffs)

const taskForm = reactive({
  taskType: 'move',
  containerNo: '',
  fromLocation: '',
  toLocation: '',
  priority: 3,
  equipment: '',
  assignedTo: '',
  remarks: ''
})

const filteredTasks = computed(() => {
  let tasks = [...yardStore.moveTasks]
  
  if (filterStatus.value) {
    tasks = tasks.filter(t => t.status === filterStatus.value)
  }
  if (filterType.value) {
    tasks = tasks.filter(t => t.taskType === filterType.value)
  }
  if (filterPriority.value !== '') {
    tasks = tasks.filter(t => t.priority === filterPriority.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    tasks = tasks.filter(t => 
      t.containerNo.toLowerCase().includes(kw) ||
      t.taskNo.toLowerCase().includes(kw)
    )
  }
  
  return tasks
})

const pendingList = computed(() => yardStore.moveTasks.filter(t => t.status === 'pending'))
const inProgressList = computed(() => yardStore.moveTasks.filter(t => t.status === 'in_progress'))
const completedList = computed(() => yardStore.moveTasks.filter(t => t.status === 'completed'))

const availableEquipments = computed(() => equipmentList.value.filter(e => e.status === 'available'))
const onDutyStaff = computed(() => staffList.value.filter(s => s.status === 'on_duty'))

function getTaskTypeName(type: string) {
  const map: Record<string, string> = {
    move: '移箱',
    lift: '吊装',
    stack: '堆码',
    retrieve: '提箱'
  }
  return map[type] || type
}

function getTaskTypeTag(type: string) {
  const map: Record<string, string> = {
    move: '',
    lift: 'primary',
    stack: 'success',
    retrieve: 'warning'
  }
  return map[type] || ''
}

function getPriorityTag(priority: number) {
  if (priority >= 4) return 'danger'
  if (priority >= 3) return 'warning'
  return 'info'
}

function getStatusName(status: string) {
  const map: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function getEquipmentTypeName(type: string) {
  const map: Record<string, string> = {
    reach_stacker: '堆高机',
    forklift: '叉车',
    terminal_tractor: '集卡',
    other: '其他'
  }
  return map[type] || type
}

function getEquipmentStatusTag(status: string) {
  const map: Record<string, string> = {
    available: 'success',
    in_use: 'primary',
    maintenance: 'warning',
    broken: 'danger'
  }
  return map[status] || ''
}

function getEquipmentStatusName(status: string) {
  const map: Record<string, string> = {
    available: '可用',
    in_use: '使用中',
    maintenance: '维护中',
    broken: '故障'
  }
  return map[status] || status
}

function viewTask(task: MoveTask) {
  selectedTask.value = task
  showDetailDialog.value = true
}

function startTask(task: MoveTask) {
  yardStore.updateMoveTask(task.taskNo, {
    status: 'in_progress',
    startTime: dayjs().format('YYYY-MM-DD HH:mm')
  })
  ElMessage.success('任务已开始')
}

function completeTask(task: MoveTask) {
  ElMessageBox.confirm('确认完成该任务？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    yardStore.updateMoveTask(task.taskNo, {
      status: 'completed',
      endTime: dayjs().format('YYYY-MM-DD HH:mm')
    })
    ElMessage.success('任务已完成')
  }).catch(() => {})
}

function cancelTask(task: MoveTask) {
  ElMessageBox.confirm('确认取消该任务？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    yardStore.updateMoveTask(task.taskNo, { status: 'cancelled' })
    ElMessage.success('任务已取消')
  }).catch(() => {})
}

function createTask() {
  if (!taskForm.containerNo || !taskForm.fromLocation) {
    ElMessage.warning('请填写必要信息')
    return
  }
  
  yardStore.createMoveTask({
    taskType: taskForm.taskType as MoveTask['taskType'],
    containerNo: taskForm.containerNo,
    fromLocation: taskForm.fromLocation,
    toLocation: taskForm.toLocation,
    priority: taskForm.priority,
    equipment: taskForm.equipment,
    assignedTo: taskForm.assignedTo,
    remarks: taskForm.remarks
  })
  
  ElMessage.success('任务创建成功')
  showCreateDialog.value = false
  
  taskForm.containerNo = ''
  taskForm.fromLocation = ''
  taskForm.toLocation = ''
  taskForm.priority = 3
  taskForm.equipment = ''
  taskForm.assignedTo = ''
  taskForm.remarks = ''
}

function handleSearch() {
  ElMessage.success('查询完成')
}

function handlePrint() {
  window.print()
}

function printTask() {
  window.print()
}
</script>

<style scoped>
.kanban-board {
  display: flex;
  gap: 16px;
  min-height: 400px;
}

.kanban-column {
  flex: 1;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  min-height: 300px;
}

.kanban-header {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.kanban-header.pending {
  background: #fff7e6;
  border-left: 4px solid #fa8c16;
}

.kanban-header.in_progress {
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
}

.kanban-header.completed {
  background: #f6ffed;
  border-left: 4px solid #52c41a;
}

.kanban-header h4 {
  margin: 0;
}

.kanban-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.kanban-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-no {
  font-weight: 600;
  font-size: 13px;
  color: #1890ff;
}

.kanban-card-body {
  font-size: 13px;
  color: #666;
}

.kanban-card-body p {
  margin: 2px 0;
}

.kanban-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
</style>
