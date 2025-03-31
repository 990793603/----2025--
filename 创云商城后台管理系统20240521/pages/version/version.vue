<template>
	<div class="content">
		<div class="handle-box">
		    <el-button
		        type="primary"
		        icon="el-icon-circle-plus-outline"
		        class="mr20"
		        @click="$refs.formDialog.formVisible = true"
		    >发布版本</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" @sort-change="changeTableSort">
			<el-table-column label="" width="20"></el-table-column>
			<el-table-column label="平台" align="left" width="150">
				<text slot-scope="scope">{{ scope.row.platform | platform }}</text>
			</el-table-column>
			<el-table-column label="更新内容" align="left">
				<div slot-scope="scope" class="column">
					<text v-for="(item, index) in scope.row.description.split(';')" :key="index">
						{{ index + 1 }}. {{ item }}
					</text>
				</div>
			</el-table-column>
			<el-table-column label="版本号" width="150">
				<text slot-scope="scope">{{ ('' + scope.row.version).split('').join('.') }}</text>
			</el-table-column>
			<el-table-column prop="add_time" label="发布时间" align="left" width="180">
				<text slot-scope="scope">{{ scope.row.add_time | date('Y-m-d H:i') }}</text>
			</el-table-column>
			<el-table-column label="操作" width="200" align="center">
				<template slot-scope="scope">
					<el-button type="primary" icon="el-icon-download">
						<a :href="scope.row.downloadLink" style="color: #fff;">下载</a>
					</el-button>
					<el-button type="danger" icon="el-icon-delete" @click.native.prevent="toDelete(scope.$index, scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div v-if="loaded" class="pagination">
			<el-pagination background @current-change="pagination" layout="total,prev,pager,next,jumper" :current-page="page" :page-size="pageLimit" :total="totalSize">
			</el-pagination>
		</div>
		<!-- 发布版本 -->
		<version-add ref="formDialog" @refreshData="loadList"></version-add>
	</div>
</template>

<script>
	import versionAdd from './version-add.vue'
	export default {
	    components: {
	        versionAdd
	    },
		filters: {
			platform(platform){
				return {
					android: '安卓'
				}[platform]
			}
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
				const res = await this.$request('version', 'getList', {
					offset: (page-1)*pageLimit,
					limit: pageLimit,
				});
				this.list = res.data;
				this.totalSize = res.affectedDocs;
				this.loaded = true;
			},
			/* 删除 */
			toDelete(index, item){
				this.$confirm(`是否要删除版本`, '删除提示', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('version', 'remove', {
				    	id: item._id
				    });
				    if(response.status === 1){
				    	this.$message.success('删除成功');
				    	this.list.splice(index, 1);
				    }else{
				    	this.$message.error(response.msg);
				    }
				}).catch(()=>{})
			}
		}
	}
</script>

<style scoped lang="scss">
	
</style>
