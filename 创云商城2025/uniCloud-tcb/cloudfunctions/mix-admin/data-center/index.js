'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const $ = db.command.aggregate;

const modal = {
	/**
	 * 数据统计 待办事项
	 */
	async getTotalStat(){
		//总支付金额
		const saleData = await db.collection('mix-order')
			.aggregate()
			.match({
				pay_status: 1
			})
			.group({
				_id: null,
				total: $.sum('$price_data.pay_price')
			})
			.end()
		const userCount = await db.collection('mix-uni-id-users').count();
		const payOrderCount = await db.collection('mix-order').where({
			pay_status: 1
		}).count();
		const finishedOrderCount = await db.collection('mix-order').where({
			status: dbCmd.in([3,4])
		}).count();
		const deliverOrderCount = await db.collection('mix-order').where({
			status: 1
		}).count();
		const withdrawCount = await db.collection('mix-withdraw').where({
			status: 0
		}).count();
		const stockCount = await db.collection('mix-product').where({
			stock: dbCmd.lt(100)
		}).count();
		const feedbackCount = await db.collection('mix-feedback').where({
			status: 0
		}).count();
		
		return {
			saleTotal: saleData.data.length > 0 ? -saleData.data[0].total : 0,
			userCount: userCount.total,
			payOrderCount: payOrderCount.total,
			finishedOrderCount: finishedOrderCount.total,
			deliverOrderCount: deliverOrderCount.total,
			withdrawCount: withdrawCount.total,
			stockCount: stockCount.total,
			feedbackCount: feedbackCount.total
		}
	},
	/**
	 * 订单统计
	 * @param {Object} request
	 * @param {Number} request.dateType 1近一月 2近一周 3近24小时
	 */
	async getOrderStat(request, ext){
		const dateType = request.dateType || 1;
		const nowDate = + new Date();
		let startTimestamp = 0;
		let step = 0;
		switch(dateType){
			case 1:
				startTimestamp = nowDate - 30*24*60*60*1000;
				startTimestamp = startTimestamp - startTimestamp % (24*60*60*1000);
				step = 24*60*60*1000;
				break;
			case 2:
				startTimestamp = nowDate - 7*24*60*60*1000;
				startTimestamp = startTimestamp - startTimestamp % (24*60*60*1000);
				startTimestamp += 24*60*60*1000
				step = 24*60*60*1000;
				break;
			case 3:
				startTimestamp = nowDate - 24*60*60*1000;
				startTimestamp = startTimestamp - startTimestamp % (60*60*1000);
				step = 60*60*1000;
				break;
		}
		const map = {
			status: dbCmd.in([1,2,3,4,11]),
			add_time: dbCmd.gt(startTimestamp)
		}
		const res = await db.collection('mix-order').where(map).field({
			price_data: true,
			add_time: true,
			status: true
		}).get();
		
		const orderList = res.data;
		const dateList = [];
		for(let i=startTimestamp; i<=nowDate; i+=step){
			//支付金额
			let payArr = orderList.filter(item=>item.add_time >= i && item.add_time < i+step).map(item=> item.price_data.pay_price);
			//完成金额
			let finishArr = orderList.filter(item=>item.add_time >= i && item.add_time < i+step && (item.status==3||item.status==4)).map(item=> item.price_data.pay_price);
			dateList.push({
				timestamp: i,
				pay_price: payArr.length > 0 ? +payArr.reduce((a,b)=> a+b).toFixed(2) : 0,
				finish_price: finishArr.length > 0 ? +finishArr.reduce((a,b)=> a+b).toFixed(2) : 0,
			})
		}
		return dateList;
	},
	/**
	 * 获取用户活跃度列表 热搜关键字列表
	 */
	async getUserRank(request, ext){
		const userData = await db.collection('mix-uni-id-users')
			.where({
				is_disabled: dbCmd.neq(1)
			})
			.field({
				avatar: true,
				nickname: true,
				username: true,
				gender: true,
				consumption: true
			})
			.orderBy('consumption', 'desc')
			.orderBy('register_date', 'asc')
			.limit(10)
			.get();
		const keywordData = await db.collection('mix-search-keyword')
			.orderBy('count', 'desc')
			.limit(10)
			.get();
		
		return {
			userList: userData.data,
			keywordList: keywordData.data
		};
	},
	/**
	 * 获取热销商品列表
	 */
	async getProductRank(request, ext){
		const res = await db.collection('mix-product')
			.where({
				is_del: dbCmd.neq(1)
			})
			.orderBy('sales', 'desc')
			.orderBy('look_num', 'desc')
			.limit(10)
			.get();
		return res.data;
	},
	/**
	 * 获取分类销量占比
	 */
	async getProductCategoryRank(request, ext){
		const map = {
			is_del: 0,
			
		};
		const res = await db.collection('mix-product').aggregate()
			.match(map)
			.group({
				_id: '$first_cate_id',
				num: $.sum('$sales')
			})
			.lookup({
				from: "mix-product-category",
				localField: "_id",
				foreignField: "_id",
				as: 'category'
			})
			.unwind('$category')
			.project({
				num: 1,
				cateName: '$category.name'
			})
			.end();
		return res.data;
	},
	
	
	
	
}

module.exports = modal;