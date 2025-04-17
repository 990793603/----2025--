'use strict';
const {
	wxConfigMp,
	wxConfigApp,
	aliConfigMp,
	aliConfigApp,
	paymentNotifyUrl,
} = require('config')

const uniPay = require('unipay')
const uniID = require('uni-id')

const db = uniCloud.database();
const dbCmd = db.command;

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
 * 退款单号生成 20位
 * @return {String} 单号
 */
const createRandomNo = ()=>{
	let random_no = date('Ymd', +new Date());
	for (let i = 0; i < 12; i++){
		random_no += Math.floor(Math.random() * 10);
	}
	return random_no;
}
/**
 * 余额支付
 * @param {Object} param
 * @param {Object} param.user 用户
 * @param {Number} param.totalFee 支付金额 分
 * @param {String} param.pay_password 可选，余额支付需要
 */
const balancePay = async (param)=>{
	const {user, totalFee, pay_password} = param;
	//验证支付密码
	if(!pay_password || user.pay_password !== uniID.encryptPwd(pay_password).passwordHash){
		return {
			status: 0,
			msg: '支付密码错误',
			pay_password
		}
	}
	//验证余额
	if(!user.money || user.money*100 < totalFee){
		return {
			status: 0,
			msg: '账户余额不足'
		}
	}
	//扣除用户余额
	const res = await db.collection('mix-uni-id-users').doc(user._id)
		.update({
			money: dbCmd.inc(- totalFee/100)
		})
	return res.updated === 1 ? {
		status: 1
	}:{
		status: 0,
		msg: '余额扣除失败'
	}
}

/**
 * 初始化unipay
 * @param {Object} param
 * @param {String} param.provider 支付方式
 * @param {String} param.PLATFORM 调用平台
 * 
 * @param {String} param.code 可选，小程序code 小程序支付必须 
 */
const initUniPay = async param=>{
	const {provider, PLATFORM, code} = param;
	let uniPayInstance, openid;
	switch (provider + '_' + PLATFORM) {
		case 'wxpay_mp-weixin':
			uniPayInstance = uniPay.initWeixin(wxConfigMp)
			if(code){
				const codeRes = await uniID.code2SessionWeixin({
					code
				})
				if(codeRes.code !== 0){
					return {
						status: -1,
						msg: codeRes.message || '获取openid失败'
					}
				}
				openid = codeRes.openid;
			}
			break;
		case 'alipay_mp-alipay':
			uniPayInstance = uniPay.initAlipay(aliConfigMp)
			//openid = user.ali_openid
			break;
		case 'wxpay_app-plus':
			uniPayInstance = uniPay.initWeixin(wxConfigApp)
			break;
		case 'alipay_app-plus':
			uniPayInstance = uniPay.initAlipay(aliConfigApp)
			break;
		default:
			return {
				status: -1,
				msg: '参数错误'
			}
	}
	return {
		uniPayInstance,
		openid
	}
}
/**
 * unipay支付
 * @param {Object} param
 * @param {String} param.outTradeNo 订单号
 * @param {Number} param.totalFee 支付金额, 单位分
 * @param {String} param.subject 订单标题
 * @param {String} param.body 商品描述
 * @param {String} param.pay_type 支付方式 balance wxpay alipay
 * @param {String} param.notifyUrl 回调地址
 * 
 * @param {String} param.code 可选，小程序code 小程序支付必须 
 */
const payByUnipay = async (param, ext)=>{
	const {outTradeNo, totalFee, subject, body, pay_type: provider, code, notifyUrl} = param;
	const PLATFORM =  ext.context.PLATFORM;
	if(provider === 'alipay' && !aliConfigApp.mchId){
		return {
			status: 0,
			msg: '未配置支付宝支付参数。'
		}
	}
	if(provider === 'wxpay' && PLATFORM === 'app-plus' && !wxConfigApp.appId){
		return {
			status: 0,
			msg: '未配置微信支付参数，请前往微信小程序体验。'
		}
	}
	const {uniPayInstance, openid} = await initUniPay({
		provider,
		PLATFORM,
		code
	})
	let orderInfo;
	try {
		// 获取支付信息
		orderInfo = await uniPayInstance.getOrderInfo({
			openid, // App端支付时不需要openid，传入个undefined也没有影响
			outTradeNo,
			totalFee: totalFee.toFixed(0),
			subject,
			body,
			notifyUrl: `${notifyUrl}/${provider}_${PLATFORM}`
		})
	} catch (e) {
		return {
			status: -3,
			msg: typeof e.message === 'string' ? e.message : '获取支付信息失败，请稍后再试',
			err: e.message
		}
	}
	return {
		status: 1,
		data: {
			outTradeNo,
			orderInfo
		}
	}
}

const modal = {

	async getMoneyList(request, ext){
		let res = await db.collection('mix-money-list').get();
		return res;
	},
	/**
	 * 用户余额充值
	 * @param {Object} request
	 * @param {Number} request.money 充值金额
	 * @param {String} request.pay_type 支付方式
	 * @param {String} request.code 小程序code 小程序充值必须 
	 */
	async recharge(request, ext){
		const {money, code, pay_type} = request;
		const uid = ext.uid;
		if(!uid){
			return {
				status: 0,
				msg: '获取用户信息失败'
			}
		}
		if(isNaN(money) || money <= 0){
			return {
				status: 0,
				msg: '充值金额错误'
			}
		}
		const order_number = createRandomNo();
		const regList = await db.collection('mix-money-list').get();
		let song=0
		if (regList.data.length) {
			regList.data.forEach(item => {
				if (money >= item.money) {
					song=item.song
				}
			});
		}
		console.log(song);
		
		console.log(money);
		let resSong=money+song
		const data = {
			order_number,
			uid,
			money:money,
			price_data: {
				pay_price: money 
			},
			resSong:resSong,
			pay_type: pay_type,
			platform: ext.context.PLATFORM,
			add_time: +new Date(),
			pay_status: 0
		}
		let res = await db.collection('mix-recharge').add(data);
		if(!res.id){
			return {
				status: 0,
				msg: '订单创建失败，请稍候再试'
			}
		}
		
		res = await payByUnipay({
			outTradeNo: order_number,
			totalFee: money * 100,
			subject: '预存款充值',
			body: '用户预存款账户充值',
			pay_type,
			code,
			notifyUrl: paymentNotifyUrl + '/recharge',
		}, ext);
		return res;
	},
	/**
	 * 支付
	 * @param {Object} param
	 * @param {String} param.pay_type 支付方式 balance余额 alipay支付宝 wxpay微信支付
	 * @param {Object} param.order 订单
	 * @param {Object} param.user 用户
	 * @param {String} param.pay_password 支付密码(余额支付时)
	 */
	async pay(param, ext){
		if(param.pay_type === 'balance'){
			return await balancePay(param);
		}
		return await payByUnipay({
			notifyUrl: paymentNotifyUrl + '/payOrder',
			...param
		}, ext);
	},
	/**
	 * 查询支付状态
	 * @param {Object} param
	 * @param {String} param.outTradeNo 订单号
	 * @param {String} param.provider 支付方式
	 */
	async queryPayStatus(param, ext){
		const {uniPayInstance} = await initUniPay({
			provider: param.provider,
			PLATFORM: 'app-plus'
		})
		const res = await uniPayInstance.orderQuery({
		    outTradeNo: param.outTradeNo
		})
		return res;
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
		const {uid, order, money, outRefundNo, transaction} = params;
		//余额退款
		if(order.pay_type === 'balance'){
			const res = await transaction.collection('mix-uni-id-users')
				.doc(uid)
				.update({
					money: dbCmd.inc(money)
				})
			return res.updated === 1 ? {
				status: 1
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
		try {
			const refundFee = (money * 100).toFixed(0);
			const options = {
			    outTradeNo: order.order_number,
			    outRefundNo, // 支付宝可不填此项
			    totalFee: refundFee, // 订单总金额，支付宝可不填此项
			    refundFee: refundFee, // 退款总金额
			}
			//发起退款
			const res = await uniPayInstance.refund(options)
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
				msg: '退款失败，请稍候再试',
			}
		}
	},
	/**
	 * 获取用户资金记录
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 */
	async getMoneyLog(request, ext){
		const res = await db.collection('mix-money-log')
			.skip(request.offset)
			.limit(request.limit)
			.where({
				uid: ext.uid
			})
			.orderBy('add_time', 'desc')
			.get()
		return res;
	},
}
module.exports = modal;