<template>
	<div class="content">
		<!-- 检索-->
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >添加产品</el-button>
		    <el-select v-model="filter.cate_id" filterable clearable default-first-option placeholder="所有分类" class="handle-select mr5">
		        <el-option v-for="item in cateList" :key="item._id" :disabled="!item.parent_id" :label="item.renderName" :value="item._id"></el-option>
		    </el-select>
		    <el-select v-model="filter.isSales" placeholder="所有状态" class="handle-select mr5">
		        <el-option label="出售中" value="1"></el-option>
		        <el-option label="已下架" value="0"></el-option>
		    </el-select>
		    <el-input v-model="filter.keyword" placeholder="产品关键字" class="handle-input mr5"></el-input>
		    <el-button type="primary" icon="el-icon-search" @click="search">搜索</el-button>
		    <el-button icon="el-icon-refresh" @click="resetFilter">重置</el-button>
		</div>

		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 120px)" @sort-change="changeTableSort">
			<el-table-column prop="image" label="产品图片" width="120" align="center">
				<image slot-scope="scope" :src="scope.row.thumb" style="width: 60px;height: 60px;" mode="aspectFill"></image>
			</el-table-column>
			<el-table-column label="产品名称" min-width="200">
				<h4 class="title" slot-scope="scope">{{ scope.row.title }}</h4>
			</el-table-column>
			<el-table-column prop="cate_name" label="分类" width="140" align="center"></el-table-column>
			<el-table-column prop="price" label="价格" sortable="custom" width="120" align="center"></el-table-column>
			<el-table-column prop="sales" label="销量" sortable="custom" width="120" align="center"></el-table-column>
			<el-table-column prop="look_num" label="浏览量" sortable="custom" width="120" align="center"></el-table-column>
			<el-table-column prop="stock" label="库存" sortable="custom" width="120" align="center"></el-table-column>
			<el-table-column prop="status" label="热门推荐" width="120" align="center">
				<!-- switch -->
				<el-switch slot-scope="scope" v-model="scope.row.is_hot" :width="36" :active-value="1" :inactive-value="0" @change="setProductAttr(scope.$index,scope.row, 'is_hot')"></el-switch>
			</el-table-column>
			<el-table-column prop="status" label="是否上架" width="120" align="center">
				<!-- switch -->
				<el-switch slot-scope="scope" v-model="scope.row.is_sales" :width="36" :active-value="1" :inactive-value="0" @change="setProductAttr(scope.$index,scope.row, 'is_sales')"></el-switch>
			</el-table-column>
			<el-table-column label="操作" width="180" align="center">
				<template slot-scope="scope">
					<el-button type="primary" icon="el-icon-edit" @click="edit(scope.row)">编辑</el-button>
					<el-button type="danger" icon="el-icon-delete" @click.native.prevent="toDelete(scope.$index, scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div v-if="loaded" class="pagination">
			<el-pagination background @current-change="pagination" layout="total,prev,pager,next,jumper" :current-page="page" :page-size="pageLimit" :total="totalSize">
			</el-pagination>
		</div>
        <!-- 新增、编辑产品 -->
        <product-manage ref="formDialog" :cateList="cateList" @refreshData="loadList"></product-manage>
	</div>
</template>

<script>
	import productManage from './product-manage'
	export default {
        components: {
            productManage
        },
		data() {
			return {
				orderBy: {add_time: -1},
				
				list: [],
                cateList: [],

				filter: {
                    cate_id: '',
                    isSales: '',
					keyword: '',
				},
			}
		},
		created() {
			this.loadList();
            this.loadCateList();
		},
		methods: {
			/* 获取产品列表 */
			async loadList() {
				const {page, pageLimit, orderBy} = this;
                const sendData = Object.assign({
					offset: (page-1)*pageLimit,
					limit: pageLimit,
					orderBy,
				}, this.getFilterData())
				const response = await this.$request('product', 'getList', sendData);
				this.list = response.data;
				this.totalSize = response.affectedDocs;
				this.loaded = true;
			},
			/* 获取产品分类 */
            async loadCateList(){
				const list = await this.$request('product', 'getCategoryList');
				const prents = list.filter(item=> !item.parent_id);
				let tempArr = [];
				prents.forEach(parent=> {
					tempArr.push(parent)
					tempArr = tempArr.concat(list.filter(item=> item.parent_id === parent._id))
				})
                this.cateList = tempArr.map(item=>{
					item.renderName = item.parent_id ? '├─ ' + item.name : item.name;
					return item;
				});
            },
            // 排序 
            changeTableSort(e){
                this.orderBy =
                    e.order === 'ascending' ? {[e.prop]: 1} :
                    e.order === 'descending' ? {[e.prop]: -1} :
                    {add_time: -1};
                this.page = 1;
                this.loadList();
            },
            // 分页 
            pagination(page){
                this.page = page;
                this.loadList();
            },
			// 上下架修改
			async setProductAttr(index, item, key) {
				const sendData = {
					id: item._id,
					key,
					val: +item[key]
				};
				const response = await this.$request('product', 'setProductAttr', sendData);
				
				if (response.updated !== 1) {
					this.$message.error(response.msg || '操作失败');
					item[key] = item[key] == 1 ? 0 : 1;
                }
			},
            // 删除产品
            toDelete(index, item) {
                this.$confirm(`是否要删除产品：${item.title}`, '删除产品', {
                    confirmButtonText: '删除',
                    type: 'warning'
                }).then(async ()=>{
                    const response = await this.$request('product', 'deleteProduct', {
                    	id: item._id
                    });
                    if (response.status === 1) {
                    	this.$message.success(`${item.title} 已删除`);
                        this.list.splice(index, 1);
                    }else{
                        this.$message.error(response.msg || '删除失败');
                    }
                }).catch(()=>{})
            },
            // 编辑 
            edit(item){
            	this.$refs.formDialog.formData = JSON.parse(JSON.stringify(item));
            	this.$refs.formDialog.formVisible = true;
            },
			//搜索
			search(){
				this.page = 1;
				this.loadList();
			},
            // 重置搜索 
            resetFilter(){
                this.filter = {
                    cate_id: '',
                    isSales: '',
					keyword: '',
				}
            },
            // 获取搜索参数 
            getFilterData(){
                const filter = {};
                for(let key in this.filter){
                    if(this.filter[key]){
                        filter[key] = this.filter[key];
                    }
                }
                return filter;
            }
		}
	}
</script>

<style scoped lang='scss'>
	.mr5{
	    margin-right: 5px !important;
	}
	.mr20{
	    margin-right: 20px !important;
	}
    .handle-select {
        width: 140px;
    }
    .handle-input {
        width: 140px;
        display: inline-block;
    }
</style>
