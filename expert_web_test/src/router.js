import Vue from 'vue'
import Router from 'vue-router'
import Search from './components/Search.vue'
import Result from './components/Result.vue'
import History from './components/History.vue'
import IFUP from './components/IFUpdate.vue'
import InstCrawl from './components/InstCrawler.vue'
import Integration from './components/Integration.vue'

Vue.use(Router)


const baseRoutes = [
	{
		path: '/search',
		name: 'search',
		component: Search,
  },
	{
		path: '/history',
		name: 'history',
		component: History,
  },
	{
		path: '/result',
		name: 'result',
		component: Result,
		props: true,
  },
	{
		path: '/ifupdate',
		name: 'ifupdate',
		component: IFUP,
  },
	{
		path: '/instcrawler',
		name: 'instcrawler',
		component: InstCrawl,
  },
	{
		path: '/integration',
		name: 'integration',
		component: Integration,
	},
	{
		path: '*',
		redirect: {
			name: 'search',
		},
  },
];

// const routes = baseRoutes.concat(messagesRoutes, peopleRoutes);
const routes = baseRoutes;
export default new Router({
	routes,
});
