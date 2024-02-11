import { createRouter, createWebHashHistory } from "vue-router";
import { LocationView, HomeView } from "../views";

const routes = [
  { path: "/", name: "Home", component: HomeView },
  { path: "/location/:state/:city", name: "Location", component: LocationView },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
