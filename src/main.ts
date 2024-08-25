import { createApp } from "vue";
import router from "./router.ts";
import "./style.css";
import "bootstrap/scss/bootstrap.scss";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";
import App from "./App.vue";
import { createBootstrap } from "bootstrap-vue-next";

const app = createApp(App);
app.use(createBootstrap());
app.use(router);
app.mount("#app");
