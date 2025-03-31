<template>
	<div class="user-stat row">
		<div class="wrap user-wrap">
			<div class="s-header row">
				<span class="tit">用户排行</span>
			</div>
			<div class="row cell table-header">
				<span class="key fill">用户</span>
				<span class="val">消费金额(元)</span>
			</div>
			<div class="row cell" v-for="(item, index) in userList" :key="index">
				<div class="rank center">
					<span v-if="index<=2" class="mix-icon icon-paihang" :class="'rank-icon'+index"></span>
					<span v-else class="number">{{ index + 1 }}</span>
				</div>
				<image class="avatar" :src="item.avatar || '/static/admin/icon/default-avatar.png'" mode="aspectFill"></image>
				<span class="name">{{ item.nickname || item.username }}</span>
				<span class="val">{{ item.consumption | price }}</span>
			</div>
		</div>
		<div class="wrap">
			<div class="s-header row">
				<span class="tit">热搜排行</span>
			</div>
			<div class="row cell table-header">
				<span class="key fill">关键词</span>
				<span class="val">搜索次数</span>
			</div>
			<div class="row cell" v-for="(item, index) in keywordList" :key="index">
				<div class="rank center">
					<span v-if="index<=2" class="mix-icon icon-paihang" :class="'rank-icon'+index"></span>
					<span v-else class="number">{{ index + 1 }}</span>
				</div>
				<span class="name">{{ item.name }}</span>
				<span class="val">{{ item.count || 0 }}</span>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				userList: [],
				keywordList: []
			}
		},
		created() {
			this.loadData();
		},
		methods: {
			async loadData() {
				const res = await this.$request('dataCenter', 'getUserRank');
				this.userList = res.userList;
				this.keywordList = res.keywordList;
			},
		}
	}
</script>

<style scoped lang="scss">
	.user-stat {
		flex-shrink: 0;
		width: 100%;
		margin-top: 16px;
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
	.wrap{
		flex: 1;
		height: 620px;
		border-radius: 4px;
		background-color: #fff;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, .04);
		
		&:first-child{
			margin-right: 16px;
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
			font-size: 15px;
			color: #333;
		}
		.val{
			font-size: 15px;
			color: #333;
		}
	}
</style>
