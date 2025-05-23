/**
 * 阿里云短信服务
 * create by 尤涛 2020-07-05
 * edit by 尤涛 2021-11-27
 * qq 472045067
 * 
 * 执行 npm install @alicloud/pop-core -S 后上传云函数
 */
'use strict';

const {
	appName,
	uniSms,
	aliSms
} = require('config')

const db = uniCloud.database();
/**
 * uniCloud 发送短信验证码
 * @param {Object} options
 * @param {String} phone
 * @param {String} code  
 * @param {String} action   
 */
const uniCloudSendSms = async options => {
	const {
		appid,
		templateId,
		expiresTime
	} = uniSms;
	const {
		phone,
		code,
		action,
	} = options;
	try {
		const res = await uniCloud.sendSms({
			appid,
			phone,
			templateId,
			data: {
				name: appName,
				code,
				action,
				expMinute: ''+expiresTime,
			}
		})
		return {
			status: 1
		}
	} catch (err) {
		console.log(err);
		return {
			status: 0,
			channel: 'uniCloud',
			code: err.errCode,
			msg: err.errMsg
		}
	}
}
/**
 * 阿里云发送短信验证码
 * @param {Object} options
 * @param {String} phone
 * @param {String} code  
 * @param {String} action 用途 uni短信必填
 * @param {String} TemplateCode 短信模板ID 阿里云必填
 */
const aliSendSms = async options => {
	const Core = require('@alicloud/pop-core');
	const {
		accessKeyId,
		accessKeySecret,
		SignName,
		expiresTime
	} = aliSms
	const {
		phone,
		code,
		TemplateCode, 
		action
	} = options;
	const client = new Core({
		accessKeyId,
		accessKeySecret,
		endpoint: "https://dysmsapi.aliyuncs.com",
		apiVersion: "2017-05-25"
	});
	const params = {
		"RegionId": "cn-hangzhou",
		"PhoneNumbers": phone,
		"SignName": SignName,
		"TemplateCode": TemplateCode,
		"TemplateParam": "{\"code\":" + code + "}"
	}
	const res = await client.request('SendSms', params, {
		method: 'POST'
	})
	return res.Code === 'OK' ? {
		status: 1,
	} : {
		status: 0,
		msg: res.Message,
		channel: 'aliyun'
	}
}


exports.main = async (event) => {
	const {
		mobile,
		action,
	} = event.data;
	const TemplateCode = 'SMS_464496043';
	const code = ('000000' + Math.floor(Math.random() * 999999)).slice(-6);
	let expiresTime = 1,
		res;
	if (uniSms.appid && uniSms.templateId) {
		res = await uniCloudSendSms({
			phone: mobile,
			code,
			action
		});
		expiresTime = uniSms.expiresTime;
	} else {
		res = await aliSendSms({
			phone: mobile,
			code,
			TemplateCode
		});
		expiresTime = aliSms.expiresTime;
	}
	//短信发送失败
	if(res.status === 0){
		console.log(res);
		//如果短信下发失败且配置了其他短信服务，尝试其他渠道下发
		if(res.channel === 'uniCloud' && aliSms.accessKeyId && aliSms.accessKeySecret){
			res = await aliSendSms({
				phone: mobile,
				code,
				TemplateCode
			});
			if(res.status === 0){
				return res;
			}
		}else if(res.channel === 'aliyun' && uniSms.smsKey && uniSms.smsSecret){
			res = await uniCloudSendSms({
				phone: mobile,
				code,
				action
			});
			if(res.status === 0){
				return res;
			}
		}else{
			return res;
		}
	}
	await db.collection('mix-sms-code').where({
		mobile
	}).remove()
	await db.collection('mix-sms-code').add({
		mobile,
		code,
		expires_time: +new Date() + expiresTime * 60*1000
	})
	return {
		status: 1,
		msg: '验证码已发送到您的手机',
		res
	}
};
