import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import ResultPage from '@/views/ResultPage.vue';
import ContactPage from '@/views/contact.vue';
import DetailTablePage from '@/views/DetailTable.vue';

const routes = [
  {
    path: '/',
    redirect: '/homepage'
  },
  {
    path: '/homepage',
    name: 'homepage',
    component: HomePage
  },
  {
    path: '/result',
    name: 'result',
    component: ResultPage
  },
  {
    path: '/detail-table',
    name: 'detail-table',
    component: DetailTablePage
  },
  {
    path: '/contact',
    name: 'contact',
    component: ContactPage
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0 };
  }
});

export default router;
