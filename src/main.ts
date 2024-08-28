import { createApp } from "vue";
import router from "./router.ts";
import "./style.css";
import App from "./App.vue";
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
} from "vuestic-ui";
import "vuestic-ui/css";

const app = createApp(App);
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
    },
    plugins: { VaDropdownPlugin },
  }),
);
app.use(router);
app.mount("#app");
