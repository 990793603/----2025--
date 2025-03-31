'use strict';
/**
 * 订单
 */
const uniID = require('uni-id');
const modules = {
	order: require('./order'),
	payment: require('./payment'),
}

exports.main = async (event, context) => {
	if(context.PLATFORM === 'app'){
		context.PLATFORM === 'app-plus';
	}
	const {module, operation, data, uniIdToken} = event;
	
	//token检查
	const payload = await uniID.checkToken(uniIdToken);
	if (payload.code && payload.code > 0) {
		return {
			op: 'token 检查失败',
			...payload
		}
	}
	const ext = {
		event,
		context,
		uid: payload.uid,
		payload
	}
	
	return modules[module][operation](data, ext);
};