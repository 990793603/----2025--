<template>
	<div class="order-stat">
		<div class="s-header row">
			<span class="tit">订单统计</span>
			
			<view class="filter-wrap row">
				<span class="item" :class="{active: dateType===1}" @click="onFilterChange(1)">近一月</span>
				<span class="item" :class="{active: dateType===2}" @click="onFilterChange(2)">近一周</span>
				<span class="item" :class="{active: dateType===3}" @click="onFilterChange(3)">近24小时</span>
			</view>
		</div>
		<div class="chrat-wrap">
			<div id="money-chart" style="width: 100%;height:300px;"></div>
		</div>
	</div>
</template>

<script>
	import echarts from 'echarts';
	export default {
		data() {
			return {
				dateType: 1
			}
		},
		mounted() {
			this.loadData();
		},
		methods: {
			async loadData() {
				const dateType = this.dateType;
				const res = await this.$request('dataCenter', 'getOrderStat', {
					dateType
				})
				const list = res;
				res.forEach(item=> {
					let date;
					switch(dateType){
						case 1:
							date = new Date(item.timestamp).getDate();
							date = date < 10 ? '0' + date : '' + date;
							break;
						case 2:
							date = ['周日','周一','周二','周三','周四','周五','周六'][new Date(item.timestamp).getDay()];
							break;
						case 3:
							date = new Date(item.timestamp).getHours()
							date = date < 10 ? '0' + date : '' + date;
							break;
					}
					item.date = date;
				})
				this.list = list;
				this.renderCharts();
			},
			onFilterChange(dateType){
				if(this.dateType === dateType){
					return;
				}
				this.dateType = dateType;
				this.loadData();
			},
			renderCharts() {
				const list = this.list;
				const option = {
					color: ['#549cf9', '#5ccccd'],
					tooltip: {
						trigger: 'axis',
						axisPointer: {
							type: 'shadow'
						}
					},
					legend: {},
					toolbox: {
						show: true,
						orient: 'vertical',
						left: 'right',
						top: 'center'
					},
					grid: {
						left: '60px',
						top: '50px',
						right: '30px',
						bottom: '30px'
					},
					xAxis: [{
						type: 'category',
						axisTick: {
							show: false
						},
						data: list.map(item=> item.date) //['02', '03', '04', '05', '06', '07', '08']
					}],
					yAxis: [{
						type: 'value',
						axisTick: {
							show: false
						},
						splitLine: {
							lineStyle: {
								color: '#e8e8e8'
							}
						}
					}],
					series: [{
							name: '支付金额',
							type: 'bar',
							barGap: 0,
							data: list.map(item=> item.pay_price)  //[875, 128, 4, 332, 300, 334, 390]
						},
						{
							name: '成交金额',
							type: 'bar',
							data: list.map(item=> item.finish_price)  //[694, 128, 1, 182, 300, 234, 290]
						},
					]
				};
				const moneyChart = echarts.init(document.getElementById('money-chart'));
				moneyChart.setOption(option);

				window.onresize = function() {
					moneyChart.resize();
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	.order-stat {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		width: 100%;
		padding-bottom: 10px;
		background-color: #fff;
		border-radius: 4px;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, .04);
	}

	.s-header {
		height: 50px;
		padding: 12px 28px 0;

		.tit {
			flex: 1;
			font-size: 16px;
			font-weight: 600;
			color: #333;
		}
	}
	.filter-wrap{
		
		.item{
			padding: 4px 0;
			margin-left: 14px;
			font-size: 14px;
			color: #333;
			
			&.active{
				font-weight: 700;
				border-bottom: 2px solid #409EFF;
			}
		}
	}
</style>
