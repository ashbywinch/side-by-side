import { createApp } from "vue";
import router from "./router.ts";
import "./style.css";
import App from "./App.vue";
import { VueResponsiveness } from "vue-responsiveness";

import {
  createVuesticEssential,
  VaButton,
  VaSelect,
  VaInput,
  VaCard,
  VaCardTitle,
  VaCardContent,
  VaCardActions,
  VaBadge,
  VaPagination,
  VaDropdownPlugin,
  VaNavbar,
  VaNavbarItem,
  VaAlert,
  VaIcon,
} from "vuestic-ui";
import "vuestic-ui/css";

const app = createApp(App);
app.use(VueResponsiveness, {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1260,
  xl: 1920,
});
app.use(
  createVuesticEssential({
    components: {
      VaButton,
      VaSelect,
      VaInput,
      VaCard,
      VaCardTitle,
      VaCardContent,
      VaBadge,
      VaCardActions,
      VaPagination,
      VaNavbar,
      VaNavbarItem,
      VaAlert,
      VaIcon,
    },
    plugins: { VaDropdownPlugin },
  }),
);
app.use(router);
app.mount("#app");
