'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const $ = db.command.aggregate;

const userDb = db.collection('mix-uni-id-users');

const modal = {
	/**
	 * 获取用户列表
	 * @param {Object} request
	 * @param {Number} offset 
	 * @param {Number} limit 
	 * @param {String} mobile 
	 * @param {String} nickname 
	 * @param {Object} orderBy 排序
	 */
	async getList(request, ext){
		const {offset, limit, mobile, nickname} = request;
		const map = {};
		if(mobile) map.username = new RegExp(mobile)
		if(nickname) map.nickname = new RegExp(nickname)
		
		const res = await userDb.aggregate()
			.match(map)
			.sort({
				...request.orderBy,
				register_date: -1
			})
			.skip(offset)
			.limit(limit)
			.lookup({
				from: "mix-order",
				localField: "_id",
				foreignField: "uid",
				as: 'order'
			})
			.end();
		const countData = await userDb.count();
		res.affectedDocs = countData.total;
		return res;
	},
	/**
	 * 管理员充值到用户余额
	 * @param {Object} request
	 * @param {String} request.uid
	 * @param {String} request.money
	 */
	async userRecharge(request, ext){
		const {uid, money} = request;
		if(money > 9999){
			return {
				status: 0,
				msg: '最高充值金额为99999'
			}
		}
		const transaction = await db.startTransaction();
		const res = await transaction.collection('mix-uni-id-users')
			.doc(uid)
			.update({
				money: dbCmd.inc(+money)
			})
		if(res.updated !== 1){
			await transaction.rollback()
			return {
				status: 0,
				msg: '余额修改失败'
			}
		}
		const userData = await db.collection('mix-uni-id-users').doc(uid).get();
		//记录流水
		const logRes = await transaction.collection('mix-money-log').add({
			uid,
			title: '充值-管理员充值',
			type: 'recharge',
			add_time: + new Date,
			money,
			username: userData.data[0].username,
			pay_type: 'admin'
		})
		if(logRes.id){
			await transaction.commit()
			return {
				status: 1,
				msg: '充值成功'
			}
		}else{
			await transaction.rollback()
			return {
				status: 0,
				msg: '资金记录添加失败'
			}
		}
	},
	/**
	 * 封禁 解封用户
	 * @param {Object} request
	 * @param {String} request.uid
	 * @param {Number} request.status
	 */
	async changeStatus(request, ext){
		const res = await userDb.where({
			_id: request.uid
		}).update({
			status: request.status
		})
		return res.updated == 1 ? {
			status: 1
		}: {
			status: 0
		}
	}
	
	
	
	
	
}

module.exports = modal;