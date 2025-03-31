<template>
	<view class="content">
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 60px)" @sort-change="changeTableSort">
			<el-table-column label="用户" width="150">
				<div slot-scope="scope" class="column">
					<span>{{ scope.row.user.username }}</span>
					<span>{{ scope.row.user.nickname }}</span>
				</div>
			</el-table-column>
			<el-table-column prop="name" label="姓名" width="130"></el-table-column>
			<el-table-column prop="mobile" label="联系方式" width="150"></el-table-column>
			<el-table-column prop="content" label="内容"></el-table-column>
			<el-table-column prop="content" label="提交时间" width="180" align="center">
				<span slot-scope="scope">{{ scope.row.add_time | date('Y-m-d H:i') }}</span>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div v-if="loaded" class="pagination">
			<el-pagination background @current-change="pagination" layout="total,prev,pager,next,jumper" :current-page="page" :page-size="pageLimit" :total="totalSize">
			</el-pagination>
		</div>
		
		<!-- 充值面板 -->
		<recharge ref="recharge" @refreshData="loadList"></recharge>
	</view>
</template>

<script>
	import recharge from './components/recharge.vue'
	export default {
		components: {
			recharge
		},
		data() {
			return {
				filter: {},
				orderBy: {},
				list: [],
				pageLimit: 20,
			}
		},
		created() {
			this.loadList();
		},
		methods: {
			// 获取列表
			async loadList() {
				const {page, pageLimit, filter} = this;
				const sendData = {
					offset: (page-1)*pageLimit,
					limit: pageLimit
				}
				const res = await this.$request('feedback', 'get', sendData);
				console.log(res);
				this.totalSize = res.affectedDocs;
				this.list = res.data;
				this.loaded = true;
			},
			//封禁、解封
			changeStatus(item){
				const tip = item.status===2?'解封':'封禁';
				this.$confirm(`确定要${tip}用户${item.username}吗`, `用户${tip}`, {
				    confirmButtonText: '确定',
				    type: 'warning'
				}).then(async ()=>{
				    const res = await this.$request('user', 'changeStatus', {
				    	uid: item._id,
						status: item.status == 1 ? 0 : 1
				    });
				    if (res.status === 1) {
				    	this.$message.success(`已${tip}用户`);
						this.loadList();
				    }else{
				        this.$message.error(`${tip}失败`);
				    }
				})
			},
			//发货
			recharge(item){
				this.$refs.recharge.formData = {
					uid: item._id
				}
				this.$refs.recharge.formVisible = true;
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
			//搜索
			search(){
				this.page = 1;
				this.loadList()
			},
		}
	}
</script>

<style scoped lang="scss">
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
