import Vue from "vue";
import VueCompositionAPI from "@vue/composition-api";

import App from "@/App.vue";
import store from "@/js/store";
import vuetify from "./plugins/vuetify";

Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
