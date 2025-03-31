<template>
	<div class="content">
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >添加物流公司</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" @sort-change="changeTableSort">
			<el-table-column prop="image" label="logo" align="center" width="140">
				<image slot-scope="scope" :src="scope.row.logo" style="width: 60px;height: 60px;" mode="aspectFill"></image>
			</el-table-column>
			<el-table-column prop="name" label="公司名称" align="left"></el-table-column>
			<el-table-column prop="phone" label="公司客服电话" align="left"></el-table-column>
			<el-table-column prop="code" label="公司代码" align="left"></el-table-column>
			
			<el-table-column label="操作" width="200" align="center">
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
		<!-- 新增、编辑 -->
		<exp-manage ref="formDialog" @refreshData="loadList"></exp-manage>
	</div>
</template>

<script>
	import expManage from './exp-manage'
	export default {
	    components: {
	        expManage
	    },
		data() {
			return {
				list: []
			}
		},
		created() {
			this.loadList();
		},
		methods: {
			async loadList() {
				const {page, pageLimit} = this;
				const res = await this.$request('express', 'getList', {
					offset: (page-1)*pageLimit,
					limit: pageLimit,
				});
				this.list = res.data;
				this.totalSize = res.affectedDocs;
				this.loaded = true;
			},
			/* 删除 */
			toDelete(index, item){
				this.$confirm(`是否要删除：${item.name}`, '删除提示', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('express', 'remove', {
				    	id: item._id
				    });
				    if(response.status === 1){
				    	this.$message.success('删除成功');
				    	this.list.splice(index, 1);
				    }else{
				    	this.$message.error(response.msg);
				    }
				}).catch(()=>{})
			},
			/* 编辑 */
			edit(item){
				this.$refs.formDialog.formData = JSON.parse(JSON.stringify(item));
				this.$refs.formDialog.formVisible = true;
			},
		}
	}
</script>

<style scoped lang="scss">
	
</style>
