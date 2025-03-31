'use strict';
/**
 * 用户管理模块
 * 
 */
const uniID = require('uni-id');
const modules = {
	user: require('./user'),
	distribution: require('./distribution')
}

exports.main = async (event, context) => {
	const {module, operation, data, uniIdToken} = event;
	
	const payload = await uniID.checkToken(uniIdToken);
	const ext = {
		event,
		context,
		uid: payload.uid,
		tokenCode: payload.code,
		payload
	}
	
	return modules[module][operation](data, ext);
};