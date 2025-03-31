<template>
	<view class="content">
		<!-- 检索-->
		<div class="handle-box">
			<el-input v-model="filter.order_number" placeholder="订单号" class="handle-input lg mr5"></el-input>
		    <el-input v-model="filter.username" placeholder="用户名" class="handle-input mr5"></el-input>
			<el-input v-model="filter.addr_name" placeholder="收件人姓名" class="handle-input mr5"></el-input>
			<el-select v-model="filter.status" filterable clearable default-first-option placeholder="订单状态" class="handle-select mr5">
			    <el-option v-for="item in statusList" :key="item.status" :label="item.name" :value="item.status"></el-option>
			</el-select>
		    <el-button type="primary" icon="el-icon-search" @click="search">搜索</el-button>
		    <el-button style="margin-top: 0;margin-left: 5px;" icon="el-icon-refresh" @click="filter = {}">重置</el-button>
			<div class="fill"></div>
			<el-upload action="123" :http-request="batchShipment" list-type="text" :show-file-list="false">
				<el-button size="small">批量发货</el-button>
			</el-upload>
			<el-button style="margin: 0 0 0 16px;" type="primary" @click="exportExcel">导出订单</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 120px)" @sort-change="changeTableSort">
			<el-table-column label="购买商品">
				<template slot-scope="scope">
					<div v-if="index === 0 || scope.row.showAll" class="g-cell row" v-for="(item, index) in scope.row.products" :key="index">
						<image class="pic" :src="item.image" mode="aspectFill"></image>
						<div class="right column">
							<span class="title">{{ item.title }}</span>
							<div class="bot row">
								<span v-if="item.sku.name" class="attr">{{ item.sku.name }}</span>
								<span class="num">x {{ item.number }}</span>
							</div>
						</div>
					</div>
					<div v-if="scope.row.products.length > 1" class="more-btn center" @click="showAllProducts(scope.row)">
						<span>{{ scope.row.showAll ? '收起' : '查看更多' }}</span>
					</div>
				</template>
			</el-table-column>
			
			<el-table-column prop="order_number" label="订单号" width="180"></el-table-column>
			<el-table-column prop="user.username" label="购买用户" width="130">
				<div slot-scope="scope" class="column">
					<span>{{ scope.row.user.username }}</span>
					<span>{{ scope.row.user.nickname }}</span>
				</div>
			</el-table-column>
			<el-table-column label="实际支付金额" width="120">
				<span slot-scope="scope">{{ scope.row.price_data.pay_price | price }}</span>
			</el-table-column>
			<el-table-column label="优惠金额" width="110">
				<div slot-scope="scope">
					<span>{{ (scope.row.price_data.coupon_money + scope.row.price_data.full_reduction_money) | price }}</span>
				</div>
			</el-table-column>
			<el-table-column label="支付状态" width="130">
				<span slot-scope="scope">{{ scope.row.pay_status === 1 ? '已支付' : '未支付' }}</span>
			</el-table-column>
			<el-table-column label="订单状态" width="130">
				<span class="status-text" :class="'status-text-' + scope.row.status" slot-scope="scope">{{ scope.row.status_text }}</span>
			</el-table-column>
			
			<el-table-column fixed="right" label="操作" width="130" align="center">
				<template slot-scope="scope">
					<el-button type="primary" plain icon="el-icon-document-remove" @click="showDetail(scope.row)">详情</el-button>
					<el-button type="primary" v-if="scope.row.status===1" icon="el-icon-truck" @click="deliveryOrder(scope.row)">发货</el-button>
					<el-button type="danger" v-if="scope.row.status===12" @click="refuseReturnProduct(scope.row)">拒绝申请</el-button>
					<el-button type="warning" v-if="scope.row.status===12" @click="agreeReturnProduct(scope.row)">同意申请</el-button>
					<el-button type="danger" v-if="scope.row.status===14" @click="refuseRefund(scope.row)">拒绝退款</el-button>
					<el-button type="warning" v-if="scope.row.status===14" @click="agreeRefund(scope.row)">同意退款</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div v-if="loaded" class="pagination">
			<el-pagination background @current-change="pagination" layout="total,prev,pager,next,jumper" :current-page="page" :page-size="pageLimit" :total="totalSize">
			</el-pagination>
		</div>
		
		<!-- 发货面板 -->
		<delivery-order ref="deliveryOrder" @refreshData="loadList"></delivery-order>
		<!-- 订单详情 -->
		<detail ref="detail"></detail>
	</view>
</template>

<script>
	import XLSX from 'xlsx'
	import deliveryOrder from './components/delivery-order.vue'
	import detail from './components/detail.vue'
	export default {
		components: {
			deliveryOrder,
			detail
		},
		data() {
			return {
				filter: {},
				statusList: [
					{status: 0, name: '待付款'},
					{status: 1, name: '待发货'},
					{status: 2, name: '待收货'},
					{status: 3, name: '待评价'},
					{status: 4, name: '已完成'},
					{status: 10, name: '已关闭'},
					{status: 11, name: '已取消'},
					{status: 12, name: '申请退货'},
					{status: 13, name: '拒绝退货申请'}, //拒绝退货已完成
					{status: 14, name: '正在退货'},
					{status: 15, name: '退货完成'},
					{status: 16, name: '拒绝退款'}
				],
				list: [],
			}
		},
		created() {
			if(this.$route.params.status){
				this.filter.status = this.$route.params.status;
			}
			this.loadList();
		},
		methods: {
			/* 获取订单列表 */
			async loadList() {
				const {page, pageLimit} = this;
				const sendData = {
					offset: (page-1)*pageLimit,
					limit: pageLimit,
					...this.filter
				}
				const response = await this.$request('order', 'getList', sendData);
				this.list = response.data;
				this.totalSize = response.affectedDocs;
				this.loaded = true;
				console.log(response);
			},
			//批量发货
			batchShipment(content) {
				this._loading = this.$loading({
					background: 'rgba(0,0,0,0)',
					fullscreen: true
				});
				const file = content.file
				const types = file.name.split('.')[1]
				const fileType = ['xlsx', 'xlc', 'xlm', 'xls', 'xlt', 'xlw', 'csv'].some(item => item === types)
				if (!fileType) {
					this.$message('格式错误！请重新选择')
					return
				}
				this.file2Xce(file).then(tabJson => {
					console.log('开始', + new Date());
					const list = [];
					tabJson[0].sheet.forEach(item=> {
						if(item['订单状态'] === '待发货' && item['快递代码'] && item['快递单号']){
							list.push({
								order_number: item['订单号'],
								shipper_code: item['快递代码'],
								logistic_code: item['快递单号']
							})
						}
					})
					const resList = [];
					list.forEach(item=> {
						this.$request('order', 'batchShipment', {
							...item
						}).then(res=>{
							resList.push(res);
						})
					})
					this.checkBatchShipmentRes(resList, list);
				})
			},
			checkBatchShipmentRes(resList, list){
				if(resList.length === list.length){
					console.log('完成', + new Date());
					this._loading.close();
					const count = resList.filter(item=> item.status == 1).length;
					this.$message.success('操作成功，共发货' + count + '个订单');
					this.loadList();
				}else{
					setTimeout(()=>{
						this.checkBatchShipmentRes(resList, list);
					}, 500)
				}
			},
			file2Xce(file) {
				return new Promise(function(resolve, reject) {
					const reader = new FileReader()
					reader.onload = function(e) {
						const data = e.target.result
						this.wb = XLSX.read(data, {
							type: 'binary'
						})
						const result = []
						this.wb.SheetNames.forEach((sheetName) => {
							result.push({
								sheetName: sheetName,
								sheet: XLSX.utils.sheet_to_json(this.wb.Sheets[sheetName])
							})
						})
						resolve(result)
					}
					reader.readAsBinaryString(file) // 传统input方法
				})
			},
			//导出订单
			async exportExcel() {
				const res = await this.$request('order', 'exportOrderExcel', this.filter);
				console.log(res);
				if (res.status === 1) {
					window.open(res.url);
				} else {
					this.$message.error(res.msg || '导出失败');
				}
			},
			//搜索
			search(){
				this.page = 1;
				this.loadList()
			},
			//发货
			deliveryOrder(item){
				this.$refs.deliveryOrder.data = JSON.parse(JSON.stringify(item));
				this.$refs.deliveryOrder.formVisible = true;
			},
			//拒绝退货申请
			refuseReturnProduct(item){
				this.$confirm('是否要拒绝买家的退货申请？', '拒绝退货申请', {
					 confirmButtonText: '拒绝申请',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('order', 'refuseReturnProduct', {
				    	order_id: item._id
				    });
				    if (response.status === 1) {
				    	this.$message.success('操作成功');
				        this.page = 1;
				        this.loadList()
				    }else{
				        this.$message.error(response.msg || '操作失败');
				    }
				})
			},
			//同意退货申请
			agreeReturnProduct(item){
				this.$confirm('是否要同意买家的退货申请？', '同意退货申请', {
					 confirmButtonText: '同意申请',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('order', 'agreeReturnProduct', {
				    	order_id: item._id
				    });
				    if (response.status === 1) {
				    	this.$message.success('操作成功');
				        this.page = 1;
				        this.loadList()
				    }else if(response.status === 2){
						this.$confirm('未设置退货邮寄地址，无法同意退货申请', '提示', {
							 confirmButtonText: '立即设置',
						    type: 'warning'
						}).then(async ()=>{
							this.$router.push({
								name: 'refund-address'
							});
						})
					}else{
				        this.$message.error(response.msg || '操作失败');
				    }
				})
			},
			//退货申请通过后拒绝退款
			refuseRefund(item){
				this.$confirm('是否要拒绝为买家退款，请谨慎操作', '拒绝退款', {
					 confirmButtonText: '拒绝退款',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('order', 'refuseRefund', {
				    	order_id: item._id
				    });
				    if (response.status === 1) {
				    	this.$message.success('操作成功');
				        this.page = 1;
				        this.loadList()
				    }else{
				        this.$message.error(response.msg || '操作失败');
				    }
				})
			},
			//退货申请通过后同意退款
			agreeRefund(item){
				this.$confirm('请确认您已收到寄回商品且检查无误后再退款，同意后订单付款将直接退回用户支付账户？', '同意退款', {
					 confirmButtonText: '直接退款',
				    type: 'warning'
				}).then(async ()=>{
				    const response = await this.$request('order', 'agreeRefund', {
				    	order_id: item._id
				    });
				    if (response.status === 1) {
				    	this.$message.success('操作成功');
				        this.page = 1;
				        this.loadList()
				    }else{
				        this.$message.error(response.msg || '操作失败');
				    }
				})
			},
			//查看详情
			showDetail(item){
				this.$refs.detail.open(item);
			},
			showAllProducts(item){
				this.$set(item, 'showAll', !item.showAll);
			}
		}
	}
</script>

<style scoped lang="scss">
	/deep/ {
		.el-button--primary.is-plain{
			background: #fff;
			
			&:hover{
				color: #409EFF;
			}
		}
		.el-button+.el-button{
			margin: 6px 0 0 0;
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
	    width: 140px;
	    display: inline-block;
		
		&.lg{
			width: 170px;
		}
	}
	.status-text{
		font-size: 15px;
		color: #409EFF;
		font-weight: bold;
		
		&-0{
			color: #ff0000
		}
		&-3, &-4{
			color: #67c23a;
		}
		&-10, &-11, &-15{
			color: #999;
		}
		&-12, &-13, &-14{
			color: #E6A23C;
		}
	}
	.g-cell{
		padding: 10px 0 10px 5px;
		
		&:last-child{
			margin-bottom: 0;
		}
		.pic{
			flex-shrink: 0;
			width: 50px;
			height: 50px;
			margin-right: 10px;
		}
		.title{
			font-size: 14px;
			color: #333;
		}
		.bot{
			font-size: 12px;
			color: #999;
		}
		.attr{
			margin-right: 10px;
		}
	}
	.more-btn{
		width: 60px;
		margin-left: 1px;
		color: #409EFF;
	}
</style>
