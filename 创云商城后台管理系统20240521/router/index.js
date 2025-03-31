import Vue from 'vue'
import Router from 'uni-simple-router'
import { Loading } from 'element-ui';
import routes from './routers'
import store from '@/store'
import {
	setTitle,
	getHomeRoute
} from '@/common/js/util'

Vue.use(Router);

const router = new Router({
	h5: {
		vueRouterDev: true
	},
	routes
});

const LOGIN_PAGE_NAME = 'login'

//全局路由前置守卫
router.beforeEach((to, from, next) => {
	Loading.service();
	const token = uni.getStorageSync('uniIdTokenAdmin')
	// 未登录且要跳转的页面不是登录页
	if(!token && to.name !== LOGIN_PAGE_NAME) {
		next({
			name: LOGIN_PAGE_NAME
		})
		return;
	}
	// 未登陆且要跳转的页面是登录页
	if(!token && to.name === LOGIN_PAGE_NAME) {
		next() 
		return;
	}
	
	const userInfo = store.state.user.userInfo;
	if(!userInfo._id){
		store.dispatch('getUserInfo')
		return;
	}
	//无权限
	const access = userInfo.access;
	const routerObj = getHomeRoute(routes, to.name);
	if(routerObj.meta.access && routerObj.meta.access.length > 0){
		if(!access.some(item=> item == routerObj.meta.access[0])){
			next({
				name: 'error_401' 
			})
			return;
		}
	}
	// 已经登录跳转登录 重定向到index
	if(token && to.name === LOGIN_PAGE_NAME) {
		next({
			name: 'index' 
		})
	} else {
		next();
	}
})
// 全局路由后置守卫
router.afterEach((to, from) => {
	Loading.service().close();
	setTitle(to, router.app)
	window.scrollTo(0, 0)
})
export default router;
