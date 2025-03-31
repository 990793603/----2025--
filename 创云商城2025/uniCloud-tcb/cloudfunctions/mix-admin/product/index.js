'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const productDb = db.collection('mix-product');
const categoryDb = db.collection('mix-product-category');

const modal = {
	/**
	 * 获取产品列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 * @param {Number} request.cate_id 二级分类id
	 * @param {Number} request.isSales 是否上架
	 * @param {Number} request.keyword 关键字
	 * @param {Number} request.orderBy 排序
	 */
	async getList(request){
		const {cate_id, isSales, keyword, offset, limit, orderBy} = request;
		
		const map = {
			is_del: 0
		};
		if(cate_id) map.cate_id = cate_id;
		if(typeof isSales === 'string') map.is_sales = +isSales;
		if(keyword) map.title = new RegExp(keyword)
		
		const $ = dbCmd.aggregate;
		const res = await productDb.aggregate()
			.match(map)
			.sort(orderBy)
			.skip(offset)
			.limit(limit)
			.lookup({
				from: "mix-sku",
				localField: "_id",
				foreignField: "product_id",
				as: 'sku'
			})
			.end();
		const countData = await productDb.where(map).count();
		res.affectedDocs = countData.total;
		return res;
	},
	/**
	 * 产品 新增
	 * @param {Object} request
	 */
	async addProduct(request){
		const data = {
			...request,
			add_time: + new Date(),
			collection_num: 0,
			is_del: 0,
			is_hot: 0,
			look_num: 0,
			sales: 0,
			status: 1
		}
		let skuList = [];
		if(data.skuData){
			skuList = [...data.skuData.skuList];
			delete data.skuData.skuList;
		}
		const res= await productDb.add(data);
		if(!res.id){
			return {
				status: 0,
				msg: '产品添加失败'
			}
		}
		if(skuList.length > 0){
			skuList.forEach(item=> {
				item.product_id = res.id;
			})
			await db.collection('mix-sku').add(skuList);
			
			return {
				status: 1,
				msg: '产品添加成功'
			}
		}else{
			return {
				status: 1,
				msg: '产品添加成功'
			}
		}
	},
	/**
	 * 产品删除
	 * @param {Object} request
	 * id
	 */
	async deleteProduct(request){
		const res = await productDb.doc(request.id).update({
			is_del: 1
		});
		return {
			status: res.updated
		}
	},
	/**
	 * 产品 更新
	 * @param {Object} request
	 */
	async updateProduct(request){
		const id = request._id;
		delete request._id;
		
		//清除旧的sku
		await db.collection('mix-sku').where({
			product_id: id
		}).remove();
		
		if(request.skuData){
			const skuList = [...request.skuData.skuList];
			await db.collection('mix-sku').add(skuList.map(item=> {
				item.product_id = id;
				delete item._id;
				return item;
			}));
		}
		const data = {
			...request,
			update_time: + new Date()
		}
		delete data.skuData.skuList;
		const res= await productDb.doc(id).set(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '产品修改成功'
		}: {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 产品状态修改
	 * @param {Object} request
	 * @param {Stri} request.id
	 * @param {String} request.key 要修改的字段
	 * @param {Number} request.val 值 
	 */
	async setProductAttr(request){
		const {id, key, val} = request;
		const data = {}
		data[key] = val;
		const res = await productDb.doc(id).update(data);
		return res;
	},
	/**
	 * 获取产品分类列表
	 */
	async getCategoryList(){
		const res= await categoryDb
			.orderBy('sort', 'desc')
			.get();
		return res.data;
	},
	/**
	 * 获取产品分类树列表
	 */
	async getCategoryTreeList(){
		const res= await categoryDb
			.orderBy('sort', 'desc')
			.get();
		const resList = res.data;
		const list = resList.filter(item=> !item.parent_id);
		list.forEach(item=> {
			item.children = resList.filter(val=> val.parent_id === item._id);
		})
		return list;
	},
	/**
	 * 产品分类 新增
	 * @param {Object} request
	 */
	async addCategory(request){
		const data = {
			...request,
			add_time: + new Date()
		}
		const res = await categoryDb.add(request);
		return res.id ? {
			status: 1,
			msg: '分类添加成功'
		}: {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 产品分类 更新
	 * @param {Object} request
	 */
	async updateCategory(request){
		const id = request._id;
		delete request._id;
		const data = {
			...request,
			update_time: + new Date()
		}
		const res = await categoryDb.doc(id).update(data);
		return res.updated === 1 ? {
			status: 1,
			msg: '分类修改成功'
		}: {
			status: 0,
			msg: '服务器内部错误'
		}
	},
	/**
	 * 产品分类 删除
	 * @param {Object} request
	 * id
	 */
	async deleteCategory(request){
		//检查是否有使用该分类的产品
		const productRes = await productDb
			.where(
				dbCmd.and(
					{is_del: 0},
					dbCmd.or({
						cate_id: request.id
					},{
						first_cate_id: request.id
					})
				)
			)
			.limit(1)
			.get();
		if(productRes.data.length > 0){
			return {
				status: 0,
				msg: '有产品使用了该分类，无法删除'
			}
		}
		const res= await categoryDb.doc(request.id).remove();
		return res.deleted === 1 ? {
			status: 1
		}: {
			status: 0,
			msg: res.message || '服务器内部错误'
		}
	},
	/**
	 * 产品分类 修改状态
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