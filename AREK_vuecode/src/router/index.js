import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import ExplorePage from '@/views/Explore.vue';
import QuickSearchPage from '@/views/quicksearch.vue';
import ResultPage from '@/views/result.vue';
import ContactPage from '@/views/contact.vue';
import TaxaModulePage from '@/views/Taxa_module.vue';

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
    path: '/explore',
    name: 'explore',
    component: ExplorePage
  },
  {
    path: '/result/:datasetId?',
    name: 'result',
    component: ResultPage
  },
  {
    path: '/quicksearch',
    name: 'quicksearch',
    component: QuickSearchPage,
    alias: '/detail-table'
  },
  {
    path: '/contact',
    name: 'contact',
    component: ContactPage
  },
  {
    path: '/taxa-module',
    name: 'taxa-module',
    component: TaxaModulePage
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
