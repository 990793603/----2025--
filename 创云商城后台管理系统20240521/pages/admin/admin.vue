<template>
	<div class="content">
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >添加管理员</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 60px)" @sort-change="changeTableSort">
			<el-table-column prop="username" label="管理员帐号" align="left"></el-table-column>
			<el-table-column prop="roles[0].name" label="分组" align="left"></el-table-column>
			<el-table-column label="添加时间">
				<span slot-scope="scope">{{ scope.row.register_date | date('Y-m-d H:i') }}</span>
			</el-table-column>
			<el-table-column label="最后登录">
				<span slot-scope="scope">{{ scope.row.last_login_date | date('Y-m-d H:i') }}</span>
			</el-table-column>
			<el-table-column prop="last_login_ip" label="最后登录ip" align="left"></el-table-column>
			<el-table-column prop="status" label="状态" align="center">
				<el-switch slot-scope="scope" v-model="scope.row.status" :width="36" :active-value="0" :inactive-value="1" @change="setStatus(scope.$index,scope.row)"></el-switch>
			</el-table-column>
			<el-table-column label="操作" width="200" align="center">
				<template slot-scope="scope">
					<el-button type="primary" icon="el-icon-edit" @click="edit(scope.row)">编辑</el-button>
					<el-button type="danger" icon="el-icon-delete" @click.native.prevent="toDelete(scope.$index, scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		
		<!-- 新增、编辑 -->
		<admin-manage ref="formDialog" :roleList="roleList" @refreshData="loadList"></admin-manage>
	</div>
</template>

<script>
	import adminManage from './admin-manage'
	export default {
	    components: {
	       adminManage
	    },
		data() {
			return {
				roleList: [],
				list: []
			}
		},
		created() {
			this.loadList();
			this.loadRoleList();
		},
		methods: {
			async loadList() {
				const response = await this.$request('admin', 'getList');
				this.list = response.data;
				this.loaded = true;
			},
			/* 获取分组 */
			async loadRoleList(){
				const res = await this.$request('admin', 'getRoles');
				this.roleList = res.data;
			},
			/* 删除 */
			toDelete(index, item){
				this.$confirm(`是否要删除管理员：${item.username}`, '删除提示', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('admin', 'deleteAdmin', {
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
			// 是否禁用
			async setStatus(index, item) {
				if(item.username === this.$store.state.user.userInfo.username){
					this.$message.error('无法禁用当前登录账户');
					item.status = item.status == 1 ? 0 : 1;
					return;
				}
				const sendData = {
					id: item._id,
					status: +item.status
				}
				const response = await this.$request('admin', 'setAdminStatus', sendData);
				if (response.status !== 1) {
					this.$message.error(response.msg || '操作失败');
					item.status = item.status == 1 ? 0 : 1;
			    }
			},
			/* 编辑 */
			edit(item){
				/* if(item.name === '超级管理员'){
					this.$message.error('不能编辑超级管理员');
					return;
				} */
				this.$refs.formDialog.formData = JSON.parse(JSON.stringify(item));
				this.$refs.formDialog.formVisible = true;
			}
		}
	}
</script>

<style scoped lang="scss">
	
</style>
