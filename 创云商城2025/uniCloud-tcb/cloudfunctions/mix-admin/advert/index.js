'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const advertDb = db.collection('mix-advert');

const modal = {
	/**
	 * 新增
	 * @param {Object} request
	 */
	async addAdvert(request){
		const data = Object.assign({
			add_time: + new Date()
		}, request);
		const res= await advertDb.add(data);
		return res.id ? {
			status: 1,
			msg: '添加成功'
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 删除
	 * @param {Object} request
	 * id
	 */
	async deleteAdvert(request){
		const res= await advertDb.doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 修改
	 * @param {Object} request
	 */
	async updateAdvert(request){
		const id = request._id;
		delete request._id;
		const data = {
			...request,
			update_time: + new Date()
		}
		const res= await advertDb.doc(id).update(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '修改成功'
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 获取列表
	 * @param {Object} request
	 * type 类型
	 */
	async getList(request){
		const res= await advertDb
			.where({
				type: request.type
			})
			.get();;
		return res;
	},
	/**
	 * 启用 | 禁用
	 * @param {Object} request
	 * id
	 * status 0|1
	 */
	async setStatus(request){
		const res = await advertDb.doc(request.id).update({
			status: + request.status
		});
		return res;
	}
}

module.exports = modal;