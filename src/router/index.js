import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import MyVue from '@/components/Myvue'

Vue.use(Router)
export const constantRouterMap = [
  { path: '/', name: 'HelloWorld', component: HelloWorld },
  { path: '/Myvue', name: 'Myvue', component: MyVue, hidden: true }
]

export default new Router({
  routes: constantRouterMap
})
