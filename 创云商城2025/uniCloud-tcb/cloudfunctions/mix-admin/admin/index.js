'use strict';

const uniID = require('uni-id-admin');

const db = uniCloud.database();
const dbCmd = db.command;
const $ = db.command.aggregate;


const modal = {
	/**
	 * 管理员登录
	 * @param {Object} request
	 * @param {String} request.username
	 * @param {String} request.password
	 */
	async login(request) {
		const {username, password} = request;
		const res = await uniID.login({
			username,
			password
		})
		return res.code === 0 ? {
			status: 1,
			...res
		}: {
			status: 0,
			...res
		}
	},
	/**
	 * 获取管理员信息
	 */
	async get(request, ext){
		const data = ext.adminInfo;
		
		const roles = await db.collection('mix-roles').where({
			_id: data.role_id
		}).get();
		
		data.access = roles.data[0].node;
		data.access_name = roles.data[0].name;
		
		return {
			status: 1,
			data
		}
	},
	/**
	 * 修改密码
	 * @param {Object} request
	 * @param {String} request.oldPassword
	 * @param {String} request.newPassword
	 * @param {String} request.passwordConfirmation
	 */
	async resetPassword(request, ext){
		const {
			oldPassword,
			newPassword,
			passwordConfirmation
		} = request;
		const res = await uniID.updatePwd({
			uid: ext.adminId,
			oldPassword,
			newPassword,
			passwordConfirmation
		})
		return res.code === 0 ? {
			status: 1,
			msg: '密码修改成功，请重新登录'
		}:{
			status: 0,
			...res,
			ext
		}
	},
	/**
	 * 退出登录
	 * @param {Object} request
	 * @param {Object} ext
	 */
	async logout(request, ext){
		if(!ext.token){
			return {
				status: 1
			}
		}
		const res = await uniID.logout(ext.token)
		return {
			status: 1,
			...res
		}
	},
	/**
	 * 获取管理员列表
	 * @param {Object} request
	 */
	async getList(){
		const res = await db.collection('mix-admin').aggregate()
			.lookup({
				from: "mix-roles",
				localField: "role_id",
				foreignField: "_id",
				as: 'roles'
			})
			.end();
	
		return res
	},
	/**
	 * 禁用管理员
	 */
	async setAdminStatus(request){
		const res = await db.collection('mix-admin')
			.doc(request.id)
			.update({
				status: request.status
			})
		return res.updated === 1 ? {
			status: 1,
			msg: '修改成功'
		} : {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 添加管理员
	 * @param {Object} request
	 */
	async addAdmin(request){
		const {
			username,
			password,
			role_id,
			branch_id
		} = request;
		const res = await uniID.register({
			username,
			password,
			role_id,
			branch_id,
			status: 0
		})
		return res.code === 0 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '添加失败'
		}
	},
	/**
	 * 修改管理员分组
	 * @param {Object} request
	 */
	async updateAdmin(request){
		const {
			_id,
			role_id
		} = request;
		const res= await db.collection('mix-admin').doc(_id).update({
			role_id,
			update_time: + new Date(),
		});
		return res.updated === 1 ? {
			status: 1,
			msg: '修改成功'
		} : {
			status: 0,
			res,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 删除管理员
	 * @param {Object} request
	 * id
	 */
	async deleteAdmin(request){
		const res= await db.collection('mix-admin').doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	
	/**
	 * 获取管理员分组列表
	 * @param {Object} request
	 */
	async getRoles(){
		const res = await db.collection('mix-roles').get();
		return res
	},
	/**
	 * 新增管理员分组
	 * @param {Object} request
	 */
	async addRoles(request){
		const res= await db.collection('mix-roles').add(request);
		return res.id ? {
			status: 1,
			msg: '添加成功'
		}: {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 修改分组
	 * @param {Object} request
	 */
	async updateRoles(request){
		const data = {
			...request,
			update_time: + new Date(),
		} 
		const id = request._id;
		delete data._id;
		const res= await db.collection('mix-roles').doc(id).update(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '修改成功'
		} : {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 删除分组
	 * @param {Object} request
	 * id
	 */
	async deleteRoles(request){
		if(request.id === '5ec1f715f8eeb6004dc291f6'){
			return {
				status: 0,
				msg: '不能删除超级管理员'
			}
		}
		const res= await db.collection('mix-roles').doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
}

module.exports = modal;
