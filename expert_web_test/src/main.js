import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router';
import router from './router.js';
import vuetify from '@/plugins/vuetify'
import axios from 'axios'
import {
	store
} from './store'
// import VueTabs from 'vue-nav-tabs'
//
// Vue.use(VueTabs);
Vue.use(VueRouter);

Vue.config.productionTip = false
Vue.prototype.$http = axios
new Vue({
	router,
	store,
	vuetify,
	render: h => h(App),
}).$mount('#app')
