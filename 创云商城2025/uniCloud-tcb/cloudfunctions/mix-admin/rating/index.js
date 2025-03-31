'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const modal = {
	/**
	 * 获取评价列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 * @param {String} request.content 评价内容
	 * @param {String} request.reply 回复内容
	 * @param {Number} request.rating 星级
	 * @param {Boolean} request.hasImage 有图
	 * @param {Boolean} request.hasContent 有内容
	 */
	async get(request){
		const {offset, limit, content, reply, rating, hasImage, hasContent} = request;
		const map = {}
		if(content) map.content = new RegExp(content);
		if(reply) map.reply = new RegExp(reply);
		if(rating) map.rating = rating;
		if(hasImage) map.imageSize = dbCmd.gt(0);
		if(hasContent) map.content = dbCmd.neq('买家未填写评价内容');
		
		const $ = db.command.aggregate
		const res = await db.collection('mix-rating').aggregate()
			.addFields({
				imageSize: $.size('$images')
			})
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
			.lookup({
				from: "mix-product",
				localField: "product_id",
				foreignField: "_id",
				as: 'product'
			})
			.unwind('$product')
			.end();
			
		const countData = await db.collection('mix-rating').where(map).count();
		res.affectedDocs = countData.total;
		res.map = map
		return res;
	},
	/**
	 * 禁用评价
	 * @param {Object} request
	 * @param {String} request.id
	 * @param {Number} request.is_disabled
	 */
	async setDisabled(request){
		const res = await db.collection('mix-rating').doc(request.id).update({
			is_disabled: request.is_disabled
		})
		return res;
	},
	/**
	 * 回复评价
	 * @param {Object} request
	 * @param {String} request.id
	 * @param {Number} request.reply
	 */
	async reply(request){
		const res = await db.collection('mix-rating').doc(request.id).update({
			reply: request.reply
		})
		return res.updated == 1 ? {
			status: 1
		}: {
			status: 0,
			msg: '回复失败，请稍候再试'
		}
	}
}

module.exports = modal;