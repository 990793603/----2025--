'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const advertDb = db.collection('mix-article');
const categoryDb = db.collection('mix-article-category')


const modal = {
	/**
	 * 获取文章列表
	 */
	async getList(request){
		const $ = dbCmd.aggregate;
		const res = await advertDb.aggregate()
			.lookup({
				from: "mix-article-category",
				localField: "type",
				foreignField: "_id",
				as: "category"
			})
			.unwind('$category')
			.addFields({
				cate_name: '$category.name'
			})
			.project({
				category: 0
			})
			.end();
		return res;
	},
	/**
	 * 新增文章
	 * @param {Object} request
	 */
	async addArticle(request){
		const data = Object.assign({
			add_time: + new Date()
		}, request);
		const res= await advertDb.add(data);
		return res.id ? {
			status: 1,
			msg: '添加成功'
		}: {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 文章删除
	 * @param {Object} request
	 * id
	 */
	async deleteArticle(request){
		const res= await advertDb.doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 修改
	 * @param {Object} request
	 */
	async updateArticle(request){
		const data = Object.assign({}, request, {
			update_time: + new Date(),
		});
		const id = request._id;
		delete data._id;
		const res= await advertDb.doc(id).set(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '修改成功'
		} : {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 文章启用|禁用
	 * @param {Object} request
	 * id
	 * status 0|1
	 */
	async setStatus(request){
		const res = await advertDb.doc(request.id).update({
			status: + request.status
		});
		return res;
	},
	/**
	 * 获取分类列表
	 * @param {Object} request
	 */
	async getCategoryList(request){
		const res = await categoryDb.get();
		return res;
	},
	/**
	 * 分类 新增|编辑
	 * @param {Object} request
	 */
	async setCategory(request){
		let res;
		if(request._id){
			//编辑
			request.update_time = + new Date();
			const id = request._id;
			delete request._id;
			res = await categoryDb.doc(id).update(request);
		}else{
			//新增
			request.add_time = + new Date();
			res = await categoryDb.add(request);
		}
		return res.id ? {
			status: 1,
			msg: '分类添加成功'
		} : res.updated === 1 ? {
			status: 1,
			msg: '分类修改成功'
		} : {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 分类 修改状态
	 * @param {Object} request
	 * id
	 * status 0|1
	 */
	async setCategoryStatus(request){
		const res = await categoryDb.doc(request.id).update({
			status: + request.status
		});
		return res;
	}
}

module.exports = modal;