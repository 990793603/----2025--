<template>
	<view class="custom-bread-crumb">
		<el-breadcrumb separator="/">
			<el-breadcrumb-item
				v-for="item in list" 
				:key="`bread-crumb-${item.name}`"
			>
			<!-- :to="item.name"  -->
				{{ showTitle(item) }}
			</el-breadcrumb-item>
		</el-breadcrumb>
	</view>
</template>
<script>
	import {
		showTitle
	} from '@/common/js/util';
	export default {
		name: 'customBreadCrumb',
		props: {
			list: {
				type: Array,
				default: () => []
			},
			fontSize: {
				type: Number,
				default: 14
			},
			showIcon: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			showTitle(item) {
				return showTitle(item, this);
			},
			isCustomIcon(iconName) {
				return iconName.indexOf('_') === 0;
			},
			getCustomIconName(iconName) {
				return iconName.slice(1);
			}
		}
	};
</script>

<style lang="scss">
	.custom-bread-crumb{
		margin-left: 15px !important;
	}
</style>
