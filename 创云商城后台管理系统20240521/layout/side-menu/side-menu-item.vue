<template>
	<el-submenu :index="`${parentName}`">
		<template slot="title">
			<i :class="parentItem.meta.icon"></i>
			<span>{{ showTitle(parentItem) }}</span>
		</template>
		
		<template v-for="item in children">
			<side-menu-item v-if="showChildren(item)" :key="`menu-${item.name}`" :parent-item="item"></side-menu-item>
			<el-menu-item v-else :index="getNameOrHref(item)" :key="`menu-${item.name}`">
				<span class="menu-item-tit" :class="{active: isCurrent(item)}">{{ showTitle(item) }}</span>
			</el-menu-item>
		</template>

	</el-submenu>
</template>
<script>
	import {routeEqual} from '@/common/js/util';
	import mixin from './mixin';
	import itemMixin from './item-mixin';
	export default {
		name: 'SideMenuItem',
		mixins: [mixin, itemMixin],
		props: {
			curRoute: Object,
		},
		methods: {
			isCurrent(item) {
				return routeEqual(this.curRoute, item);
			},
		}
	};
</script>

<style lang="scss">
	/deep/ .el-menu .el-submenu__title{
		background-color: #1f2d3d !important;
		
		&:hover{
			background-color: #263445 !important;
		}
		.el-icon-goods{
			color: #fff;
		}
	}
	/deep/ .el-menu-item{
		background-color: #1f2d3d !important;
		
		&:hover{
			background-color: #263445 !important;
		}
	}
	.menu-item-tit{
		color: #f0f0f0;
		
		&.active{
			color: #4ba4ff;
		}
	}
	i{
		color: #fff !important;
		opacity: 0.9;
	}
</style>