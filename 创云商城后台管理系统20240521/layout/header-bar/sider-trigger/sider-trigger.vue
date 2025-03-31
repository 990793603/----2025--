<template>
	<view class="side-trigger-btn" @click="handleChange">
		<i 
			:class="collapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"
		></i>
	</view>
</template>
<script>
	export default {
		name: 'siderTrigger',
		props: {
			collapsed: Boolean,
			icon: {
				type: String,
				default: 'navicon-round'
			},
			size: {
				type: Number,
				default: 26
			}
		},
		methods: {
			handleChange() {
				this.$emit('on-change', !this.collapsed);
			}
		}
	};
</script>
<style lang="scss">
	.side-trigger-btn{
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		
		i{
			font-size: 19px;
			color: #303133;
		}
	}
</style>
