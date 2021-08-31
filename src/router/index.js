import { createRouter, createWebHistory } from '@ionic/vue-router';
import MainPage from '@/views/MainPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/main'
  },
  {
    path: '/main',
    component: MainPage,
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
