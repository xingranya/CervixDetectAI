import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },
      { path: 'forgot-password', component: () => import('pages/ForgotPasswordPage.vue') }
    ]
  },
  
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true }, // 触发认证守卫
    children: [
      { 
        path: '', 
        name: 'dashboard', 
        component: () => import('pages/DashboardPage.vue') 
      },
      { 
        path: 'studies', 
        name: 'studies', 
        component: () => import('pages/StudiesPage.vue') 
      },
      { 
        path: 'studies/:id', 
        name: 'study-detail', 
        component: () => import('pages/StudyDetailPage.vue'),
        props: true
      },
      { 
        path: 'upload', 
        name: 'upload', 
        component: () => import('pages/UploadPage.vue') 
      },
      { 
        path: 'reports', 
        name: 'reports', 
        component: () => import('pages/ReportsPage.vue') 
      },
      { 
        path: 'models', 
        name: 'models', 
        component: () => import('pages/ModelsPage.vue') 
      },
      { 
        path: 'settings', 
        name: 'settings', 
        component: () => import('pages/SettingsPage.vue') 
      },
      { 
        path: 'profile', 
        name: 'profile', 
        component: () => import('pages/ProfilePage.vue') 
      }
    ]
  },
  
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes