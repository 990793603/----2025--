<template>
	<div class="header-bar">
		<sider-trigger :collapsed="collapsed" icon="md-menu" @on-change="handleCollpasedChange"></sider-trigger>
		<custom-bread-crumb show-icon style="margin-left: 30px;" :list="breadCrumbList"></custom-bread-crumb>
		<div class="custom-content-con">
			<slot></slot>
		</div>
	</div>
</template>
<script>
	import siderTrigger from './sider-trigger/sider-trigger';
	import customBreadCrumb from './custom-bread-crumb/custom-bread-crumb';
	export default {
		name: 'HeaderBar',
		components: {
			siderTrigger,
			customBreadCrumb
		},
		props: {
			collapsed: Boolean
		},
		computed: {
			breadCrumbList() {
				return this.$store.state.app.breadCrumbList;
			}
		},
		methods: {
			handleCollpasedChange(state) {
				this.$emit('on-coll-change', state);
			}
		}
	};
</script>
<style lang="scss">
	.header-bar {
		display: flex;
		align-items: center;
		width: 100%;
		height: 50px;
		position: relative;
		background-color: #fff;

		.custom-content-con {
			flex: 1;
			display: flex;
			justify-content: flex-end;
			align-items: center;
			height: auto;
			padding-right: 20px;
		}
	}
</style>
