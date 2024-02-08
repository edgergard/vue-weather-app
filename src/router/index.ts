import { createRouter, createWebHistory } from "vue-router";
import { SelectedCardPage, WeatherCardsPage } from "../pages";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {path: '/', name: 'Home', component: WeatherCardsPage},
    {path: '/selected', name: 'Selected', component: SelectedCardPage}
  ]
});

export default router;