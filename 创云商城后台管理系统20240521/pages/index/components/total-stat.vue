<template>
	<div class="total-stat">
		<div class="info-wrap">
			<div class="s-header row">
				<span class="tit">数据统计</span>
			</div>
			<div class="info-list">
				<div class="item" @click="navTo('money-log')">
					<span class="tit">销售总额</span>
					<span>￥{{ data.saleTotal | price }}</span>
				</div>
				<div class="item" @click="navTo('user')">
					<span class="tit">会员总数</span>
					<span>{{ data.userCount }}</span>
				</div>
				<div class="item">
					<span class="tit">支付笔数</span>
					<span>{{ data.payOrderCount }}</span>
				</div>
				<div class="item">
					<span class="tit">成交笔数</span>
					<span>{{ data.finishedOrderCount }}</span>
				</div>
			</div>
		</div>
		<div class="info-wrap">
			<div class="s-header row">
				<span class="tit">待办事项</span>
			</div>
			<div class="info-list">
				<div class="item" @click="navTo('order', {status: 1})">
					<span class="tit">待发货订单</span>
					<span>{{ data.deliverOrderCount }}</span>
				</div>
				<div class="item">
					<span class="tit">提现申请</span>
					<span>{{ data.withdrawCount }}</span>
				</div>
				<div class="item">
					<span class="tit">库存预警</span>
					<span>{{ data.stockCount }}</span>
				</div>
				<div class="item">
					<span class="tit">用户反馈</span>
					<span>{{ data.feedbackCount }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				data: {}
			}
		},
		created() {
			this.loadData();
		},
		methods: {
			async loadData(){
				const res = await this.$request('dataCenter', 'getTotalStat')
				res.saleTotal = - res.saleTotal; //云函数写错了，价格了-号，这里直接改过来，不改云函数了
				this.data = res;
			},
			navTo(name, params={}){
				this.$router.push({
					name,
					params
				});
			}
		}
	}
</script>

<style scoped lang="scss">
	.total-stat {
		flex-shrink: 0;
		display: flex;
		width: 100%;
	}
	.info-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		background-color: #fff;
		border-radius: 4px;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, .04);
	
		&:first-child {
			margin-right: 16px;
		}
	}
	.s-header {
		height: 50px;
		padding: 12px 28px 0;
	
		.tit {
			font-size: 18px;
			font-weight: 600;
			color: #333;
		}
	}
	.info-list {
		flex: 1;
		display: flex;
		flex-wrap: wrap;

		.item {
			flex: 1;
			display: flex;
			flex-direction: column;
			padding: 20px 30px;
		}
		span {
			font-size: 24px;
			color: #409EFF;
		}
		.tit {
			margin-bottom: 16px;
			font-size: 14px;
			color: #333;
		}
	}
</style>
