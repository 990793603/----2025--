/**
 * 版本管理模块
 */
'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const versionDb = db.collection('mix-version');


const modal = {
	/**
	 * 获取列表
	 */
	/**
	 * 获取列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit 
	 */
	async getList(request){
		const {offset, limit} = request;
		const res = await versionDb
			.skip(offset)
			.limit(limit)
			.orderBy('add_time', 'desc')
			.get()
		
		const countData = await versionDb.count();
		res.affectedDocs = countData.total;
		return res;
	},
	/**
	 * 删除
	 * @param {Object} request
	 * id
	 */
	async remove(request){
		const res= await versionDb.doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 新增
	 * @param {Object} request
	 */
	async add(request){
		const data = Object.assign({
			add_time: + new Date()
		}, request);
		const res= await versionDb.add(data);
		return res.id ? {
			status: 1,
			msg: '添加成功'
		}: {
			status: 0,
			msg: '服务器内部错误'
		}
	}
}

module.exports = modal;