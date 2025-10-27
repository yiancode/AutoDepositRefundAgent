/**
 * Vue Router 配置
 */
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/camps'
  },
  {
    path: '/camps',
    name: 'CampList',
    component: () => import('@/views/CampList.vue'),
    meta: { title: '训练营列表' }
  },
  {
    path: '/camps/:checkinId/refund',
    name: 'RefundList',
    component: () => import('@/views/RefundList.vue'),
    meta: { title: '退款名单' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局导航守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '知识星球训练营退款系统';
  next();
});

export default router;
