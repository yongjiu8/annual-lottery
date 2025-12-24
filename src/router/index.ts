import Layout from '@/layout/index.vue'
import i18n from '@/locales/i18n'
import Home from '@/views/Home/index.vue'
import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'

export const configRoutes = {
  path: '/config',
  name: 'Config',
  component: () => import('@/views/Config/index.vue'),
  children: [
    {
      path: '',
      redirect: '/config/person',
    },
    {
      path: '/config/person',
      name: 'PersonConfig',
      component: () => import('@/views/Config/Person/PersonConfig.vue'),
      meta: {
        title: i18n.global.t('sidebar.personConfiguration'),
        icon: 'person',
      },
      children: [
        {
          path: '',
          redirect: '/config/person/all',
        },
        {
          path: '/config/person/all',
          name: 'AllPersonConfig',
          component: () => import('@/views/Config/Person/PersonAll.vue'),
          meta: {
            title: i18n.global.t('sidebar.personList'),
            icon: 'all',
          },
        },
        {
          path: '/config/person/already',
          name: 'AlreadyPerson',
          component: () => import('@/views/Config/Person/PersonAlready.vue'),
          meta: {
            title: i18n.global.t('sidebar.winnerList'),
            icon: 'already',
          },
        },
      ],
    },
    {
      path: '/config/prize',
      name: 'PrizeConfig',
      component: () => import('@/views/Config/Prize/PrizeConfig.vue'),
      meta: {
        title: i18n.global.t('sidebar.prizeConfiguration'),
        icon: 'prize',
      },
    },
    {
      path: '/config/global',
      name: 'GlobalConfig',
      redirect: '/config/global/all',
      meta: {
        title: i18n.global.t('sidebar.globalSetting'),
        icon: 'global',
      },
      children: [
        {
          path: '/config/global/face',
          name: 'FaceConfig',
          component: () => import('@/views/Config/Global/FaceConfig.vue'),
          meta: {
            title: i18n.global.t('sidebar.viewSetting'),
            icon: 'face',
          },
        },
        {
          path: '/config/global/image',
          name: 'ImageConfig',
          component: () => import('@/views/Config/Global/ImageConfig.vue'),
          meta: {
            title: i18n.global.t('sidebar.imagesManagement'),
            icon: 'image',
          },
        },
        {
          path: '/config/global/music',
          name: 'MusicConfig',
          component: () => import('@/views/Config/Global/MusicConfig.vue'),
          meta: {
            title: i18n.global.t('sidebar.musicManagement'),
            icon: 'music',
          },
        },
      ],
    },
    {
      path: '/config/readme',
      name: 'Readme',
      component: () => import('@/views/Config/Readme/index.vue'),
      meta: {
        title: i18n.global.t('sidebar.operatingInstructions'),
        icon: 'readme',
      },
    },
  ],
}
const routes = [
  {
    path: '/',
    redirect: '/entry',
  },
  {
    path: '/entry',
    name: 'Entry',
    component: () => import('@/views/Entry/index.vue'),
  },
  {
    path: '/t/:themeId',
    component: Layout,
    children: [
      {
        path: '',
        name: 'ThemeHome',
        component: Home,
      },
      {
        path: 'config',
        name: 'ThemeConfig',
        component: () => import('@/views/Config/index.vue'),
        children: configRoutes.children,
      },
      {
        path: 'demo',
        name: 'ThemeDemo',
        component: () => import('@/views/Demo/index.vue'),
      },
    ],
  },
  // 保留旧路由兼容
  {
    path: '/home',
    component: Layout,
    redirect: '/entry',
    children: [
      {
        path: '',
        name: 'Home',
        component: Home,
      },
      {
        path: '/demo',
        name: 'Demo',
        component: () => import('@/views/Demo/index.vue'),
      },
      configRoutes,
    ],
  },
];
const envMode=import.meta.env.MODE;
const router = createRouter({
    // 读取环境变量
  history: envMode==='file'?createWebHashHistory():createWebHistory(),
  routes,
})

import { useThemeStore, isThemeVerifiedSync } from '@/store/theme'

// 路由守卫：检查是否已选择主题和权限验证
router.beforeEach((to, _from, next) => {
  // 入口页面不需要检查
  if (to.name === 'Entry') {
    next()
    return
  }
  
  // 旧路由重定向到入口页面（强制用户选择主题）
  if (to.path === '/home' || to.name === 'Home') {
    next({ name: 'Entry' })
    return
  }
  
  // 如果URL中有主题ID参数
  const themeIdFromUrl = to.params.themeId as string
  if (themeIdFromUrl) {
    // 检查该主题是否已通过密码验证（同步检查本地 token）
    if (!isThemeVerifiedSync(themeIdFromUrl)) {
      // 未验证，跳转到入口页面进行密码验证
      next({ name: 'Entry', query: { redirect: to.fullPath, themeId: themeIdFromUrl } })
      return
    }
    
    // 已验证，设置当前主题ID
    const themeStore = useThemeStore()
    themeStore.selectTheme(themeIdFromUrl)
    next()
    return
  }
  
  // 检查是否已选择主题
  const themeStore = useThemeStore()
  if (themeStore.currentThemeId) {
    // 检查当前主题是否已验证
    if (!isThemeVerifiedSync(themeStore.currentThemeId)) {
      next({ name: 'Entry', query: { themeId: themeStore.currentThemeId } })
      return
    }
    next()
    return
  }
  
  // 未选择主题，跳转到入口页
  next({ name: 'Entry' })
})

export default router
