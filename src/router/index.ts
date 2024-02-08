import { createRouter, createWebHistory } from "vue-router";
import { SelectedCardPage, WeatherCardsPage } from "../pages";

const routes = [
  { path: "/", name: "Home", component: WeatherCardsPage },
  { path: "/selected", name: "Selected", component: SelectedCardPage },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
