// eslint-disable-next-line
import { getRouters } from '@/api/menu'
import { indexRouterMap, otherRouterMap } from '@/config/router.config'
import allIcon from '@/core/icons'
import { validURL } from '@/utils/validate'
import { UserLayout, BlankLayout, PageView } from '@/layouts'
// 前端路由表
const constantRouterComponents = {
  // 基础页面 layout 必须引入
  BasicLayout: () => import('@/layouts/BasicLayout'),
  BlankLayout: BlankLayout,
  RouteView: () => import('@/layouts/RouteView'),
  PageView: PageView,
  UserLayout: UserLayout, // 登陆注册页面的通用布局

  // 你需要动态引入的页面组件
  'Index': () => import('@/views/index'),
  // account
  'AccountCenter': () => import('@/views/account/center'),
  'AccountSettings': () => import('@/views/account/settings/index'),
  'BaseSettings': () => import('@/views/account/settings/BaseSetting'),
  'SecuritySettings': () => import('@/views/account/settings/Security'),
  // job log
  'JobLog': () => import('@/views/monitor/job/log'),
  // 授权用户
  'AuthUser': () => import('@/views/system/role/authUser'),
  // 公告新增修改
  'NoticeForm': () => import('@/views/system/notice/CreateForm'),
  // 修改生成配置
  'GenEdit': () => import('@/views/tool/gen/modules/GenEdit')
}

// 前端未找到页面路由（固定不用改）
const notFoundRouter = {
  path: '*', redirect: '/404', hidden: true
}

// 根级菜单
const rootRouter = {
  key: '',
  name: 'index',
  path: '',
  component: 'BasicLayout',
  redirect: '/index',
  meta: {
    title: '首页'
  },
  children: []
}

/**
 * 为解决缓存问题，自定义页面添加一层父级
 */
const bashRouter = {
  path: '/',
  name: '',
  component: 'Layout',
  hidden: true
}

/**
 * 动态生成菜单
 * @param token
 * @returns {Promise<Router>}
 */
export const generatorDynamicRouter = (token) => {
  return new Promise((resolve, reject) => {
    // 向后端请求路由数据
    getRouters().then(res => {
      const menuNav = []
      const routerData = res.data
      bashRouter.children = otherRouterMap
      routerData.unshift(bashRouter)
      rootRouter.children = indexRouterMap.concat(routerData)
      menuNav.push(rootRouter)
      const routers = generator(menuNav)
      routers.push(notFoundRouter)
      resolve(routers)
    }).catch(err => {
      reject(err)
    })
  })
}

/**
 * 格式化树形结构数据 生成 vue-router 层级路由表
 *
 * @param routerMap
 * @param parent
 * @returns {*}
 */
export const generator = (routerMap, parent) => {
  return routerMap.map(item => {
    const { title, show, hideChildren, hiddenHeaderContent, hidden, icon, noCache } = item.meta || {}
    if (item.component) {
      // Layout ParentView 组件特殊处理
      if (item.component === 'Layout') {
        item.component = 'RouteView'
      } else if (item.component === 'ParentView') {
        // 三级菜单处理
        item.component = 'RouteView'
        item.path = '/' + item.path
      }
    }
    if (item.path) {
      // item.path = '/' + item.path
    }
    if (item.isFrame === 0) {
      item.target = '_blank'
    }
    const currentRouter = {
      // 如果路由设置了 path，则作为默认 path，否则 路由地址 动态拼接生成如 /dashboard/workplace
      path: item.path || `${parent && parent.path || ''}/${item.path}`,
      // 路由名称，建议唯一
      name: item.name || item.key || '',
      // 该路由对应页面的 组件(动态加载)
      component: (constantRouterComponents[item.component || item.key]) || (() => import(`@/views/${item.component}`)),
      hidden: item.hidden,
      // meta: 页面标题, 菜单图标, 页面权限(供指令权限用，可去掉)
      meta: {
        title: title,
        icon: allIcon[icon + 'Icon'] || icon,
        hiddenHeaderContent: hiddenHeaderContent,
        // 目前只能通过判断path的http链接来判断是否外链，适配若依
        target: validURL(item.path) ? '_blank' : '',
        permission: item.name,
        keepAlive: noCache === undefined ? false : !noCache,
        hidden: hidden
      },
      redirect: item.redirect
    }
    // 是否设置了隐藏菜单
    if (show === false) {
      currentRouter.hidden = true
    }
    // 适配若依，若依为缩写路径，而antdv-pro的pro-layout要求每个路径需为全路径
    if (!constantRouterComponents[item.component || item.key]) {
      currentRouter.path = `${parent && parent.path || ''}/${item.path}`
    }
    // 是否设置了隐藏子菜单
    if (hideChildren) {
      currentRouter.hideChildrenInMenu = true
    }
    // 是否有子菜单，并递归处理，并将父path传入
    if (item.children && item.children.length > 0) {
      // Recursion
      currentRouter.children = generator(item.children, currentRouter)
    }
    return currentRouter
  })
}
