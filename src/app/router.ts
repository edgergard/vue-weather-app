import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** The page spans the full window width instead of the centred content column. */
    fullBleed?: boolean
  }
}

// Hash history keeps deep links working on GitHub Pages, which has no SPA fallback.
export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/forecast/:lat/:lon',
      name: 'forecast',
      component: () => import('@/pages/ForecastPage.vue'),
    },
    {
      // The map engine (MapLibre) is loaded only here.
      path: '/globe',
      name: 'globe',
      component: () => import('@/pages/GlobePage.vue'),
      meta: { fullBleed: true },
    },
    {
      // v1 links: #/location/:state/:city?lat=..&lon=.. — keep old bookmarks working.
      path: '/location/:state/:city',
      redirect: (to) => {
        const { lat, lon } = to.query
        if (typeof lat !== 'string' || typeof lon !== 'string') return { name: 'home' }
        return {
          name: 'forecast',
          params: { lat, lon },
          query: { name: String(to.params.city), region: String(to.params.state) },
        }
      },
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
