'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const $ = db.command.aggregate;

const modal = {
	/**
	 * 获取资金记录
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 * @param {String} request.username 用户名
	 * @param {String} request.payType 支付类型
	 * @param {String} request.type 类型
	 */
	async getLogList(request, ext){
		const {offset, limit, username, payType, type} = request;
		const map = {}
		
		if(payType) map.pay_type = new RegExp(payType);
		if(type) map.type = type;
		if(username){
			const mapUser = await db.collection('mix-uni-id-users').where({
				username
			}).limit(1).get();
			console.log(mapUser);
			if(mapUser.data.length === 1){
				map.uid = new RegExp(mapUser.data[0]._id);
			}
		}
		const res = await db.collection('mix-money-log').aggregate()
			.match(map)
			.sort({
				add_time: -1
			})
			.skip(offset)
			.limit(limit)
			.lookup({
				from: "mix-uni-id-users",
				localField: "uid",
				foreignField: "_id",
				as: 'user'
			})
			.end();
		const countData = await db.collection('mix-money-log').where(map).count();
		res.affectedDocs = countData.total;
		res.data.forEach(item=> {
			item.user = item.user.length > 0 ? item.user[0] : {};
		})
		return res;
	},
	
	
	
}

module.exports = modal;