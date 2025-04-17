'use strict';

const xlsx = require('node-xlsx');
const crypto = require('crypto');
const uniPay = require('unipay')
const {
	wxConfigMp,
	wxConfigApp,
	aliConfigMp,
	aliConfigApp
} = require('config')
const {
	kuaidi100
} = require('config')

const db = uniCloud.database();
const dbCmd = db.command;

const orderDb = db.collection('mix-order');

const orderStatus = [
	{status: 0, name: '待付款'},
	{status: 1, name: '待发货'},
	{status: 2, name: '待收货'},
	{status: 3, name: '待评价'},
	{status: 4, name: '已完成'},
	{status: 10, name: '已关闭'}, //未付款取消订单
	{status: 11, name: '已取消'}, //已付款取消订单
	{status: 12, name: '申请退货'},
	{status: 13, name: '拒绝退货申请'}, //拒绝退货后订单完成
	{status: 14, name: '正在退货'},//同意退货后买家寄回商品
	{status: 15, name: '退货完成'}, //订单退货退款后完成
	{status: 16, name: '拒绝退款'} //订单退货后拒绝退款
]

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
 * 批量处理库存
 * @param {Object} param 
 * @param {Array} param.products 处理产品数组
 *	_id
 *	sku_id
 * 	inc 负数时为减少
 * @return {Boolean} 处理结果
 */
const handleStock = async param=> {
	const products = JSON.parse(JSON.stringify(param.products));
	const curProduct = param.products[0];
	products.shift();

	//增加库存时，若商品或规格不存在直接跳过
	if (curProduct.inc > 0) {
		const proData = await db.collection('mix-product').doc(curProduct._id).get();
		const skuData = await db.collection('mix-sku').doc(curProduct.sku_id).get();
		if (proData.data.length === 0 || skuData.data.length === 0) {
			if (products.length > 0) {
				return await handleStock({
					products,
					constProducts: param.constProducts || param.products
				});
			}
			return true;
		}
	}
	const res = await db.collection('mix-product').doc(curProduct._id).update({
		stock: dbCmd.inc(curProduct.inc)
	})
	const res1 = await db.collection('mix-sku').doc(curProduct.sku_id).update({
		stock: dbCmd.inc(curProduct.inc)
	})
	if (res.updated === 0 || res1.updated === 0) {
		return false
	}

	if (products.length > 0) {
		return await handleStock({
			products,
			constProducts: param.constProducts || param.products
		});
	}
	return true;
}

const modal = {
	/**
	 * 获取订单列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 * @param {String} request.order_number
	 * @param {String} request.username
	 * @param {String} request.addr_name
	 * @param {Number} request.status
	 */
	async getList(request, ext){
		const {offset, limit, order_number, username, addr_name, status} = request;
		const map = {}
		
		if(order_number) map.order_number = new RegExp(order_number);
		if(username) map.username = new RegExp(username);
		if(addr_name) map.address = {
			name: new RegExp(addr_name)
		}
		if(status || status === 0) map.status = status;
		
		const res = await orderDb.aggregate()
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
		
		const countData = await orderDb.where(map).count();
		res.affectedDocs = countData.total;
		res.data.forEach(item=> {
			item.status_text = orderStatus.filter(s=> s.status === item.status)[0].name;
			item.user = item.user.length > 0 ? item.user[0] : {};
		})
		res.map = map;
		return res;
	},
	/**
	 * 导出订单excel
	 * @param {String} request.order_number
	 * @param {String} request.username
	 * @param {String} request.addr_name
	 * @param {Number} request.status
	 */
	async exportOrderExcel(request){
		const {order_number, username, addr_name, status} = request;
		const map = {}
		if(order_number) map.order_number = new RegExp(order_number);
		if(username) map.username = new RegExp(username);
		if(addr_name) map.address = {
			name: new RegExp(addr_name)
		}
		if(status || status === 0) map.status = status;
		const res = await orderDb.aggregate()
			.match(map)
			.sort({
				add_time: -1
			})
			.limit(500)
			.lookup({
				from: "mix-uni-id-users",
				localField: "uid",
				foreignField: "_id",
				as: 'user'
			})
			.end();
			
		if(res.data.length === 0){
			return {
				status: 0,
				msg: '找不到订单'
			}
		}
		const eData = [['序号','购买用户','购买商品','订单号','下单时间','支付金额','订单状态','收货人','收货手机','收货地址','快递代码','快递单号']];
		const list = res.data;
		list.forEach((item, index)=> {
			item.status_text = orderStatus.filter(s=> s.status === item.status)[0].name;
			item.user = item.user.length > 0 ? item.user[0] : {};
			eData.push([
				''+(index + 1), //序号
				item.user.username,//购买用户
				item.products[0].title,//购买商品
				item.order_number,//订单号
				date('Y-m-d H:i',item.add_time),//下单时间
				''+item.price_data.pay_price,//支付金额
				item.status_text,//订单状态
				item.address.name,//收货人
				item.address.mobile,//收货手机
				item.address.address.address,//收货地址
			])
		})
		const buffer = xlsx.build([{
			name: 'sheet1',
			data: eData
		}], {
			'!cols': [
				{wpx: 50},
				{wpx: 80},
				{wpx: 150},
				{wpx: 135},
				{wpx: 115},
				{wpx: 60},
				{wpx: 60},
				{wpx: 60},
				{wpx: 80},
				{wpx: 300}
			]
		});
		//上传文件到云存储
		const uploadRes = await uniCloud.uploadFile({
		    cloudPath: '导出结果_' + new Date().getTime() + '.xlsx', //导出文件名
		    fileContent: buffer
		})
		if (uploadRes.fileID) { //上传成功
		    //获取临时下载地址
		    const getUrlRes = await uniCloud.getTempFileURL({
		        fileList: [uploadRes.fileID]
		    })
		    //获取文件临时下载地址
		    if (getUrlRes.fileList && getUrlRes.fileList.length > 0) {
		        return {
					status: 1,
		            url: getUrlRes.fileList[0].download_url
		        }
		    } else {
		        return {
		            status: 0,
		            msg: '获取文件下载地址失败'
		        }
		    }
		}
		return {
		    status: 0,
		    msg: '上传失败'
		}
	},
	/**
	 * 获取物流公司列表
	 */
	async getExpressComp(){
		const res = await db.collection('mix-express').get();
		return res;
	},
	//批量发货
	async batchShipment(request){
		const {
			order_number,
			shipper_code,
			logistic_code
		} = request;
		const orderData = await orderDb.where({
			order_number,
			status: 1
		}).get();
		if(orderData.data.length === 0){
			return {
				status: 0
			};
		}
		const order = orderData.data[0];
		const timeline = order.timeline;
		timeline.unshift({
			time: + new Date(),
			title: '订单已发货',
			tip: '您的宝贝已经护送出发了哦',
			type: '订单发货'
		})
		let res = await orderDb
			.doc(order._id)
			.update({
				status: 2,
				status_tip: '快递已揽收，正在配送中..',
				shipper_code,
				logistic_code,
				timeline,
				express_time: + new Date()
			})
		return res.updated === 1 ?{
			status: 1
		}: {
			status: 0
		}
	},
	/**
	 * 订单发货
	 * @param {Object} request
	 * @param {String} request.order_id
	 * @param {String} request.shipper_code 物流公司代码
	 * @param {String} request.shipper_name 物流公司名称
	 * @param {String} logistic_code 快递单号
	 */
	async deliveryOrder(request, ext){
		const {order_id, shipper_code, shipper_name, logistic_code} = request;
		const orderData = await orderDb.doc(order_id).get();
		const order = orderData.data[0];
		if(order.status !== 1){
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		const timeline = order.timeline;
		timeline.unshift({
			time: + new Date(),
			title: '订单已发货',
			tip: '您的宝贝已由' + shipper_name + '护送出发了哦',
			type: '订单发货'
		})
		const res = await orderDb
			.doc(order_id)
			.update({
				status: 2,
				status_tip: shipper_name + '已揽收，正在配送中..',
				shipper_code,
				logistic_code,
				timeline,
				express_time: + new Date()
			})
		return res.updated === 1 ? {
			status: 1,
			msg: '发货成功'
		}:{
			status: 0,
			msg: '发货失败'
		}
	},
	/**
	 * 查询物流信息
	 * @param {Object} request
	 * @param {String} request.shipper_code 快递公司代码
	 * @param {String} request.logistic_code 快递单号
	 * @param {String} request.phone 收件人或寄件人的手机号或固话（顺丰单号必填，也可以填写后四位，如果是固话，请不要上传分机号）
	 */
	async getExpressInfo(request, ext) {
		const {
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
	 * 拒绝退货申请
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 */
	async refuseReturnProduct(request, ext) {
		const orderData = await orderDb.doc(request.order_id).get();
		const order = orderData.data[0];
		if(order.status !== 12){
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		const timeline = order.timeline;
		timeline.unshift({
			time: + new Date(),
			title: '拒绝退货',
			tip: '管理员拒绝了您的退货申请，如有疑问请联系客服处理。',
			type: '拒绝退货'
		})
		const res = await orderDb
			.doc(request.order_id)
			.update({
				status: 13,
				status_tip: '退货申请被拒绝，如有疑问请联系客服',
				timeline
			})
		return res.updated === 1 ? {
			status: 1,
			msg: '操作成功'
		}:{
			status: 0,
			msg: '操作失败'
		}
	},
	/**
	 * 同意退货申请
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 */
	async agreeReturnProduct(request, ext) {
		//查询是否设置了退货地址
		const refundAddr = await db.collection('mix-refund-address')
			.where({
				status: 1
			})
			.limit(1)
			.get();
		if(refundAddr.data.length === 0){
			return {
				status: 2,
				msg: '未设置退货地址'
			}
		}
		const refundAddrData = refundAddr.data[0];
		const orderData = await orderDb.doc(request.order_id).get();
		const order = orderData.data[0];
		if(order.status !== 12){
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		const timeline = order.timeline;
		timeline.unshift({
			time: + new Date(),
			title: '同意退货',
			tip: '管理员同意了您的退货申请，请将商品寄回并补充快递信息，如有疑问请联系客服处理。',
			type: '拒绝退货'
		})
		const res = await orderDb
			.doc(request.order_id)
			.update({
				status: 14,
				status_tip: '退货申请通过，请补充物流信息',
				timeline,
				refundAddrData
			})
		return res.updated === 1 ? {
			status: 1,
			msg: '操作成功'
		}:{
			status: 0,
			msg: '操作失败'
		}
	},
	/**
	 * 退货申请通过后拒绝退款
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 */
	async refuseRefund(request, ext) {
		const orderData = await orderDb.doc(request.order_id).get();
		const order = orderData.data[0];
		if(order.status !== 14){
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		const timeline = order.timeline;
		timeline.unshift({
			time: + new Date(),
			title: '拒绝退款',
			tip: '管理员拒绝为您退款，如有疑问请联系客服处理。',
			type: '拒绝退货'
		})
		const res = await orderDb
			.doc(request.order_id)
			.update({
				status: 16,
				status_tip: '管理员拒绝为您退款，如有疑问请联系客服',
				timeline
			})
		return res.updated === 1 ? {
			status: 1,
			msg: '操作成功'
		}:{
			status: 0,
			msg: '操作失败'
		}
	},
	/**
	 * 退货申请通过后退款给用户
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 */
	async agreeRefund(request, ext) {
		const orderData = await orderDb.doc(request.order_id).get();
		const order = orderData.data[0];
		if(order.status !== 14){
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		//返还商品库存
		await handleStock({
			products: order.products.map(item => {
				return {
					_id: item.sku.product_id,
					sku_id: item.sku._id,
					inc: item.number
				}
			})
		});
		const transaction = await db.startTransaction();
		let res;
		//记录流水
		res = await transaction.collection('mix-money-log').add({
			uid: order.uid,
			title: '订单退款 ' + order.order_number,
			type: 'refund_order',
			add_time: +new Date,
			money: order.price_data.pay_price
		})
		if (!res.id) {
			await transaction.rollback()
			return {
				status: 0,
				msg: '资金记录添加失败'
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
		const timeline = order.timeline;
		timeline.unshift({
			time: + new Date(),
			title: '订单退款',
			tip: '管理员已处理您的退款，支付款已原路退回',
			type: '订单退款'
		})
		const outRefundNo = createOrderNumber();
		res = await transaction.collection('mix-order')
			.doc(order._id)
			.update({
				status: 15,
				status_tip: '您的支付款已原路退回',
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
		res = await this.refund({
			uid: order.uid,
			order,
			money: order.price_data.pay_price,
			outRefundNo,
			transaction
		}, ext)
		
		if (res.status === 1) {
			await transaction.commit()
			return {
				status: 1,
				msg: '退款成功，资金将原路退回'
			}
		} else {
			await transaction.rollback()
			return res
		}
	},
	/**
	 * 退款
	 * @param {Object} params
	 * @param {String} params.uid
	 * @param {Object} params.order 订单
	 * @param {Number} params.money 
	 * @param {Number} params.outRefundNo 商户退款单号退款单号
	 */
	async refund(params, ext){
		console.log("我在这");
		const {uid, order, money, outRefundNo, transaction} = params;
		//余额退款
		if(order.pay_type === 'balance'){
			const res = await transaction.collection('mix-uni-id-users')
				.doc(uid)
				.update({
					money: dbCmd.inc(money)
				})
			return res.updated === 1 ? {
				status: 1,
			}:{
				status: 0,
				msg: '退款失败'
			}
		}
		//uniPay退款
		let uniPayInstance;
		if(order.pay_type === 'wxpay'){
			if(wxConfigMp.appId && wxConfigMp.mchId && wxConfigMp.key){
				uniPayInstance = uniPay.initWeixin(wxConfigMp);
			}else{
				uniPayInstance = uniPay.initWeixin(wxConfigApp);
			}
		}else if(order.pay_type === 'alipay'){
			if(aliConfigMp.mchId && aliConfigMp.alipayPublicKey && aliConfigMp.privateKey){
				uniPayInstance = uniPay.initAlipay(aliConfigMp);
			}else{
				uniPayInstance = uniPay.initAlipay(aliConfigApp);
			}
		}else{
			return {
				status: 0,
				msg: '支付方式获取失败'
			}
		}
		const refundFee = (money * 100).toFixed(0);
		try {
			console.log('这里');
			const res = await uniPayInstance.refund({
			    outTradeNo: order.order_number,
			    outRefundNo, // 支付宝可不填此项
			    totalFee: refundFee, // 订单总金额，支付宝可不填此项
			    refundFee: refundFee, // 退款总金额
			})
			console.log(res);
			if((res.returnCode === 'SUCCESS' && res.resultCode === 'SUCCESS') || res.errMsg === 'Success'){
				return {
					status: 1
				}
			}else{
				return {
					status: 0,
					msg: res.returnMsg || '请求退款失败'
				}
			}
		}catch(err){
			console.log(err);
			return {
				status: 0,
				msg: '退款遇到问题，请稍候再试',
				err,
				data: {
					outTradeNo: order.order_number,
					outRefundNo, // 支付宝可不填此项
					totalFee: refundFee, // 订单总金额，支付宝可不填此项
					refundFee: refundFee, // 退款总金额
				}
			}
		}
	},
}

module.exports = modal;