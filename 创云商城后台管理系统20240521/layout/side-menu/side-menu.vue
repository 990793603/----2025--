<template>
	<div class="side-menu-wrapper">
		<slot></slot>

		<el-menu 
			class="el-menu-vertical-demo" 
			unique-opened
			:collapse="collapsed"
			:default-openeds="openedNames"
			background-color="#304156"
			text-color="#bfcbd9"
			active-text-color="#409eff"
			@select="handleSelect"
		>
			<template v-for="item in menuList">
				<side-menu-item :curRoute="curRoute" :key="`menu-${item.name}`" :parent-item="item"></side-menu-item>
			</template>
		</el-menu>
	</div>
</template>
<script>
	import SideMenuItem from './side-menu-item.vue';
	import CollapsedMenu from './collapsed-menu.vue';
	import mixin from './mixin';

	export default {
		name: 'SideMenu',
		mixins: [mixin],
		components: {
			SideMenuItem,
			CollapsedMenu
		},
		props: {
			curRoute: Object,
			menuList: {
				type: Array,
				default () {
					return [];
				}
			},
			collapsed: {
				type: Boolean
			},
			theme: {
				type: String,
				default: 'dark'
			},
			rootIconSize: {
				type: Number,
				default: 20
			},
			iconSize: {
				type: Number,
				default: 16
			},
			accordion: Boolean,
			activeName: {
				type: String,
				default: ''
			},
			openNames: {
				type: Array,
				default: () => []
			}
		},
		data() {
			return {
				openedNames: []
			};
		},
		created() {
			//console.log(11111111111111);
		},
		methods: {
			handleSelect(name) {
				this.$emit('on-select', name);
			},
			getOpenedNamesByActiveName(name) {
				return this.$route.matched.map(item => item.name).filter(item => item !== name);
			},
			updateOpenName(name) {
				if (name === this.$config.homeName) this.openedNames = [];
				else this.openedNames = this.getOpenedNamesByActiveName(name);
			},
			/**
			 * @param {Array} arr1
			 * @param {Array} arr2
			 * @description 得到两个数组的并集, 两个数组的元素为数值或字符串
			 */
			getUnion(arr1, arr2){
				return Array.from(new Set([...arr1, ...arr2]))
			}
		},
		computed: {
			textColor() {
				return this.theme === 'dark' ? '#fff' : '#495060';
			}
		},
		watch: {
			activeName(name) {
				if (this.accordion) this.openedNames = this.getOpenedNamesByActiveName(name);
				else this.openedNames = this.getUnion(this.openedNames, this.getOpenedNamesByActiveName(name));
			},
			openNames(newNames) {
				this.openedNames = newNames;
			},
		},
		mounted() {
			this.openedNames = this.getUnion(this.openedNames, this.getOpenedNamesByActiveName(name));
		}
	};
</script>
<style lang="scss">
	.side-menu-wrapper {
		user-select: none;
		
		/deep/{
			.el-menu{
				border-right: 0;
				width: 210px;
				
				&.el-menu--collapse{
					width: 64px;
				}
			}
			.el-submenu__title{
				
				span{
					color: #f0f0f0;
				}
			}
		} 
	}
</style>
