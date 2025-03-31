'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const modal = {
	/**
	 * 获取反馈列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 */
	async get(request){
		const {offset, limit} = request;
		const map = {}
		
		const $ = db.command.aggregate
		const res = await db.collection('mix-feedback').aggregate()
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
			.unwind('$user')
			.end();
			
		const countData = await db.collection('mix-feedback').where(map).count();
		res.affectedDocs = countData.total;
		res.map = map
		return res;
	},
	
}

module.exports = modal;