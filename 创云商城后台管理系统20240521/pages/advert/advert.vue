<template>
	<div class="content">
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >添加广告</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" @sort-change="changeTableSort">
			<el-table-column prop="image" label="广告图片" width="120" align="center">
				<image slot-scope="scope" :src="scope.row.image" style="width: 60px;height: 60px;" mode="aspectFill"></image>
			</el-table-column>
			<el-table-column prop="name" label="广告名称" width="200" align="left"></el-table-column>
			<el-table-column label="广告位" width="200" align="left">
				<span slot-scope="scope">{{ typeList[scope.row.advert_type] }}</span>
			</el-table-column>
			<el-table-column prop="link" label="链接地址" align="left"></el-table-column>
			<el-table-column prop="sort" label="排序" width="180" align="center"></el-table-column>
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
		
		<!-- 新增、编辑 -->
		<advert-manage ref="formDialog" @refreshData="loadList"></advert-manage>
	</div>
</template>

<script>
	import advertManage from './advert-manage'
	export default {
	    components: {
	        advertManage
	    },
		data() {
			return {
				typeList: {
					carousel: '首页轮播图',
					middle: '首页中部广告位'
				},
				list: []
			}
		},
		created() {
			this.loadList();
		},
		methods: {
			async loadList() {
				const response = await this.$request('advert', 'getList', {
					type: 'advert'
				});
				this.list = response.data;
				this.loaded = true;
			},
			/* 启用 | 禁用 */
			async stateChange(index, item) {
				const response = await this.$request('advert', 'setStatus', {
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
				this.$confirm(`是否要删除广告：${item.name}`, '删除提示', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('advert', 'deleteAdvert', {
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
