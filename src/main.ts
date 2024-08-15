import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
// Import all of Bootstrap's CSS
import "bootstrap/scss/bootstrap.scss";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";
//import * as bootstrap from 'bootstrap'
import App from "./App.vue";
import { createBootstrap } from "bootstrap-vue-next";

const app = createApp(App);
app.use(createBootstrap());
app.use(createPinia());
app.mount("#app");
