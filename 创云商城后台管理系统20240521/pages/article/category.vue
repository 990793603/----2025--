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
		<el-table v-if="loaded" :data="list">
			<el-table-column label="" width="20"></el-table-column>
			<el-table-column label="分类名称">
				<span class="title" slot-scope="scope">{{ scope.row.name }}</span>
			</el-table-column>
			<el-table-column prop="status" label="是否启用" width="190" align="center">
				<el-switch slot-scope="scope" v-model="scope.row.status" :width="36" :active-value="1" :inactive-value="0" @change="stateChange(scope.$index,scope.row)"></el-switch>
			</el-table-column>
			<el-table-column label="操作" width="120" align="center">
				<template slot-scope="scope">
					<el-button type="primary" icon="el-icon-edit" @click="edit(scope.row)">编辑</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 新增 编辑分类 -->
		<category-manage ref="formDialog" @refreshData="loadList"></category-manage>
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
				list: [],
			}
		},
		created() {
			this.loadList();
		},
		methods: {
			/* 获取分类 */
			async loadList(){
				const response = await this.$request('article', 'getCategoryList');
				this.list = response.data;
				this.loaded = true;
			},
			/* 编辑 */
			edit(item){
				this.$refs.formDialog.formData = item;
				this.$refs.formDialog.formVisible = true;
			},
			/* 状态修改 */
			async stateChange(index, row) {
				const response = await this.$request('article', 'setCategoryStatus', {
					id: row._id,
					status: row.status
				});
				if (response.updated !== 1) {
					this.$message.error(response.msg || '操作失败');
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
</style>
