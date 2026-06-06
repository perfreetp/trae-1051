import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/overview',
    children: [
      {
        path: '/overview',
        name: 'Overview',
        component: () => import('@/views/Overview.vue'),
        meta: { title: '堆场总览', icon: 'DataAnalysis' }
      },
      {
        path: '/yard-map',
        name: 'YardMap',
        component: () => import('@/views/YardMap.vue'),
        meta: { title: '箱区平面图', icon: 'Grid' }
      },
      {
        path: '/import-export',
        name: 'ImportExport',
        component: () => import('@/views/ImportExport.vue'),
        meta: { title: '进出口计划', icon: 'Switch' }
      },
      {
        path: '/move-tasks',
        name: 'MoveTasks',
        component: () => import('@/views/MoveTasks.vue'),
        meta: { title: '翻箱任务', icon: 'Rank' }
      },
      {
        path: '/reefer-monitor',
        name: 'ReeferMonitor',
        component: () => import('@/views/ReeferMonitor.vue'),
        meta: { title: '冷藏箱监控', icon: 'Snowflake' }
      },
      {
        path: '/exceptions',
        name: 'Exceptions',
        component: () => import('@/views/Exceptions.vue'),
        meta: { title: '异常处理', icon: 'Warning' }
      },
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { title: '统计报表', icon: 'Document' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
