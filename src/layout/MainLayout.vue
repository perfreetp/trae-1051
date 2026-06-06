<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar no-print">
      <div class="logo">
        <el-icon size="28" color="#1890ff"><Container /></el-icon>
        <span class="logo-text">堆场管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :router="true"
        background-color="#001529"
        text-color="rgba(255, 255, 255, 0.65)"
        active-text-color="#fff"
        class="menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header no-print">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-input
            v-model="searchInput"
            placeholder="搜索箱号/提单号..."
            class="search-input"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-badge :value="yardStore.openExceptions" :hidden="yardStore.openExceptions === 0" class="exception-badge">
            <el-button type="primary" link @click="$router.push('/exceptions')">
              <el-icon size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <div class="user-info">
            <el-avatar size="32" icon="UserFilled" />
            <span class="username">调度员</span>
          </div>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useYardStore } from '@/stores/yard'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const yardStore = useYardStore()
const searchInput = ref('')

const menuItems = [
  { path: '/overview', title: '堆场总览', icon: 'DataAnalysis' },
  { path: '/yard-map', title: '箱区平面图', icon: 'Grid' },
  { path: '/import-export', title: '进出口计划', icon: 'Switch' },
  { path: '/move-tasks', title: '翻箱任务', icon: 'Rank' },
  { path: '/reefer-monitor', title: '冷藏箱监控', icon: 'Snowflake' },
  { path: '/exceptions', title: '异常处理', icon: 'Warning' },
  { path: '/reports', title: '统计报表', icon: 'Document' }
]

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item ? item.title : ''
})

function handleSearch() {
  if (!searchInput.value.trim()) return
  
  yardStore.searchKeyword = searchInput.value.trim()
  const container = yardStore.findContainerByNo(searchInput.value.trim())
  
  if (container) {
    ElMessage.success(`找到集装箱: ${container.containerNo}`)
    router.push('/yard-map')
  } else {
    ElMessage.info('未找到相关集装箱，已在列表中筛选')
    router.push('/overview')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.menu {
  border-right: none;
  flex: 1;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-input {
  width: 280px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.main-content {
  padding: 0;
  overflow: hidden;
  background: #f0f2f5;
}

.exception-badge {
  margin-right: 8px;
}
</style>
