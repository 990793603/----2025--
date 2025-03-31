import store from '@/store'
import app from '@/main'

let loading = null;

/**
 * uniCloud请求
 * @param {String} module 模块名
 * @param {String} operation 调用方法
 * @param {Object} data 请求参数
 * @param {Object} ext 附加参数
 * @return {Object}
 */
export default function(module, operation, data={}, ext={}){
	return new Promise((resolve, reject) => {
		loading && loading.close();
		//显示loading
		if(ext.showLoading !== false){
			loading = this.$loading({
				background: 'rgba(0,0,0,0)',
				fullscreen: false
			});
		}
		const token = uni.getStorageSync('uniIdTokenAdmin');
		uniCloud.callFunction({
			name: 'mix-admin',
			data: {
				module,
				operation,
				token,
				data
			}
		}).then(res=>{
			loading && loading.close();
			
			const code = res.result.code;
			//token无效
			if(code === 30201 || code === 30202 || code === 30203 || code === 30204){
				store.commit('logout');
				app.$router.push({
					name: 'login'
				});
				reject('无效的登录信息');
				return;
			}else if(code === 10001){
				this.$message.error('帐号已被禁用');
				store.commit('logout');
				app.$router.push({
					name: 'login'
				});
				reject('用户被禁用');
				return;
			}
			resolve(res.result);
		}).catch((err) => {
			loading && loading.close();
			console.error(err)
		})
	});
}