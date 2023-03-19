import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import P139View from '../views/P139View.vue'
import P275View from '../views/P275View.vue'
import P510View from '../views/P510View.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/map139',
    name: 'page139',
    component: P139View
  },
  {
    path: '/map275',
    name: 'page275',
    component: P275View
  },
  {
    path: '/map510',
    name: 'page510',
    component: P510View
  }

]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
