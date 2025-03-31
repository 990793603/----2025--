/**
 * 订单
 * create by 尤涛 2020-07-16
 * qq 472045067
 */
'use strict';

const payment = require('../payment')
const crypto = require('crypto');
const {
	kuaidi100,
	commissionRate
} = require('config')

const orderStatus = [
	{status: 0, name: '待付款'},
	{status: 1, name: '待发货'},
	{status: 2, name: '待收货'},
	{status: 3, name: '待评价'},
	{status: 4, name: '已完成'},
	{status: 10, name: '已关闭'}, //未付款取消订单
	{status: 11, name: '已取消'}, //已付款取消订单
	{status: 12, name: '申请退货'},
	{status: 13, name: '拒绝退货'}, //拒绝退货后订单完成
	{status: 14, name: '正在退货'},//同意退货后买家寄回商品
	{status: 15, name: '退货完成'}, //订单退货退款后完成
	{status: 16, name: '拒绝退款'} //订单退货后拒绝退款
]

const db = uniCloud.database();
const dbCmd = db.command;

const orderDb = db.collection('mix-order');

/**
 * 处理购物车商品规格 检查商品状态
 * @param {Array} cartList 购物车数组
 * @return {Array} 用于渲染的数组
 */
const renderCartList = async cartList=>{
	const list = [];
	const skuRes = await db.collection('mix-sku').where({
		_id: dbCmd.in(cartList.map(item=> item.sku._id))
	}).get();
	const skuList = skuRes.data;
	for(let item of cartList){
		const product = item.product;
		let newCurSku = {};
		let invalid = false;
		//检查商品状态
		if(product.is_del === 1 || product.is_sales !== 1){
			invalid = '商品已下架'; //已下架或删除
		}else if(!skuList.some(sku=> sku.product_id === item.product_id)){
			invalid = '商品已更新'; //规则不存在
		}else{
			newCurSku = skuList.filter(sku=> sku.product_id === item.product_id)[0];
			if(newCurSku.stock < item.number){
				invalid = '库存不足';
			}
		}
		list.push({
			...item,
			checked: !!item.checked,
			title: product.title,
			image: product.thumb,
			price: item.sku.price || product.price,
			stock: newCurSku.stock,
			invalid
		});
	}
	return list;
}
/**
 * 获取用户默认收货地址
 * @param {String} uid 用户id
 * @return {Object} 地址
 */
const getDefaultAddress = async uid=>{
	const res = await db.collection('mix-address')
		.where({
			uid,
			is_default: true
		})
		.limit(1).get();
	return res.data.length > 0 ? res.data[0] : {};
}
/**
 * 订单号生成 20位
 * @return {String} 订单号
 */
const createOrderNumber = ()=>{
	let random_no = date('Ymd', +new Date());
	for (let i = 0; i < 12; i++){
		random_no += Math.floor(Math.random() * 10);
	}
	return random_no;
}
/**
 * 格式化时间戳 Y-m-d H:i:s
 * @param {String} format Y-m-d H:i:s
 * @param {Number} timestamp 时间戳   
 * @return {String}
 */
const date = (format, timeStamp) => {
	if('' + timeStamp.length <= 10){
		timeStamp = + timeStamp * 1000;
	}else{
		timeStamp = + timeStamp;
	}
	let _date = new Date(timeStamp),
		Y = _date.getFullYear(),
		m = _date.getMonth() + 1,
		d = _date.getDate(),
		H = _date.getHours(),
		i = _date.getMinutes(),
		s = _date.getSeconds();
	
	m = m < 10 ? '0' + m : m;
	d = d < 10 ? '0' + d : d;
	H = H < 10 ? '0' + H : H;
	i = i < 10 ? '0' + i : i;
	s = s < 10 ? '0' + s : s;

	return format.replace(/[YmdHis]/g, key=>{
		return {Y,m,d,H,i,s}[key];
	});
}

/**
 * 结算页获取可用优惠券
 * @param {Number} money 订单实际金额
 * @param {String} uid
 */
const getUserCoupons = async (money, uid) => {
	//去掉满减
	const full_reduction_money = await getFullReductionMoney(money);
	money -= full_reduction_money;
	const nowTime = + new Date();
	const res = await db.collection('mix-user-coupon')
		.where({
			uid,
			total_money: dbCmd.lte(money),
			coupon_money: dbCmd.lte(money),
			start_time: dbCmd.lte(nowTime),
			end_time: dbCmd.gt(nowTime),
			is_use: dbCmd.neq(1)
		})
		.get();
	return res.data;
}
/**
 * 获取订单最高满减金额
 */
const getFullReductionMoney = async (goods_price) => {
	const fullReductData = await db.collection('mix-full-reduction')
		.where({
			status: 1,
			total_money: dbCmd.lte(goods_price)
		})
		.orderBy('coupon_money', 'desc')
		.limit(1)
		.get();
	return fullReductData.data.length === 1 ?  fullReductData.data[0].coupon_money : 0;
}

const modal = {
	/**
	 * 创建订单 立即购买
	 * @param {Object} request
	 * @param {String} request.source_type 客户端类型 1h5 2app 3微信小程序
	 * @param {Object} request.address 收货地址
	 * @param {String} request.remarks 订单备注
	 * @param {String} request.coupon_id 优惠券id
	 * @param {Array} request.product 商品信息
	 */
	async addBuyNow(request, ext) {
		const {
			source_type,
			address,
			remarks,
			coupon_id,
			product
		} = request;
		//检查商品合法性
		const skuData = await db.collection('mix-sku').doc(product.sku._id).get();
		if (skuData.data.length === 0) {
			return {
				status: 0,
				msg: '当前规格已下架'
			}
		}
		if (skuData.data[0].stock < product.number) {
			return {
				status: 0,
				msg: '库存不足'
			}
		}
		product.sku = skuData.data[0];
		product.price = product.sku.price;
		
		//订单实际价格
		const priceData = await this.getOrderPayPrice({
			goods_price: product.number * product.price,
			address_id: address._id,
			coupon_id
		});
		if(priceData.status === 0){
			return priceData;
		}
		const userData = await db.collection('mix-uni-id-users').doc(ext.uid).get();
		const data = {
			add_time: +new Date(),
			order_number: createOrderNumber(),
			uid: ext.uid,
			username: userData.data[0].username,
			source_type,
			address,
			remarks, //订单备注
			timeline: [{
				time: +new Date(),
				title: '订单提交成功',
				tip: '请及时支付订单，超时系统将自动取消',
				type: '创建订单'
			}],
			products: [product],
			price_data: priceData, //价格数据
			status: 0, //订单状态 0未支付
			status_tip: '请尽快支付订单，超时将自动取消',
			pay_status: 0, //支付状态 0未支付
		}
		//记录分销
		const inviter_uid_arr = ext.payload.userInfo.inviter_uid;
		if(inviter_uid_arr && inviter_uid_arr.length > 0){
			data.inviter_user_lv1 = inviter_uid_arr[0];
			data.inviter_user_lv2 = inviter_uid_arr[1];
			data.commission_lv1 = +parseFloat(priceData.pay_price * commissionRate.lv1 * 0.01).toFixed(2);
			data.commission_lv2 = +parseFloat(priceData.pay_price * commissionRate.lv2 * 0.01).toFixed(2);
		}
		//减少库存
		const reduceRes = await db.collection('mix-product')
			.where({
				_id: product._id, // 商品ID
				stock: dbCmd.gt(product.number) // 限制库存大于1的才允许扣除库存
			})
			.update({
				stock: dbCmd.inc(-product.number)
			})
		if(reduceRes.updated === 0){
			return {
				status: 0,
				msg: '商品库存不足'
			}
		}
		const reduceRes1 = await db.collection('mix-sku')
			.where({
				_id: product.sku._id, // 商品ID
				stock: dbCmd.gt(product.number) // 限制库存大于1的才允许扣除库存
			})
			.update({
				stock: dbCmd.inc(-product.number)
			})
		if(reduceRes1.updated === 0){
			return {
				status: 0,
				msg: '商品库存不足'
			}
		}
		const transaction = await db.startTransaction();
		//使用优惠券
		if(coupon_id){
			let couponRes = await transaction.collection('mix-user-coupon').doc(coupon_id).update({
				is_use: 1
			});
			if (couponRes.updated != 1){
				await transaction.rollback()
				return {
					status: 0,
					msg: '优惠券更新失败'
				}
			}
		}
		//创建订单
		const res = await transaction.collection('mix-order').add(data);
		if (res.id) {
			await transaction.commit()
			return {
				status: 1,
				msg: '订单创建成功',
				data: {
					pay_price: priceData.pay_price,
					order_id: res.id
				}
			}
		} else {
			await transaction.rollback();
			return {
				status: 0,
				msg: '订单创建失败',
			}
		}
	},
	/**
	 * 创建订单 购物车
	 * @param {Object} request
	 * @param {String} request.source_type 客户端类型 1h5 2app 3微信小程序
	 * @param {Object} request.address 收货地址
	 * @param {String} request.remarks 订单备注
	 * @param {String} request.coupon_id 优惠券id
	 * @param {Array} request.ids 购物车id数组(购物车结算时)
	 */
	async addByCart(request, ext) {
		const {
			source_type,
			address,
			remarks,
			coupon_id,
			ids
		} = request;
		//检查商品合法性
		const cartRes = await db.collection('mix-cart').aggregate()
			.match({
				_id: dbCmd.in(ids)
			})
			.lookup({
				from: "mix-product",
				localField: "product_id",
				foreignField: "_id",
				as: 'product'
			})
			.unwind('$product')
			.end();
		const cartList = await renderCartList(cartRes.data);
		const invalidIndex = cartList.findIndex(item => item.invalid);
		if (invalidIndex >= 0) {
			return {
				status: 0,
				msg: cartList[invalidIndex].title + (cartList[invalidIndex].invalid || ' 已失效')
			}
		}
		//订单商品
		const products = cartList.map(item => {
			return {
				title: item.title,
				image: item.image,
				number: item.number,
				price: item.price,
				sku: item.sku
			}
		})
		//订单实际价格
		let proTotal = 0;
		products.forEach(item => {
			proTotal += item.number * item.price;
		})
		const priceData = await this.getOrderPayPrice({
			goods_price: proTotal,
			address_id: address._id,
			coupon_id
		});
		if(priceData.status === 0){
			return priceData;
		}
		const userData = await db.collection('mix-uni-id-users').doc(ext.uid).get();
		const data = {
			add_time: +new Date(),
			order_number: createOrderNumber(),
			uid: ext.uid,
			username: userData.data[0].username,
			source_type,
			address,
			remarks, //订单备注
			timeline: [{
				time: +new Date(),
				title: '订单提交成功',
				tip: '请及时支付订单，超时系统将自动取消',
				type: '创建订单'
			}],
			products,
			price_data: priceData, //价格数据
			status: 0, //订单状态 0未支付
			status_tip: '请尽快支付订单，超时将自动取消',
			pay_status: 0, //支付状态 0未支付
		}
		//记录分销
		const inviter_uid_arr = ext.payload.userInfo.inviter_uid;
		if(inviter_uid_arr && inviter_uid_arr.length > 0){
			data.inviter_user_lv1 = inviter_uid_arr[0];
			data.inviter_user_lv2 = inviter_uid_arr[1];
			data.commission_lv1 = +parseFloat(priceData.pay_price * commissionRate.lv1 * 0.01).toFixed(2);
			data.commission_lv2 = +parseFloat(priceData.pay_price * commissionRate.lv2 * 0.01).toFixed(2);
		}
		const transaction = await db.startTransaction();
		//减少商品库存
		const stockRes = await this.handleStock({
			transaction,
			products: products.map(item => {
				return {
					_id: item.sku.product_id,
					sku_id: item.sku._id,
					inc: -item.number
				}
			})
		});
		if (!stockRes) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '库存更新失败，请稍候再试'
			}
		}
		//删除购物车
		const removeCart = await db.collection('mix-cart').where({
			_id: dbCmd.in(ids)
		}).remove()
		if (removeCart.deleted === 0) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '购物车清除失败'
			}
		}
		//使用优惠券
		if(coupon_id){
			let couponRes = await transaction.collection('mix-user-coupon').doc(coupon_id).update({
				is_use: 1
			});
			if (couponRes.updated != 1){
				await transaction.rollback()
				return {
					status: 0,
					msg: '优惠券更新失败'
				}
			}
		}
		//创建订单
		const res = await transaction.collection('mix-order').add(data);
		if (res.id) {
			await transaction.commit()
			return {
				status: 1,
				msg: '订单创建成功',
				data: {
					pay_price: priceData.pay_price,
					order_id: res.id
				}
			}
		} else {
			await transaction.rollback();
			return {
				status: 0,
				msg: '订单创建失败',
			}
		}
	},
	/**
	 * 计算订单实际支付价格
	 * @param {Object} request 
	 * @param {Number} request.goods_price 商品总价格
	 * @param {String} request.address_id 地址id
	 * @param {String} request.coupon_id 优惠券id  
	 * @param {String} request.full_reduction_money 订单满减金额
	 * @return {Number} 返回实际总价
	 */
	async getOrderPayPrice(request, ext) {
		const {
			goods_price,
			coupon_id
		} = request;
		let pay_price = 0;
		//商品价格
		pay_price += goods_price;
		//满立减
		const full_reduction_money = await getFullReductionMoney(goods_price);
		pay_price -= full_reduction_money;
		//优惠券
		let coupon_money = 0;
		if(coupon_id){
			const couponData = await db.collection('mix-user-coupon')
				.doc(coupon_id)
				.get();
			const coupon = couponData.data[0];
			if(coupon.end_time < + new Date() || coupon.is_use === 1){
				return {
					status: 0,
					msg: '优惠券已失效'
				}
			}
			if(pay_price < coupon.total_money){
				return {
					status: 0,
					msg: '订单不满足优惠券使用条件'
				}
			}
			coupon_money = coupon.coupon_money;
		}
		pay_price -= coupon_money;

		return {
			status: 1,
			coupon_id,
			coupon_money,
			full_reduction_money, //满减金额
			goods_price, //商品价格
			pay_price: +pay_price.toFixed(2), //实际支付价格
		};
	},
	/**
	 * 确认订单页 购物车结算获取数据
	 * @param {Object} request
	 * @param {String} request.ids 购物车id数组
	 */
	async getCartConfirmData(request, ext) {
		//获取购物车数据
		const cartRes = await db.collection('mix-cart').aggregate()
			.match({
				_id: dbCmd.in(request.ids)
			})
			.sort({
				add_time: -1
			})
			.lookup({
				from: "mix-product",
				localField: "product_id",
				foreignField: "_id",
				as: 'product'
			})
			.unwind('$product')
			.end();
		const products = await renderCartList(cartRes.data);
		let productTotal = 0;
		products.forEach(item=> {
			productTotal += item.sku.price * item.number;
			delete item.product;
		})
		//可用优惠券
		const coupons = await getUserCoupons(productTotal, ext.uid);
		//默认收货地址
		const address = await getDefaultAddress(ext.uid);
		return {
			data: {
				products,
				coupons: coupons || [],
				address,
			}
		}
	},
	/**
	 * 确认订单页 立即购买获取数据
	 * @param {Object} request
	 * @param {String} request.product_id
	 * @param {Object} request.sku
	 * @param {Number} request.number
	 */
	async getBuyNowConfirmData(request, ext) {
		const {
			product_id,
			sku,
			number
		} = request;
		const productData = await db.collection('mix-product').doc(product_id).get();
		const product = productData.data[0];
		
		const productTotal = sku.price * number;
		//可用优惠券
		const coupons = await getUserCoupons(productTotal, ext.uid);
		//默认收货地址
		const address = await getDefaultAddress(ext.uid);
		
		return {
			data: {
				products: [{
					_id: product._id,
					title: product.title,
					image: product.thumb,
					price: sku.price,
					number: number,
					sku
				}],
				coupons: coupons || [],
				address
			}
		}
	},
	/**
	 * 支付订单
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 * @param {String} request.pay_type 支付方式 balance | wxpay | alipay
	 * @param {String} request.pay_password //余额支付必须 
	 * @param {String} request.code 小程序code 小程序支付必须
	 */
	async payOrder(request, ext) {
		const {
			order_id,
			pay_type,
			pay_password,
			code
		} = request;
		const uid = ext.uid;
		//查询订单
		const orderData = await orderDb.doc(order_id).get();
		//查询用户信息
		const userData = await db.collection('mix-uni-id-users').doc(uid).get();
		if (orderData.data.length === 0 || userData.data.length === 0 || orderData.data[0].uid !== uid) {
			return {
				status: 0,
				msg: '订单或用户信息错误'
			}
		}
		const user = userData.data[0];
		const order = orderData.data[0];
		//验证订单状态
		if (order.status !== 0 && order.pay_status !== 0) {
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		await orderDb.doc(order_id)
			.update({
				pay_type
			})
		const pay_price = order.price_data.pay_price;
		const res = await payment.pay({
			user,
			pay_type,
			pay_password,
			code,
			order,
			outTradeNo: order.order_number,
			totalFee: pay_price * 100,
			subject: '支付商品订单',
			body: '普通商品购买'
		}, ext)
		if (res.status === 0 || pay_type === 'wxpay' || pay_type === 'alipay' || pay_type === 'paypal') {
			return res;
		}
		//更新订单信息
		const timeline = order.timeline;
		timeline.unshift({
			time: +new Date(),
			title: '订单支付成功',
			type: '支付订单'
		})
		const updateOrderRes = await orderDb.doc(order._id)
			.update({
				pay_type: 'balance',
				pay_status: 1,
				status: 1,
				status_tip: '订单支付成功，商品正在出库',
				timeline
			})
		if (updateOrderRes.updated !== 1) {
			return {
				status: 0,
				msg: '订单更新失败'
			}
		}
		//记录用户流水
		await db.collection('mix-money-log').add({
			uid,
			title: '支付订单 ' + order.order_number,
			type: 'pay_order',
			add_time: +new Date,
			money: -pay_price,
			username: user.username,
			pay_type: 'balance'
		})
		//更新用户消费金额
		await db.collection('mix-uni-id-users').doc(uid).update({
			consumption: dbCmd.inc(pay_price)
		})
		return {
			status: 1,
			msg: '订单支付成功'
		}
	},
	/**
	 * 查询支付
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 */
	async queryOrderPayStatus(request, ext) {
		const orderData = await orderDb.doc(request.order_id).get();
		if(orderData.data.length === 0){
			return;
		}
		if(orderData.data[0].pay_status === 1){
			return;
		}
		const res = await payment.queryPayStatus({
			outTradeNo: orderData.data[0].order_number,
			provider: orderData.data[0].pay_type
		})
		if(res.tradeState !== 'SUCCESS'){
			return;
		}
		await orderDb.where({
			_id: request.order_id,
			pay_status: 0,
			status: 0
		}).update({
			pay_status: 1,
			status: 1,
			status_tip: '订单支付成功，商品正在出库'
		})
		return {
			status: 1
		}
	},
	/**
	 * 获取用户订单列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 * @param {Array} request.status 订单状态数组
	 */
	async getList(request, ext) {
		const map = {
			uid: ext.uid,
		}
		//状态筛选
		if (request.status) {
			map.status = dbCmd.in(request.status);
		}
		const res = await orderDb
			.where(map)
			.skip(request.offset)
			.limit(request.limit)
			.orderBy('add_time', 'desc')
			.get()

		res.data.forEach(item => {
			item.product_number = item.products.map(p => p.number).reduce((a, b) => a + b);
			item.status_text = orderStatus.filter(s => s.status === item.status)[0].name;
		})
		return res;
	},
	/**
	 * 获取用户订单数量
	 * @param {Object} request
	 */
	async getOrderCount(request, ext) {
		//尽量不用count count4个状态耗时更长
		const res = await orderDb
			.where({
				uid: ext.uid,
				status: dbCmd.in([0, 1, 2, 3])
			})
			.field({
				status: 1
			})
			.get()
		const data = res.data;
		return {
			c0: data.filter(item => item.status === 0).length,
			c1: data.filter(item => item.status === 1).length,
			c2: data.filter(item => item.status === 2).length,
			c3: data.filter(item => item.status === 3).length,
		}
	},
	/**
	 * 获取用户订单详情
	 * @param {Object} request
	 * @param {String} request.id
	 */
	async getDetail(request, ext) {
		const res = await orderDb
			.where({
				_id: request.id,
				uid: ext.uid
			})
			.limit(1)
			.get()

		if (res.data.length === 0) {
			return {
				status: 0
			}
		}
		const data = res.data[0];
		data.statusText = orderStatus.filter(s => s.status === data.status)[0].name;
		//判断是否返回物流
		if (data.shipper_code && data.logistic_code && !data.express_info) {
			const express = await this.getExpressInfo({
				order_id: data._id,
				shipper_code: data.shipper_code,
				logistic_code: data.logistic_code,
			}, ext);
			data.express_info = express.data;
		}

		return {
			status: 1,
			data
		}
	},
	/**
	 * 查询物流信息
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 * @param {String} request.shipper_code 快递公司代码
	 * @param {String} request.logistic_code 快递单号
	 * @param {String} request.phone 收件人或寄件人的手机号或固话（顺丰单号必填，也可以填写后四位，如果是固话，请不要上传分机号）
	 */
	async getExpressInfo(request, ext) {
		const {
			order_id,
			shipper_code,
			logistic_code,
			phone
		} = request;
		const expRes = await db.collection('mix-express')
			.where({
				code: shipper_code
			})
			.limit(1).get();
		const expressComp = expRes.data[0];
		const param = {
			'com': shipper_code, //快递公司编码
			'num': logistic_code, //快递单号
			'from': '', //出发地城市
			'phone': phone || '', //手机号
			'to': '', //目的地城市
			'resultv2': '0', //开启行政区域解析
			'show': '0',
			'order': 'desc'
		}
		const {
			customer,
			key
		} = kuaidi100;
		let url = 'http://poll.kuaidi100.com/poll/query.do';
		url += '?customer=' + customer;
		url += '&sign=' + crypto.createHash('md5').update(JSON.stringify(param) + key + customer).digest("hex").toUpperCase();
		url += '&param=' + JSON.stringify(param);

		const res = await uniCloud.httpclient.request(url, {
			method: 'POST',
			dataType: 'json'
		})
		//若已签收，将物流信息存入订单表，节省三方平台流量费用
		if (res.data.state == 3) {
			await orderDb.doc(order_id).update({
				express_info: {
					name: expressComp.name,
					logo: expressComp.logo,
					phone: expressComp.phone,
					...res.data
				}
			})
		}
		return res.data.status === '200' && res.data.message === 'ok' ? {
			status: 1,
			data: {
				name: expressComp.name,
				logo: expressComp.logo,
				phone: expressComp.phone,
				...res.data
			}
		} : {
			status: 0,
			msg: res.data.message || '物流信息查询失败',
			url,
			data: res.data
		}
	},
	/**
	 * 取消订单
	 * @param {Object} request
	 * @param {String} request.id
	 */
	async cancelOrder(request, ext) {
		const orderRes = await orderDb.doc(request.id).get();
		if (orderRes.data.length === 0) {
			return {
				status: 0,
				msg: '订单不存在'
			}
		}
		const order = orderRes.data[0];
		if (order.status !== 0) {
			return {
				status: 0,
				msg: '不能取消已支付订单'
			}
		}
		const timeline = order.timeline;
		timeline.unshift({
			time: +new Date(),
			title: '订单已取消',
			tip: '用户主动取消订单',
			type: '取消订单'
		})

		const transaction = await db.startTransaction();
		//返还商品库存
		let res = await this.handleStock({
			transaction,
			products: order.products.map(item => {
				return {
					_id: item.sku.product_id,
					sku_id: item.sku._id,
					inc: item.number
				}
			})
		});
		if (!res) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '库存更新失败，请稍候再试'
			}
		}
		//返还优惠券
		if(order.price_data.coupon_id){
			res = await transaction.collection('mix-user-coupon').doc(order.price_data.coupon_id).update({
				is_use: 0
			})
			if(res.updated != 1){
				await transaction.rollback()
				return {
					status: 0,
					msg: '优惠券返还失败'
				}
			}
		}
		
		res = await transaction.collection('mix-order')
			.doc(request.id)
			.update({
				status: 10,
				status_tip: '',
				timeline
			})
		if (res.updated === 1) {
			await transaction.commit()
			return {
				status: 1,
				msg: '订单已取消'
			}
		} else {
			await transaction.rollback()
			return {
				status: 0,
				msg: '订单取消失败'
			}
		}
	},
	/**
	 * 删除订单
	 * @param {Object} request
	 * @param {String} request.id
	 */
	async remove(request, ext) {
		const orderRes = await orderDb.doc(request.id).get()
		if (orderRes.data.length === 0) {
			return {
				status: 0,
				msg: '订单不存在'
			}
		}
		const order = orderRes.data[0];
		//已完成 已关闭 已取消 退货完成可删除
		if (order.status !== 4 && order.status !== 10 && order.status !== 11 && order.status !== 14) {
			return {
				status: 0,
				msg: '订单状态不允许删除'
			}
		}
		const res = await orderDb
			.where({
				_id: request.id,
				uid: ext.uid
			})
			.remove()

		return res.deleted === 1 ? {
			status: 1,
			msg: '订单已删除'
		} : {
			status: 0,
			msg: '订单删除失败'
		}
	},
	/**
	 * 申请退货
	 * @param {Object} request
	 * @param {String} request.id
	 * @param {String} request.refund_product_reason 退款原因
	 * @param {String} request.refund_product_images 退款图片
	 */
	async refundProduct(request, ext) {
		const orderRes = await orderDb.doc(request.id).get();
		if (orderRes.data.length === 0) {
			return {
				status: 0,
				msg: '订单不存在'
			}
		}
		const order = orderRes.data[0];
		//已收货或已评价可申请退货
		if (order.status !== 2) {
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		//更新订单信息
		const timeline = order.timeline;
		timeline.unshift({
			time: +new Date(),
			title: '申请退货',
			tip: '您的退货申请已提交，请等待管理员审核..',
			type: '申请退货'
		})
		const outRefundNo = createOrderNumber();
		const res = await db.collection('mix-order').doc(order._id).update({
			status: 12,
			status_tip: '您的退货申请已提交，请等待管理员审核..',
			timeline,
			refund_product_reason: request.refund_product_reason,
			refund_product_images: request.refund_product_images
		})
		return res.updated === 1 ? {
			status: 1,
			msg: '退货申请已提交，请等待管理员审核'
		}: {
			status: 0,
			msg: '申请退货失败'
		}
	},
	/**
	 * 申请退货提交商品回寄快递信息
	 * @param {Object} request
	 * @param {String} request.order_id
	 * @param {Object} request.refund_express_data 快递信息
	 */
	async refundProductEditExpress(request, ext) {
		const orderRes = await orderDb.doc(request.order_id).get();
		if (orderRes.data.length === 0) {
			return {
				status: 0,
				msg: '订单不存在'
			}
		}
		const order = orderRes.data[0];
		if (order.status !== 14) {
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		//更新订单信息
		const timeline = order.timeline;
		timeline.unshift({
			time: +new Date(),
			title: '商品寄回',
			tip: '商品正在寄回',
			type: '商品寄回'
		})
		const outRefundNo = createOrderNumber();
		const res = await db.collection('mix-order').doc(order._id).update({
			status_tip: '商品正在寄回途中，请等待',
			timeline,
			refund_express_data: request.refund_express_data
		})
		return res.updated === 1 ? {
			status: 1,
			msg: '提交成功'
		}: {
			status: 0,
			msg: '提交失败'
		}
	},
	/**
	 * 未发货申请退款
	 * @param {Object} request
	 * @param {String} request.id
	 * @param {String} request.reason 退款原因
	 */
	async refund(request, ext) {
		const orderRes = await orderDb.doc(request.id).get();
		if (orderRes.data.length === 0) {
			return {
				status: 0,
				msg: '订单不存在'
			}
		}
		const order = orderRes.data[0];
		//已支付且未发货可申请退款
		if (order.status !== 1) {
			return {
				status: 0,
				msg: '订单状态不能申请退款'
			}
		}
		const transaction = await db.startTransaction();
		const money = order.price_data.pay_price;
		let res;
		//记录流水
		res = await transaction.collection('mix-money-log').add({
			uid: ext.uid,
			title: '订单退款 ' + order.order_number,
			type: 'refund_order',
			add_time: +new Date,
			money
		})
		if (!res.id) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '资金记录添加失败'
			}
		}
		//返还商品库存
		res = await this.handleStock({
			transaction,
			products: order.products.map(item => {
				return {
					_id: item.sku.product_id,
					sku_id: item.sku._id,
					inc: item.number
				}
			})
		});
		if (!res) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '库存更新失败，请稍候再试'
			}
		}
		//返还优惠券
		if(order.price_data.coupon_id){
			res = await transaction.collection('mix-user-coupon').doc(order.price_data.coupon_id).update({
				is_use: 0
			})
			if(res.updated != 1){
				await transaction.rollback()
				return {
					status: 0,
					msg: '优惠券返还失败'
				}
			}
		}
		//更新订单信息
		const timeline = order.timeline;
		timeline.unshift({
			time: +new Date(),
			title: '订单已退款',
			tip: '退款申请成功，资金已原路退回，请注意查收!',
			type: '订单退款'
		})
		const outRefundNo = createOrderNumber();
		res = await transaction.collection('mix-order').doc(order._id).update({
			status: 11,
			status_tip: '资金将原路退回，请注意查收',
			timeline,
			order_refund_number: outRefundNo
		})
		if (res.updated === 0) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '订单更新失败'
			}
		}
		//退款
		res = await payment.refund({
			uid: ext.uid,
			order,
			money,
			outRefundNo,
			transaction
		}, ext)
		
		if (res.status === 1) {
			await transaction.commit()
			return {
				status: 1,
				msg: '退款申请成功，资金将原路退回'
			}
		} else {
			await transaction.rollback()
			return res
		}
	},
	/**
	 * 确认收货
	 * @param {Object} request
	 * @param {String} request.id
	 */
	async confirmReceipt(request) {
		const orderRes = await orderDb.doc(request.id).get();
		if (orderRes.data.length === 0) {
			return {
				status: 0,
				msg: '订单不存在'
			}
		}
		const order = orderRes.data[0];
		if (order.status !== 2) {
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		//更新订单信息
		const timeline = order.timeline;
		timeline.unshift({
			time: +new Date(),
			title: '买家已确认收货',
			type: '确认收货'
		})
		
		const transaction = await db.startTransaction();
		//更新订单信息
		let res = await transaction.collection('mix-order').doc(order._id).update({
			status: 3,
			status_tip: '宝贝用的怎么样，来评价一下吧~',
			timeline
		})
		if(res.updated !== 1){
			await transaction.rollback()
			return {
				status: 0,
				msg: '订单更新失败,请稍候再试'
			}
		}
		//发放佣金
		const  logArr = [];
		if(order.inviter_user_lv1){
			res = await transaction.collection('mix-uni-id-users').doc(order.inviter_user_lv1).update({
				money: db.command.inc(+order.commission_lv1),
				commission: db.command.inc(+order.commission_lv1)
			})
			if(res.updated !== 1){
				await transaction.rollback()
				return {
					status: 0,
					msg: '直推佣金发放失败'
				}
			}
			logArr.push({
				uid: order.inviter_user_lv1,
				title: '直推佣金发放', 
				type: 'commission',
				add_time: + new Date,
				money: +order.commission_lv1,
				pay_type: 'system'
			})
		}
		if(order.inviter_user_lv2){
			res = await transaction.collection('mix-uni-id-users').doc(order.inviter_user_lv2).update({
				money: db.command.inc(+order.commission_lv2),
				commission: db.command.inc(+order.commission_lv2)
			})
			if(res.updated !== 1){
				await transaction.rollback()
				return {
					status: 0,
					msg: '间推佣金发放失败'
				}
			}
			logArr.push({
				uid: order.inviter_user_lv2,
				title: '间推佣金发放', 
				type: 'commission',
				add_time: + new Date,
				money: +order.commission_lv2,
				pay_type: 'system'
			})
		}
		//记录佣金流水
		if(logArr.length > 0){
			res = await transaction.collection('mix-money-log').add(logArr);
			if(res.updated < logArr.length){
				await transaction.rollback()
				return {
					status: 0,
					msg: '佣金流水记录失败'
				}
			}
		}
		
		//更新商品销量
		const ids = order.products.map(item=> item.sku.product_id);
		res = await this.handleSales({
			transaction,
			ids, //Array.from(new Set([...ids])) 这里不能去重，不同规格同商品需要多次更新，也可以检测有几个相同的直接更新几
			number: 1
		})
		if(!res){
			await transaction.rollback()
			return {
				status: 0,
				msg: '销量更新失败，请稍候再试'
			}
		}
		
		await transaction.commit()
		return {
			status: 1,
			msg: '确认收货成功'
		}
	},
	/**
	 * 更新商品销量
	 * @param {Object} param 
	 * @param {Object} param.transaction
	 * @param {Array} param.ids 商品数组
	 * @param {Number} param.number 更新量 若为负数则为减库存
	 */
	async handleSales(param){
		const {transaction, ids, number} = param;
		const pid = ids[0];
		const productData = await db.collection('mix-product').doc(pid).get();
		if(productData.data.length === 1){
			const res = await transaction.collection('mix-product').doc(pid).update({
				sales: dbCmd.inc(number)
			})
			if(res.updated != 1){
				return false;
			}
		}
		ids.shift();
		if(ids.length > 0){
			return await this.handleSales({
				transaction,
				ids,
				number
			})
		}
		return true;
	},
	
	
	/**
	 * 批量处理库存
	 * @param {Object} param 
	 * @param {Object} param.transaction
	 * @param {Array} param.products 处理产品数组
	 *	_id
	 *	sku_id
	 * 	inc 负数时为减少
	 * @return {Boolean} 处理结果
	 */
	async handleStock(param) {
		const products = JSON.parse(JSON.stringify(param.products));
		let transaction = param.transaction;
		const curProduct = param.products[0];
		products.shift();

		//增加库存时，若商品或规格不存在直接跳过
		if (curProduct.inc > 0) {
			const proData = await db.collection('mix-product').doc(curProduct._id).get();
			const skuData = await db.collection('mix-sku').doc(curProduct.sku_id).get();
			if (proData.data.length === 0 || skuData.data.length === 0) {
				if (products.length > 0) {
					return await this.handleStock({
						transaction,
						products,
						constProducts: param.constProducts || param.products
					});
				}
				return true;
			}
		}
		const res = await transaction.collection('mix-product').doc(curProduct._id).update({
			stock: dbCmd.inc(curProduct.inc)
		})
		const res1 = await transaction.collection('mix-sku').doc(curProduct.sku_id).update({
			stock: dbCmd.inc(curProduct.inc)
		})
		if (res.updated === 0 || res1.updated === 0) {
			return false
		}

		if (products.length > 0) {
			return await this.handleStock({
				transaction,
				products,
				constProducts: param.constProducts || param.products
			});
		}
		return true;
	},
	/**
	 * 评价订单
	 * @param {Object} request 
	 * @param {Object} request.order_id 订单id
	 * @param {Array} request.list 产品数组
	 */
	async addRating(request, ext) {
		let order = request.order;
		if (!order) {
			const orderRes = await orderDb.doc(request.order_id).get();
			order = orderRes.data[0];
		}
		let transaction = request.transaction;
		if (!transaction) {
			transaction = await db.startTransaction();
		}
		const list = request.list;
		//增加评价
		const curData = JSON.parse(JSON.stringify(list[0]));
		curData.uid = ext.uid;
		curData.add_time = +new Date();
		let res = await transaction.collection('mix-rating').add(curData);
		if (!res.id) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '评价失败'
			}
		}
		//修改商品好评率
		const totalData = await db.collection('mix-rating').where({
			product_id: curData.product_id
		}).count();
		const totalRatingData = await db.collection('mix-rating').where({
			product_id: curData.product_id,
			rating: dbCmd.gte(4)
		}).count();
		if (totalData.total > 0) {
			const total = totalData.total + 1;
			const totalRating = totalRatingData.total + (curData.rating >= 4 ? 1 : 0);
			await db.collection('mix-product').doc(curData.product_id).update({
				rating_ratio: (totalRating / total * 100).toFixed(1)
			})
		}

		list.shift();
		if (list.length > 0) {
			return await this.addRating({
				order,
				transaction,
				order_id: request.order_id,
				list
			}, ext)
		}
		//更新订单信息
		const timeline = order.timeline;
		timeline.unshift({
			time: +new Date(),
			title: '订单已完成',
			type: '订单完成'
		})
		res = await transaction.collection('mix-order').doc(order._id)
			.update({
				status: 4,
				status_tip: '',
				timeline
			})
		if (res.updated === 1) {
			await transaction.commit()
			return {
				status: 1,
				msg: '感谢您的评价~'
			}
		} else {
			await transaction.rollback()
			return {
				status: 0,
				msg: '订单更新失败'
			}
		}
	},

}

module.exports = modal;
