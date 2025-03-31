<template>
	<view class="app">
		<!-- 左侧边栏 -->
		<view class="side-menu-wrap" :class="{collapse: collapsed}">
			<side-menu accordion ref="sideMenu" :curRoute="$route" :active-name="$route.name" :collapsed="collapsed" @on-select="turnToPage" :menu-list="menuList">
				<!-- 需要放在菜单上面的内容，如Logo，写在side-menu标签内部，如下 -->
				<div class="logo-wrap center" @click="handleClick(tagNavList[0])">
					<image class="logo" :class="{show: !collapsed}" src="/static/admin/admin-logo.png"></image>
					<image class="logo-mini" :class="{show: collapsed}" src="/static/admin/admin-logo-mini.png"></image>
				</div>
			</side-menu>
		</view>
		<view class="main-content">
			<view class="header-bar-wrap">
				<header-bar :collapsed="collapsed" @on-coll-change="handleCollapsedChange">
					<user />
					<!-- <fullscreen v-model="isFullscreen" style="margin-right: 10px;margin-top: 5px;" /> -->
				</header-bar>
				<tags-nav :curRoute="$route" @input="handleClick" :list="tagNavList" @on-close="handleCloseTag" />
			</view>
			
			<view class="main-wrap">
				<keep-alive :include="cacheList">
					<router-view />
				</keep-alive>
			</view>
		</view>
	</view>
</template>

<script>
	import sideMenu from './side-menu/side-menu.vue';
	import headerBar from './header-bar/header-bar';
	import user from './user/user';
	import tagsNav from './tags-nav/tags-nav';
	import { mapMutations, mapActions, mapGetters } from 'vuex';
	import routers from '@/router/routers';
	import { getNewTagList, routeEqual } from '@/common/js/util';
	export default {
		name: 'AppLayout',
		components: {
			sideMenu,
			headerBar,
			user,
			tagsNav
		},
		data() {
			return {
				collapsed: false,
				isFullscreen: false
			}
		},
		computed: {
			tagNavList() {
				return this.$store.state.app.tagNavList;
			},
			tagRouter() {
				return this.$store.state.app.tagRouter;
			},
			cacheList() {
				const list = ['ParentView', ...(this.tagNavList.length ? this.tagNavList.filter(item => !(item.meta && item.meta.notCache)).map(item => item.name) : [])];
				return list;
			},
			menuList() {
				return this.$store.getters.menuList;
			},
			local() {
				return this.$store.state.app.local;
			},
			hasReadErrorPage() {
				return this.$store.state.app.hasReadErrorPage;
			},
		},
		watch: {
			$route(newRoute) {
				const { name, query, params, meta } = newRoute;
				this.addTag({
					route: { name, query, params, meta },
					type: 'push'
				});
				this.setBreadCrumb(newRoute);
				this.setTagNavList(getNewTagList(this.tagNavList, newRoute));
				this.$refs.sideMenu.updateOpenName(newRoute.name);
			}
		},
		mounted() {
			/**
			 * @description 初始化设置面包屑导航和标签导航
			 */
			this.setTagNavList();
			this.setHomeRoute(routers);
			const { name, params, query, meta } = this.$route;
			this.addTag({
				route: { name, params, query, meta }
			});
			this.setBreadCrumb(this.$route);
			// 设置初始语言
			// this.setLocal(this.$i18n.locale);
			// 如果当前打开页面不在标签栏中，跳到homeName页
			if (!this.tagNavList.find(item => item.name === this.$route.name)) {
				this.$router.push({
					name: this.$config.homeName
				});
			}
			// 获取未读消息条数
			// this.getUnreadMessageCount();
		},
		methods: {
			...mapMutations(['setBreadCrumb', 'setTagNavList', 'addTag', 'setLocal', 'setHomeRoute', 'closeTag']),
			...mapActions(['handleLogin', 'getUnreadMessageCount']),
			turnToPage(route) {
				let { name, params, query } = {};
				if (typeof route === 'string') name = route;
				else {
					name = route.name;
					params = route.params;
					query = route.query;
				}
				if (name.indexOf('isTurnByHref_') > -1) {
					window.open(name.split('_')[1]);
					return;
				}
				this.$router.push({
					name,
					params,
					query
				});
			},
			handleCollapsedChange(state) {
				this.collapsed = state;
			},
			handleCloseTag(res, type, route) {
				if (type !== 'others') {
					if (type === 'all') {
						this.turnToPage(this.$config.homeName);
					} else {
						if (routeEqual(this.$route, route)) {
							this.closeTag(route);
						}
					}
				}
				this.setTagNavList(res);
			},
			handleClick(item) {
				this.turnToPage(item);
			}
		},
	}
</script>

<style scoped lang="scss">
	.app{
		display: flex;
		flex-direction: row;
		width: 100%;
	}
	.side-menu-wrap{
		flex-shrink: 0;
		width: 210px;
		height: 100vh;
		background-color: #304156;
		transition: width .3s;
		overflow-y: scroll;
		overflow-x: hidden;
		
		&.collapse{
			width: 64px;
		}
	}
	.main-content{
		display: flex;
		flex-direction: column;
		/* width: calc(100vw - 210px); */
		flex: 1;
		height: 100vh;
		background-color: #fff;
		overflow: hidden;
	}
	.header-bar-wrap{
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		background-color: #f0f2f5;
	}
	.main-wrap{
		flex: 1;
		padding: 0 10px 10px;
		overflow: hidden;
		background-color: #f2f3f4;
	}
	.logo-wrap{
		padding: 10px 0;
		
		.logo{
			width: 150px;
			min-width: 150px;
			height: 60px;
			margin-right: 20px;
			opacity: 0;
			transition: opacity .3s;
		}
		.logo-mini{
			position: absolute;
			left: 12px;
			top: 18px;
			width: 40px;
			height: 40px;
			opacity: 0;
			transition: opacity .3s;
		}
		.show{
			opacity: 1;
		}
	}
</style>
