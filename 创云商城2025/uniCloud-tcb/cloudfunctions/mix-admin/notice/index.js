'use strict';
/**
 * 公告
 */
const db = uniCloud.database();
const dbCmd = db.command;

const noticeDb = db.collection('mix-notice');

const modal = {
	/**
	 * 获取列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit 
	 */
	async getList(request){
		const {offset, limit} = request;
		const res = await noticeDb
			.skip(offset)
			.limit(limit)
			.orderBy('add_time', 'desc')
			.get()
		
		const countData = await noticeDb.count();
		res.affectedDocs = countData.total;
		return res;
	},
	/**
	 * 新增
	 * @param {Object} request
	 */
	async add(request){
		const data = {
			add_time: + new Date(),
			...request
		};
		const res= await noticeDb.add(data);
		return res.id ? {
			status: 1,
			msg: '添加成功'
		}: {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 修改
	 * @param {Object} request
	 */
	async update(request){
		const data = {
			update_time: + new Date(),
			...request
		};
		const id = request._id;
		delete data._id;
		const res= await noticeDb.doc(id).update(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '修改成功'
		} : {
			status: 0,
			msg: '修改失败，请稍候重试'
		}
	},
	/**
	 * 启用|禁用
	 * @param {Object} request
	 * id
	 * status 0|1
	 */
	async setStatus(request){
		const res = await noticeDb.doc(request.id).update({
			status: + request.status
		});
		return res;
	},
	/**
	 * 删除
	 * @param {Object} request
	 * id
	 */
	async remove(request){
		const res= await noticeDb.doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '删除失败'
		}
	},
	
}

module.exports = modal;