<template>
	<div class="home-app column">
		<!-- 数据统计 待办事项 -->
		<total-stat></total-stat>
		<div class="wrap">
			<div class="column" style="flex: 3">
				<!-- 订单统计 -->
				<order-stat></order-stat>
				<!-- 用户 热搜 -->
				<user-stat></user-stat>
			</div>
			<!-- 商品销量排行 -->
			<hot-product></hot-product>
		</div>
	</div>
</template>

<script>
	import totalStat from './components/total-stat.vue'
	import orderStat from './components/order-stat.vue'
	import hotProduct from './components/hot-product.vue'
	import userStat from './components/user-stat.vue'
	export default {
		components: {
			totalStat,
			orderStat,
			hotProduct,
			userStat
		},
		data() {
			return {
				
			}
		},
		methods: {
			
		}
	}
</script>

<style scoped lang="scss">
	.home-app{
		height: 100%;
		padding-right: 10px;
		overflow-y: scroll;
		overflow-x: hidden;
	}
	.wrap{
		display: flex;
		margin-top: 16px;
	}
	
	
</style>
