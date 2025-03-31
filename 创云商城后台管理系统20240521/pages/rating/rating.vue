<template>
	<div class="content">
		<!-- 检索-->
		<div class="handle-box">
			<el-input v-model="filter.content" placeholder="评价内容" class="handle-input lg mr5"></el-input>
			<el-input v-model="filter.reply" placeholder="回复内容" class="handle-input mr5"></el-input>
			<el-select v-model="filter.rating" filterable clearable placeholder="评价星级" class="handle-select mr5">
			    <el-option v-for="item in ratingList" :key="item.val" :label="item.name" :value="item.val"></el-option>
			</el-select>
			
			<div class="btn center" :class="{active: filter.hasContent}" @click="filter.hasContent=!filter.hasContent">
				<span>有内容</span>
			</div>
			<div class="btn center" :class="{active: filter.hasImage}" @click="filter.hasImage=!filter.hasImage">
				<span>有晒图</span>
			</div>
			
		    <el-button type="primary" icon="el-icon-search" @click="search">搜索</el-button>
		    <el-button icon="el-icon-refresh" @click="filter = {}">重置</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 120px)">
			<el-table-column label="产品图片" width="120" align="center">
				<image slot-scope="scope" :src="scope.row.product.thumb" style="width: 60px;height: 60px;" mode="aspectFill"></image>
			</el-table-column>
			<el-table-column prop="product.title" label="产品名称"></el-table-column>
			<el-table-column label="评价用户" width="130">
				<div slot-scope="scope" class="column">
					<span>{{ scope.row.user.username }}</span>
					<span>{{ scope.row.user.nickname }}</span>
				</div>
			</el-table-column>
			<el-table-column label="评价星级" width="130">
				<template slot-scope="scope">
					<span class="mix-icon icon-iconfontxingxing" :class="{active: scope.row.rating >= 1}"></span>
					<span class="mix-icon icon-iconfontxingxing" :class="{active: scope.row.rating >= 2}"></span>
					<span class="mix-icon icon-iconfontxingxing" :class="{active: scope.row.rating >= 3}"></span>
					<span class="mix-icon icon-iconfontxingxing" :class="{active: scope.row.rating >= 4}"></span>
					<span class="mix-icon icon-iconfontxingxing" :class="{active: scope.row.rating >= 5}"></span>
				</template>
			</el-table-column>
			<el-table-column label="晒图" width="110">
				<div v-if="scope.row.images && scope.row.images.length > 0" slot-scope="scope" class="column">
					<span style="color: #409EFF;" @click="previewImage(scope.row)">查看图片</span>
				</div>
			</el-table-column>
			<el-table-column prop="content" label="评价内容" min-width="200"></el-table-column>
			<el-table-column prop="reply" label="回复内容" min-width="200"></el-table-column>
			<el-table-column label="是否启用" width="120" align="center">
				<el-switch slot-scope="scope" v-model="scope.row.is_disabled" :width="36" :active-value="0" :inactive-value="1" @change="setDisabled(scope.$index,scope.row)"></el-switch>
			</el-table-column>
			<el-table-column label="操作" width="120" align="center">
				<template slot-scope="scope">
					<el-button type="primary" icon="el-icon-edit" @click="reply(scope.row)">回复</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div v-if="loaded" class="pagination">
			<el-pagination background @current-change="pagination" layout="total,prev,pager,next,jumper" :current-page="page" :page-size="pageLimit" :total="totalSize">
			</el-pagination>
		</div>
		<!-- 回复面板 -->
		<reply ref="reply" @refreshData="loadList"></reply>
		
		<!-- 查看大图 -->
		<el-image-viewer 
			v-if="showImageViewer" 
			:on-close="closeImageViewer" 
			:url-list="curItem.images" 
		></el-image-viewer>
	</div>
</template>

<script>
	import ElImageViewer from 'element-ui/packages/image/src/image-viewer'
	import reply from './components/reply.vue'
	export default {
		components: {
			ElImageViewer,
			reply
		},
		data() {
			return {
				curItem: {},
				showImageViewer: false,
				ratingList: [
					{name: '一星', val: 1},
					{name: '二星', val: 2},
					{name: '三星', val: 3},
					{name: '四星', val: 4},
					{name: '五星', val: 5}
				],
				filter: {
					hasImage: false,
					hasContent: false,
				},
				list: [],
			}
		},
		created() {
			this.loadList();
		},
		methods: {
			// 获取列表
			async loadList() {
				const {page, pageLimit} = this;
		        const sendData = {
					offset: (page-1)*pageLimit,
					limit: pageLimit,
					...this.filter
				}
				const res = await this.$request('rating', 'get', sendData);
				this.list = res.data;
				this.totalSize = res.affectedDocs;
				this.loaded = true;
				console.log(res, '----');
			},
			//禁用
			async setDisabled(index, item){
				const is_disabled = item.is_disabled;
				const res = await this.$request('rating', 'setDisabled', {
					id: item._id,
					is_disabled
				});
				if (res.updated !== 1) {
					this.$message.error(res.msg || '操作失败');
					item.is_disabled = +!is_disabled;
				}
			},
			//回复
			reply(item){
				this.$refs.reply.open(item);
			},
			search(){
				this.page = 1;
				this.loadList()
			},
			//查看图片
			previewImage(item){
				this.curItem = item;
				this.showImageViewer = true;
			},
			closeImageViewer(){
				this.showImageViewer = false;
			}
		}
	}
</script>

<style scoped lang="scss">
	.icon-iconfontxingxing{
		color: #ccc;
		
		&.active{
			color: orange;
		}
	}
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
	    width: 150px;
	    display: inline-block;
	}
	.btn{
		height: 31px;
		padding: 0 10px;
		margin-right: 5px;
		border: 1px solid #DCDFE6;
		background-color: #fff;
		border-radius: 3px;
		
		span{
			font-size: 12px;
			color: #606266;
		}
		&.active{
			border-color: #409EFF;
			
			span{
				color: #409EFF;
			}
		}
	}
	/deep/ .el-icon-circle-close{
		color: #fff;
		font-size: 24px;
	}
	/deep/ .el-image-viewer__mask{
		opacity: .7;
	}
</style>
