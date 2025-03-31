<template>
	<div class="tags-nav">
		<!-- <div class="close-con">
			<el-dropdown @command="handleTagsOption">
				<i class="el-icon-circle-close"></i>
				<el-dropdown-menu slot="dropdown">
					<el-dropdown-item command="close-all">关闭所有</el-dropdown-item>
					<el-dropdown-item command="close-others">关闭其他</el-dropdown-item>
				</el-dropdown-menu>
			</el-dropdown>
		</div>
		 -->
		
		<el-scrollbar ref="scrollContainer" :vertical="false" class="scroll-container" @wheel.native.prevent="handleScroll">
			<view class="tag-wrap">
				<el-tag
					:class="{active: isCurrentTag(item)}"
					v-for="(item, index) in list"
					:key="`tag-nav-${index}`" 
					ref="tagsPageOpened"
					:name="item.name"
					:data-route-item="item" 
					@close="handleClose(item)"
					@click="handleClick(item)" 
					:closable="item.name !== $config.homeName"
					:effect="isCurrentTag(item) ? 'dark' : 'plain'"
					size="small"
				>
					{{ showTitleInside(item) }}
				</el-tag>
			</view>
		</el-scrollbar>
		
				
	</div>
</template>

<script>
	import {showTitle,routeEqual} from '@/common/js/util';
	import beforeClose from '@/router/before-close';
	export default {
		name: 'TagsNav',
		props: {
			curRoute: Object,
			list: {
				type: Array,
				default () {
					return [];
				}
			}
		},
		data() {
			return {
				tagBodyLeft: 20,
				rightOffset: 40,
				outerPadding: 4,
				contextMenuLeft: 2,
				contextMenuTop: 0,
				visible: false,
				menuList: {
					others: '关闭其他',
					all: '关闭所有'
				}
			};
		},
		methods: {
			handlescroll(e) {
				var type = e.type;
				let delta = 0;
				if (type === 'DOMMouseScroll' || type === 'mousewheel') {
					delta = e.wheelDelta ? e.wheelDelta : -(e.detail || 0) * 40;
				}
				this.handleScroll(delta);
			},
			handleScroll(offset) {
				/* const outerWidth = this.$refs.scrollOuter.offsetWidth;
				const bodyWidth = this.$refs.scrollBody.offsetWidth;
				if (offset > 0) {
					this.tagBodyLeft = Math.min(20, this.tagBodyLeft + offset);
				} else {
					if (outerWidth < bodyWidth) {
						if (this.tagBodyLeft < -(bodyWidth - outerWidth)) {
							this.tagBodyLeft = this.tagBodyLeft;
						} else {
							this.tagBodyLeft = Math.max(this.tagBodyLeft + offset, outerWidth - bodyWidth);
						}
					} else {
						this.tagBodyLeft = 20;
					}
				} */
			},
			handleTagsOption(type) {
				if (type.includes('all')) {
					// 关闭所有，除了home
					let res = this.list.filter(item => item.name === this.$config.homeName);
					this.$emit('on-close', res, 'all');
				} else if (type.includes('others')) {
					// 关闭除当前页和home页的其他页
					let res = this.list.filter(item => routeEqual(this.curRoute, item) || item.name === this.$config.homeName);
					this.$emit('on-close', res, 'others', this.curRoute);
					setTimeout(() => {
						this.getTagElementByRoute(this.curRoute);
					}, 100);
				}
			},
			handleClose(current) {
				if (current.meta && current.meta.beforeCloseName && current.meta.beforeCloseName in beforeClose) {
					new Promise(beforeClose[current.meta.beforeCloseName]).then(close => {
						if (close) {
							this.close(current);
						}
					});
				} else {
					this.close(current);
				}
			},
			close(route) {
				let res = this.list.filter(item => !routeEqual(route, item));
				this.$emit('on-close', res, undefined, route);
			},
			handleClick(item) {
				this.$emit('input', item);
			},
			showTitleInside(item) {
				return showTitle(item, this);
			},
			isCurrentTag(item) {
				return routeEqual(this.curRoute, item);
			},
			moveToView(tag) {
				/* const outerWidth = this.$refs.scrollOuter.offsetWidth;
				const bodyWidth = this.$refs.scrollBody.offsetWidth;
				if (bodyWidth < outerWidth) {
					this.tagBodyLeft = 20;
				} else if (tag.offsetLeft < -this.tagBodyLeft) {
					// 标签在可视区域左侧
					this.tagBodyLeft = -tag.offsetLeft + this.outerPadding;
				} else if (tag.offsetLeft > -this.tagBodyLeft && tag.offsetLeft + tag.offsetWidth < -this.tagBodyLeft + outerWidth) {
					// 标签在可视区域
					this.tagBodyLeft = Math.min(0, outerWidth - tag.offsetWidth - tag.offsetLeft - this.outerPadding);
				} else {
					// 标签在可视区域右侧
					this.tagBodyLeft = -(tag.offsetLeft - (outerWidth - this.outerPadding - tag.offsetWidth));
				} */
			},
			getTagElementByRoute(route) {
				this.$nextTick(() => {
					this.refsTag = this.$refs.tagsPageOpened;
					this.refsTag.forEach((item, index) => {
						if (routeEqual(route, item.$attrs['data-route-item'])) {
							let tag = this.refsTag[index].$el;
							this.moveToView(tag);
						}
					});
				});
			},
			contextMenu(item, e) {
				if (item.name === this.$config.homeName) {
					return;
				}
				this.visible = true;
				const offsetLeft = this.$el.getBoundingClientRect().left;
				this.contextMenuLeft = e.clientX - offsetLeft + 10;
				this.contextMenuTop = e.clientY - 64;
			},
			closeMenu() {
				this.visible = false;
			}
		},
		watch: {
			$route(to) {
				this.getTagElementByRoute(to);
			},
			visible(value) {
				if (value) {
					document.body.addEventListener('click', this.closeMenu);
				} else {
					document.body.removeEventListener('click', this.closeMenu);
				}
			}
		},
		mounted() {
			setTimeout(() => {
				this.getTagElementByRoute(this.$route);
			}, 200);
		}
	};
</script>

<style lang="scss">
	.tags-nav{
		width: 100%;
		overflow-x: hidden;
	}
	.tag-wrap{
		display: flex;
		flex-wrap: nowrap;
		padding: 8px 10px;
		
		.active /deep/{
			.el-icon-close{
				width: 13px;
			}
		}
		/deep/{
			.el-tag{
				min-width: 60px;
				height: 28px;
				font-size: 12px;
				line-height: 28px;
				padding: 0 12px;
				margin-right: 6px;
				border-radius: 2px;
				border: 0;
				text-align: center;
				
				&:hover{
					.el-icon-close{
						width: 13px;
					}
				}
			}
			.el-tag--plain{
				color: #495060;
			}
			.el-icon-close{
				width: 0;
				color: #495060;
				overflow: hidden;
				transition: 0.2s;
			}
			.el-tag--dark{
				color: #fff;
				background-color: #409EFF;
				
				.el-icon-close{
					color: #fff;
				}
			}
		}
		
	}
	
	
</style>
