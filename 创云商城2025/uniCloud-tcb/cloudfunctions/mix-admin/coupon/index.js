'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const couponDb = db.collection('mix-coupon');

const modal = {
	/**
	 * 获取列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 */
	async getList(request, ext){
		const {
			offset,
			limit
		} = request;
		const res = await couponDb
			.orderBy('add_time', 'desc')
			.skip(offset)
			.limit(limit)
			.get();
		
		const countData = await couponDb.count();
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
			remain_number: request.number,
			...request
		}
		const res= await couponDb.add(data);
		return res.id ? {
			status: 1,
			msg: '添加成功'
		}: {
			status: 0,
			msg: '添加失败'
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
		}
		const id = request._id;
		delete data._id;
		const res= await couponDb.doc(id).set(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '修改成功'
		} : {
			status: 0,
			msg: '修改失败'
		}
	},
	/**
	 * 删除
	 * @param {Object} request
	 * @param {String} request.id
	 */
	async remove(request){
		const res= await couponDb.doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '删除失败'
		}
	},
	/**
	 * 启用|禁用
	 * @param {Object} request
	 * id
	 * status 0|1
	 */
	async setStatus(request){
		const res = await couponDb.doc(request.id).update({
			status: + request.status
		});
		return res;
	}
}

module.exports = modal;