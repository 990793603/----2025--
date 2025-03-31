'use strict';

const uniID = require('uni-id-admin');

const modules = {
	dataCenter: require('./data-center'),
	user: require('./user'),
	admin: require('./admin'),
	product: require('./product'),
	order: require('./order'),
	advert: require('./advert'),
	article: require('./article'),
	notice: require('./notice'),
	money: require('./money'),
	rating: require('./rating'),
	feedback: require('./feedback'),
	coupon: require('./coupon'),
	fullReduction: require('./full-reduction'),
	version: require('./version'),
	express: require('./express'),
	refundAddress: require('./refund-address'),
}

exports.main = async (event, context) => {
	const {
		module, 
		operation, 
		data, 
		token
	} = event;
	const ext = {
		token
	}
	if(operation !== 'login'){
		const payload = await uniID.checkToken(token);
		if (payload.code !== 0) {
			return {
				op: 'token 检查失败',
				token,
				...payload
			}
		}
		ext.adminId = payload.uid;
		ext.adminInfo = payload.userInfo;
		
		if(ext.adminInfo.username === 'test' && !checkTestRoles({
			adminInfo: ext.adminInfo, 
			module,
			operation
		})){
			return {
				status: 0,
				msg: '权限不足'
			}
		}
	}
	return modules[module][operation](data, ext);
};

const checkTestRoles = params=>{
	const {
		adminInfo,
		module,
		operation
	} = params;
	const roles = [{
		module: 'admin',
		operations: ['get', 'login', 'logout', 'getList', 'getRoles']
	},{
		module: 'advert',
		operations: ['getList']
	},{
		module: 'article',
		operations: ['getList', 'getCategoryList']
	},{
		module: 'dataCenter',
		operations: ['getTotalStat', 'getOrderStat', 'getUserRank', 'getProductRank', 'getProductCategoryRank']
	},{
		module: 'feedback',
		operations: ['get']
	},{
		module: 'money',
		operations: ['getLogList']
	},{
		module: 'notice',
		operations: ['getList']
	},{
		module: 'order',
		operations: ['getList', 'getExpressComp', 'deliveryOrder', 'getExpressInfo']
	},{
		module: 'product',
		operations: ['getList', 'getCategoryList', 'getCategoryTreeList']
	},{
		module: 'rating',
		operations: ['get']
	},{
		module: 'user',
		operations: ['getList', 'userRecharge']
	},{
		module: 'express',
		operations: ['getList']
	},{
		module: 'coupon',
		operations: ['getList']
	},{
		module: 'version',
		operations: ['getList']
	}]
	const curGroupRoles = roles.filter(role=> role.module === module);
	//未找到对应
	if(curGroupRoles.length === 0){
		return false;
	}
	const groupRule = curGroupRoles[0];
	if(groupRule.operations.includes(operation)){
		return true;
	}else{
		return false;
	}
}
