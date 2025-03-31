<template>
	<div class="hot-product">
		<div class="wrap">
			<div class="s-header row">
				<span class="tit">热销排行</span>
			</div>
			<div class="row cell table-header">
				<span class="key fill">商品</span>
				<span class="val">浏览量</span>
				<span class="val">销量</span>
			</div>
			<div class="row cell" v-for="(item, index) in list" :key="index">
				<div class="rank center">
					<span v-if="index<=2" class="mix-icon icon-paihang" :class="'rank-icon'+index"></span>
					<span v-else class="number">{{ index + 1 }}</span>
				</div>
				<image class="avatar" :src="item.thumb" mode="aspectFill"></image>
				<span class="name clamp">{{ item.title }}</span>
				<span class="val">{{ item.look_num || 0 }}</span>
				<span class="val">{{ item.sales || 0 }}</span>
			</div>
		</div>
		<div class="wrap cate-wrap">
			<div class="s-header row">
				<span class="tit">销售分类占比</span>
			</div>
			
			<div id="cate-chart" style="width: 100%;height:300px;"></div>
			
		</div>
	</div>
</template>

<script>
	import echarts from 'echarts';
	export default {
		data() {
			return {
				list: [],
				categoryList: []
			}
		},
		mounted() {
			this.loadProduct();
			this.loadCategory();
		},
		methods: {
			async loadProduct() {
				const list = await this.$request('dataCenter', 'getProductRank');
				this.list = list;
			},
			async loadCategory(){
				const list = await this.$request('dataCenter', 'getProductCategoryRank');
				this.categoryList = list;
				this.renderCharts();
			},
			renderCharts() {
				const categoryList = this.categoryList;
				const option = {
					tooltip: {
						trigger: 'item',
						formatter: '{b}: {c} ({d}%)'
					},
					legend: {
						type: 'scroll',
						orient: 'vertical',
						right: 40,
						top: 'center',
						data: categoryList.map(item=> item.cateName)
					},
					color: ['#549cf9', '#ebd450', '#5ccccd', '#f64963', '#8e4fe1'],
					series: [{
						type: 'pie',
						name: '',
						radius: ['50%', '70%'],
						center: ['40%', '50%'],
						data: categoryList.map(item=> {
							return {
								name: item.cateName,
								value: item.num
							}
						})
					}]
				};
				const cateChart = echarts.init(document.getElementById('cate-chart'));
				cateChart.setOption(option);
			}
		}
	}
</script>

<style scoped lang="scss">
	.hot-product{
		flex: 2;
		min-width: 450px;
		margin-left: 16px;
	}
	.wrap{
		height: 620px;
		background-color: #fff;
		border-radius: 4px;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, .04);
	}
	.cate-wrap{
		margin-top: 16px;
		height: 360px;
	}
	.s-header {
		height: 50px;
		padding: 12px 28px 0;
	
		.tit {
			font-size: 16px;
			font-weight: 600;
			color: #333;
		}
	}
	.cell{
		height: 52px;
		padding: 0 30px 0 24px;
		
		&.table-header{
			height: 40px;
			padding-left: 28px;
			
			.key, .val{
				font-size: 14px;
				color: #999;
			}
		}
		.rank{
			width: 24px;
			margin-right: 10px;
			
			.icon-paihang{
				font-size: 17px;
				color: #fce66f;
			}
			.rank-icon1{
				color: #c4d7e2;
			}
			.rank-icon2{
				color: #fbc78b;
			}
			.number{
				font-size: 15px;
				color: #333;
			}
		}
		.avatar{
			width: 36px;
			height: 36px;
			margin-right: 20px;
			border-radius: 100px;
		}
		.name{
			flex: 1;
			font-size: 14px;
			color: #666;
		}
		.val{
			flex-shrink: 0;
			min-width: 60px;
			text-align: right;
			font-size: 14px;
			color: #333;
		}
	}
</style>
