<template>
	<div class="content">
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >添加分类</el-button>
		</div>
		
		<!-- 列表 -->
		<el-table 
			v-if="loaded" 
			:data="cateList" 
			height="calc(100% - 60px)"
			:tree-props="{children: 'children', hasChildren: 'hasChildren'}"
			row-key="_id"
		>
			<el-table-column label="分类名称" width="170">
				<span class="title" :class="{bold:!scope.row.parent_id}" slot-scope="scope">{{ scope.row.name }}</span>
			</el-table-column>
			<el-table-column prop="image" label="分类图片">
				<image class="cate-pic" :class="{small: scope.row.parent_id}" slot-scope="scope" :src="scope.row.image" mode="aspectFill"></image>
			</el-table-column>
			
			<el-table-column prop="sort" label="排序" width="150" align="center"></el-table-column>
			<el-table-column prop="status" label="是否启用" width="190" align="center">
				<el-switch slot-scope="scope" v-model="scope.row.status" :width="36" :active-value="1" :inactive-value="0" @change="stateChange(scope.$index,scope.row)"></el-switch>
			</el-table-column>
			<el-table-column label="操作" width="200" align="center">
				<template slot-scope="scope">
					<el-button type="primary" icon="el-icon-edit" @click="edit(scope.row)">编辑</el-button>
					<el-button type="danger" icon="el-icon-delete" @click.native.prevent="toDelete(scope.$index, scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 新增 编辑分类 -->
		<category-manage ref="formDialog" :cateList="cateList" @refreshData="loadCateList"></category-manage>
	</div>
</template>

<script>
	import categoryManage from './category-manage'
		export default {
		components: {
			categoryManage
		},
		data() {
			return {
				cateList: [],
			}
		},
		created() {
			this.loadCateList();
		},
		methods: {
			/* 获取产品分类 */
			async loadCateList(){
				const list = await this.$request('product', 'getCategoryTreeList');
				list.forEach(parent=> {
					for(let i=0; i< parent.children.length; i++){
						let item = parent.children;
						item.renderName = i === parent.children.length - 1 ? '└─ ' + item.name : '├─ ' + item.name;
					}
				})
				this.cateList = list;
				console.log(list);
				this.loaded = true;
			},
			/* 编辑 */
			edit(item){
				this.$refs.formDialog.formData = item;
				this.$refs.formDialog.formVisible = true;
			},
			/* 删除 */
			async toDelete(index, item){
				if(item.children && item.children.length > 0){
					this.$message.error(`${item.name}包含子分类，无法删除`);
					return;
				}
				this.$confirm(`是否要删除分类：${item.name}`, '删除分类', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
					const response = await this.$request('product', 'deleteCategory', {
						id: item._id
					});
					if(response.status === 1){
						this.$message.success('分类删除成功');
						this.loadCateList();
					}else{
						this.$message.error(response.msg);
					}
				}).catch(()=>{})
			},
			/* 状态修改 */
			async stateChange(index, row) {
				const response = await this.$request('product', 'setCategoryStatus', {
					id: row._id,
					status: row.status
				});
				if (response.updated !== 1) {
					this.$message.error(response.msg ||'操作失败');
			        row.status = row.status == 1 ? 0 : 1;
			    }
			}
		}
	}
</script>

<style scoped lang="scss">
	.handle-box {
	    display: flex;
	    align-items: center;
	    padding: 12px 10px;
	    background-color: #fff;
	    border-bottom: 1px solid #f0f0f0;
	    margin-bottom: 5px;
	}
	.title{
		font-size: 14px;
		color: #606266;
		
		&.bold{
			color: #303133;
			font-weight: bold;
		}
	}
	.cate-pic{
		display: block; 
		width: 132px;
		height: 50px; 
		border-radius: 4px;
		
		&.small{
			width: 50px;
			height: 50px; 
		}
	}
</style>
