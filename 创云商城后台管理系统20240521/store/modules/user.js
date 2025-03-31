import request from '@/common/js/request'
import {throttle} from '@/common/js/util'
import router from '@/router'

export default {
	state: {
		userInfo: {}
	},
	mutations: {
		//更新state数据
		setStateAttr(state, param){
			if(param.key != 'timerIdent'){
				console.log(param);
			}
			if(param instanceof Array){
				for(let item of param){
					state[item.key] = item.val;
				}
			}else{
				state[param.key] = param.val;
			}
		},
		//更新token
		setToken(state, data){
			const {token, tokenExpired} = data;
			uni.setStorageSync('uniIdTokenAdmin', token);
			uni.setStorageSync('tokenExpiredAdmin', tokenExpired);
			this.dispatch('getUserInfo'); //更新用户信息
		},
		//退出登录
		logout(state){
			throttle(()=>{
				request('admin', 'logout', {}, {showLoading: false});
				uni.removeStorageSync('uniIdTokenAdmin');
				uni.removeStorageSync('tokenExpiredAdmin');
				state.userInfo = {};
			})
		}
	},
	actions: {
		//更新管理员信息
		async getUserInfo({state, commit}){
			const res = await request('admin', 'get', {}, {
				showLoading: false
			});
			console.log(res);
			if(res.status === 1){
				const userInfo = res.data;
				commit('setStateAttr', {
					key: 'userInfo',
					val: userInfo
				})
				router.replace({
					name: 'index'
				});
			}
		}
	}
}
