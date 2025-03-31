<template>
	<div class="content">
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >添加退货地址</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" @sort-change="changeTableSort">
			<el-table-column prop="name" label="收件人" align="left"></el-table-column>
			<el-table-column prop="phone" label="收件人联系电话" align="left"></el-table-column>
			<el-table-column prop="address" label="收件人地址" align="left"></el-table-column>
			<el-table-column prop="status" label="是否启用" width="180" align="center">
				<el-switch slot-scope="scope" v-model="scope.row.status" :width="36" :active-value="1" :inactive-value="0" @change="stateChange(scope.$index,scope.row)"></el-switch>
			</el-table-column>
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
		<manage ref="formDialog" @refreshData="loadList"></manage>
	</div>
</template>

<script>
	import manage from './manage'
	export default {
	    components: {
	        manage
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
				const res = await this.$request('refundAddress', 'getList', {
					offset: (page-1)*pageLimit,
					limit: pageLimit,
				});
				this.list = res.data;
				this.totalSize = res.affectedDocs;
				this.loaded = true;
			},
			/* 删除 */
			toDelete(index, item){
				if(this.list.length === 1){
					this.$message.error('最少有一个启用的退货地址。');
					return;
				}
				this.$confirm(`是否要删除：${item.name}`, '删除提示', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('refundAddress', 'remove', {
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
			/* 启用 | 禁用 */
			async stateChange(index, item) {
				if(item.status != 1){
					this.$message.error('最少有一个启用的退货地址。');
					 item.status = 1;
					return;
				}
				const response = await this.$request('refundAddress', 'setStatus', {
					id: item._id,
					status: item.status
				});
				if (response.updated !== 1) {
					this.$message.error(response.msg || '操作失败');
			        item.status = item.status == 1 ? 0 : 1;
			    }else{
					this.page = 1;
					this.loadList();
				}
			},
		}
	}
</script>

<style scoped lang="scss">
	
</style>
