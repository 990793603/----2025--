/**
 * 收货地址管理模块
 * create by 尤涛 2020-07-05
 * qq 472045067
 */
'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const addrressDb = db.collection('mix-address');

const modal = {
	/**
	 * 新增地址
	 * @param {Object} request
	 */
	async add(request, ext){
		const data = {
			...request,
			uid: ext.uid,
			add_time: + new Date()
		}
		if(data.is_default){
			await addrressDb
				.where({
					uid: ext.uid,
					is_default: true
				})
				.update({
					is_default: false
				})
		}
		const res= await addrressDb.add(data);
		return res.id ? {
			status: 1,
			msg: '地址添加成功'
		}: {
			status: 0,
			msg: '地址添加失败，请稍候再试'
		}
	},
	/**
	 * 删除
	 * @param {Object} request
	 * @param {String} request.id
	 */
	async remove(request){
		const res= await addrressDb.doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1,
			msg: '地址删除成功'
		}: {
			status: 0,
			msg: '地址删除失败，请稍候再试'
		}
	},
	/**
	 * 修改
	 * @param {Object} request
	 */
	async update(request, ext){
		const id = request._id;
		delete request._id;
		const data = {
			...request,
			update_time: + new Date()
		}
		if(data.is_default){
			await addrressDb
				.where({
					uid: ext.uid,
					is_default: true
				})
				.update({
					is_default: false
				})
		}
		const res= await addrressDb.doc(id).set(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '地址修改成功'
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 获取列表
	 */
	async get(request, ext){
		const res= await addrressDb
			.where({
				uid: ext.uid
			})
			.orderBy('is_default', 'desc')
			.orderBy('add_time', 'desc')
			.get();
		return res;
	}
}

module.exports = modal;