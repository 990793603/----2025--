/**
 * 用户管理模块
 * create by 尤涛 2020-07-20
 * edit by 尤涛 2021-12-03
 * qq 472045067
 */
'use strict';

const {
	masterSmsCode,
	openExamine
} = require('config')
const uniID = require('uni-id');


const db = uniCloud.database();
const dbCmd = db.command;
const userDb = db.collection('mix-uni-id-users');

/**
 * 手机验证码核验
 * @param {String} code 验证码
 * @param {String} mobile 手机号码
 * @return {Boolean}
 * create by 尤涛 2020-07-08
 * qq 472045067
 */
const checkSmsCode = async (code, mobile) => {
	if(masterSmsCode.includes(code)){
		return true;
	}
	const res = await uniCloud.database()
		.collection('mix-sms-code')
		.where({
			mobile
		})
		.limit(1)
		.get();
	if(res.data.length === 1 && res.data[0].code === code && res.data[0].expires_time > + new Date()){
		return true;
	}
	return false;
}

const modal = {
	/**
	 * 注册
	 * @param {Object} request
	 * @param {String} request.mobile 手机号码
	 * @param {String} request.code 手机验证码
	 * @param {String} request.pwd 密码
	 * @param {String} request.inviteCode 邀请码
	 * @param {Object} request.userInfo 微信登录时传入用户信息
	 */
	async register(request, ext){
		const {mobile, code, pwd, inviteCode, wxCode, userInfo, apple_id} = request;
		//手机验证码核验
		let res = await checkSmsCode(code, mobile);
		if(!res){
			return {
				status: 0,
				msg: '验证码错误'
			}
		}
		if(inviteCode){
			const user = await userDb.where({
				my_invite_code: inviteCode
			}).get();
			if(user.data.length === 0){
				return {
					status: 0,
					msg: '邀请码错误'
				}
			}
		}
		const regData = {
			username: mobile,
			password: pwd
		}
		if(userInfo && userInfo.nickName) regData.nickname = userInfo.nickName;
		if(userInfo && userInfo.gender) regData.gender = userInfo.gender;
		if(userInfo && userInfo.avatarUrl) regData.avatar = userInfo.avatarUrl;
		if(userInfo && userInfo.unionid) regData.wx_unionid = userInfo.unionid;
		if(apple_id) regData.apple_openid = apple_id;
		
		res = await uniID.register(regData)
		if(res.code !== 0){
			return {
				status: 0,
				msg: res.message || '注册失败'
			}
		}
		//接受邀请
		if(inviteCode){
			await uniID.acceptInvite({
				uid: res.uid,
				inviteCode
			})
		}
		//绑定微信
		if(wxCode){
			await uniID.bindWeixin({
				uid: res.uid,
				code: wxCode
			})
		}
		return {
			status: 1,
			msg: '注册成功',
			token: res.token,
			tokenExpired: res.tokenExpired
		}
	},
	/**
	 * 忘记密码 使用手机号+验证码修改
	 * @param {Object} request
	 * @param {String} request.mobile 手机号码
	 * @param {String} request.code 手机验证码
	 * @param {String} request.pwd 密码
	 */
	async retrievePassword(request, ext){
		const {mobile, code, pwd} = request;
		//手机验证码核验
		let res = await checkSmsCode(code, mobile);
		if(!res){
			return {
				status: 0,
				msg: '验证码错误'
			}
		}
		res = await userDb.where({
			username: mobile
		}).get();
		if(res.data.length === 0){
			return {
				status: 0,
				msg: '用户不存在'
			}
		}
		const user = res.data[0];
		res = await uniID.resetPwd({
			uid: user._id,
			password: pwd
		}) 
		return res.code === 0 ? {
			status: 1,
			msg: '密码修改成功，请重新登录'
		}: {
			status: 0,
			msg: res.message || '修改失败'
		}
	},
	/**
	 * 手机号登录
	 * @param {Object} request
	 * @param {String} request.username 手机号码
	 * @param {String} request.pwd 密码
	 */
	async login(request, ext){
		const {username, pwd} = request;
		const res = await uniID.login({
			username,
			password: pwd
		})
		return res.code === 0 ? {
			status: 1,
			data: res
		}: {
			status: 0,
			msg: res.message
		}
	},
	/**
	 * 微信登录
	 * @param {Object} request
	 * @param {String} request.code
	 */
	async loginByWeixin(request, ext){
		const res = await uniID.loginByWeixin({
			code: request.code,
			type: 'login'
		})
		if(res.code === 0){
			return {
				status: 1,
				msg: '登录成功',
				token: res.token,
				tokenExpired: res.tokenExpired
			}
		}
		return {
			status: 0,
			msg: res.message,
			userInfo: res.userInfo
		}
	},
	/**
	 * 苹果登录
	 * @param {Object} request
	 * @param {String} request.identityToken 
	 */
	async loginByApple(request, ext){
		const res = await uniID.loginByApple({
			identityToken: request.identityToken,
			type: 'login'
		})
		if(res.code === 0){
			return {
				status: 1,
				msg: '登录成功',
				token: res.token,
				tokenExpired: res.tokenExpired
			}
		}else{
			return {
				status: 0,
				msg: res.message,
				code: res.code,
				apple_id: res.f.sub
			}
		}
	},
	/**
	 * 退出登录
	 */
	async logout(request, ext){
		const res = await uniID.logout(ext.event.uniIdToken);
		return res.code === 0 ? {
			status: 1
		}: {
			status: 0,
			msg: res.msg
		}
	},
	/**
	 * 获取用户信息
	 */
	async get(request, ext){
		if(!ext.uid){
			return {
				status: 0,
				msg: '用户未登录',
				openExamine
			}
		}
		const res = await uniID.getUserInfo({
			uid: ext.uid
		})
		if(res.code !== 0){
			return {
				status: 0,
				msg: res.message,
				openExamine
			}
		}
		if(!res.userInfo.my_invite_code){
			const setInviteRes = await uniID.setUserInviteCode({
				uid: ext.uid
			});
			if(setInviteRes.code === 0){
				res.userInfo.my_invite_code = setInviteRes.myInviteCode;
			}
		}
		return {
			status: 1,
			data: res.userInfo,
			openExamine
		}
	},
	/**
	 * 更新用户信息
	 * @param {Object} request
	 * @param {String} request.avatar 头像
	 * @param {String} request.nickname 昵称
	 * @param {Number} request.gender 1男 2女 0保密
	 * @param {Boolean} request.anonymous 是否隐藏个人信息
	 * @param {Boolean} request.receive_push 是否接收推送通知
	 */
	async update(request, ext){
		//允许更新字段
		const attrs = ['avatar', 'nickname', 'gender', 'anonymous', 'receive_push'];
		const data = {};
		for(let key in request){
			if(attrs.includes(key)){
				data[key] = request[key];
			}
		}
		const res= await userDb.doc(ext.uid).update(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '信息更新成功'
		}: {
			status: 0,
			msg: '信息修改失败'
		}
	},
	/**
	 * 设置支付密码
	 * @param {Object} request
	 * @param {String} request.username 用户名(手机号)
	 * @param {String} request.pay_password 支付密码
	 * @param {String} request.code 手机验证码
	 */
	async setPayPasswod(request, ext){
		const {username, pay_password, code} = request;
		//手机验证码核验
		const checkCodeRes = await checkSmsCode(code, username);
		if(!checkCodeRes){
			return {
				status: 0,
				msg: '验证码错误'
			};
		}
		const res= await userDb.doc(ext.uid).update({
			pay_password: uniID.encryptPwd(pay_password).passwordHash
		});
		return res.updated === 1 ? {
			status: 1,
			msg: '支付密码已重置'
		}: {
			status: 0,
			msg: '设置失败'
		}
	}
}

module.exports = modal;