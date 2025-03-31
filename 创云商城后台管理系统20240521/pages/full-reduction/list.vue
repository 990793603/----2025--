<template>
	<div class="content">
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >添加满减</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 120px)" @sort-change="changeTableSort">
			<el-table-column prop="title" label="名称" align="left"></el-table-column>
			<el-table-column prop="total_money" label="使用金额" align="left"></el-table-column>
			<el-table-column prop="coupon_money" label="减免金额" align="left"></el-table-column>
			<el-table-column label="生效时间">
				<span slot-scope="scope">{{ scope.row.start_time | date('Y-m-d H:i') }}</span>
			</el-table-column>
			<el-table-column label="结束时间">
				<span slot-scope="scope">{{ scope.row.end_time | date('Y-m-d H:i') }}</span>
			</el-table-column>
			<el-table-column prop="status" label="是否启用" align="center">
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
				const sendData = {
					offset: (page-1)*pageLimit,
					limit: pageLimit,
				}
				const response = await this.$request('fullReduction', 'getList', sendData);
				this.list = response.data;
				this.totalSize = response.affectedDocs;
				this.loaded = true;
			},
			/* 启用 | 禁用 */
			async stateChange(index, item) {
				const response = await this.$request('fullReduction', 'setStatus', {
					id: item._id,
					status: item.status
				});
				if (response.updated !== 1) {
					this.$message.error(response.msg || '操作失败');
			        item.status = item.status == 1 ? 0 : 1;
			    }
			},
			/* 删除 */
			toDelete(index, item){
				this.$confirm(`是否要删除导航：${item.name}`, '删除提示', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('fullReduction', 'remove', {
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
			}
		}
	}
</script>

<style scoped lang="scss">
	
</style>
