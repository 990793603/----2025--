<template>
	<div class="content">
		<!-- 检索-->
		<div class="handle-box">
		    <el-input v-model="filter.username" placeholder="用户名" class="handle-input mr5"></el-input>
			<el-select v-model="filter.payType" filterable clearable placeholder="支付方式" class="handle-select mr5">
			    <el-option v-for="item in payTypeList" :key="item.type" :label="item.name" :value="item.type"></el-option>
			</el-select>
			<el-select v-model="filter.type" filterable clearable placeholder="类型" class="handle-select mr5">
			    <el-option v-for="item in typeList" :key="item.type" :label="item.name" :value="item.type"></el-option>
			</el-select>
		    <el-button type="primary" icon="el-icon-search" @click="search">搜索</el-button>
		    <el-button icon="el-icon-refresh" @click="filter = {}">重置</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 120px)" @sort-change="changeTableSort">
			<el-table-column prop="image" label="会员" width="70" align="center">
				<image slot-scope="scope" :src="scope.row.user.avatar || '/static/admin/icon/default-avatar.png'" style="width: 40px;height: 40px;border-radius: 100px;" mode="aspectFill"></image>
			</el-table-column>
			<el-table-column prop="user.nickname" width="160"></el-table-column>
			<el-table-column prop="user.username" label="用户名" width="200"></el-table-column>
			<el-table-column label="类型" width="200">
				<span slot-scope="scope">{{ scope.row.type | moneyLogType }}</span>
			</el-table-column>
			<el-table-column prop="title" label="备注"></el-table-column>
			<el-table-column label="资金变动" width="140">
				<span class="money" v-if="scope.row.money < 0" slot-scope="scope">{{ scope.row.money | price }}</span>
				<span class="money income" v-else slot-scope="scope">+{{ scope.row.money | price }}</span>
			</el-table-column>
			<el-table-column label="时间" width="170">
				<span slot-scope="scope">{{ scope.row.add_time | date('Y-m-d H:i:s') }}</span>
			</el-table-column>
			
		</el-table>
		<!-- 分页 -->
		<div v-if="loaded" class="pagination">
			<el-pagination background @current-change="pagination" layout="total,prev,pager,next,jumper" :current-page="page" :page-size="pageLimit" :total="totalSize">
			</el-pagination>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				filter: {},
				payTypeList: [
					{type: 'balance', name: '余额'},
					{type: 'wxpay', name: '微信支付'},
					{type: 'alipay', name: '支付宝'},
					{type: 'system', name: '系统'}
				],
				typeList: [
					{type: 'pay_order', name: '支付订单'},
					{type: 'refund_order', name: '订单退款'},
					{type: 'recharge', name: '充值'},
					{type: 'withdraw', name: '提现'},
					{type: 'commission', name: '分销佣金'},
				],
				list: []
			}
		},
		filters: {
			moneyLogType(type){
				return {
					pay_order: '支付订单',
					refund_order: '订单退款',
					recharge: '充值',
					withdraw: '提现',
					commission: '分销佣金'
				}[type]
			}
		},
		created() {
			this.loadList();
		},
		methods: {
			async loadList(){
				const {page, pageLimit} = this;
				const sendData = {
					offset: (page-1)*pageLimit,
					limit: pageLimit,
					...this.filter
				}
				const res = await this.$request('money', 'getLogList', sendData)
				
				this.list = res.data;
				this.totalSize = res.affectedDocs;
				this.loaded = true;
				console.log(res.data);
			},
			search(){
				this.page = 1;
				this.loadList()
			}
		}
	}
</script>

<style scoped lang="scss">
	.money{
		font-size: 15px;
		color: #ff1f2c;
		font-weight: bold;
		
		&.income{
			color: #19be6b;
		}
	}
	.mr5{
	    margin-right: 5px !important;
	}
	.mr20{
	    margin-right: 20px !important;
	}
	.handle-select {
	    width: 160px;
	}
	.handle-input {
	    width: 160px;
	    display: inline-block;
		
		&.lg{
			width: 170px;
		}
	}
</style>
