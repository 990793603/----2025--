<template>
	<div class="user-avatar-dropdown">
		<el-dropdown @command="handleClick">
			<view class="user-wrap">
				<el-avatar icon="el-icon-user-solid">{{ userInfo.avatar }}</el-avatar>
				<span class="name">{{ userInfo.access_name }}</span>
				<i class="el-icon-arrow-down"></i>
			</view>
			<el-dropdown-menu slot="dropdown">
				<el-dropdown-item command="resetPassword">修改密码</el-dropdown-item>
				<el-dropdown-item command="logout">退出登录</el-dropdown-item>
			</el-dropdown-menu>
		</el-dropdown>
		
		<!-- 发货面板 -->
		<reset-password ref="resetPassword"></reset-password>
	</div>
</template>

<script>
	import resetPassword from './components/reset-password.vue'
	export default {
		name: 'User',
		components: {
			resetPassword
		},
		computed: {
			userInfo(){
				return this.$store.state.user.userInfo;
			}
		},
		methods: {
			logout(){
				this.$store.commit('logout')
				this.$router.push({
					name: 'login'
				});
			},
			handleClick(name) {
				switch (name) {
					case 'logout':
						this.logout();
						break;
					case 'resetPassword':
						this.$refs.resetPassword.open();
						break;
				}
			}
		}
	};
</script>
<style lang="scss">
	.user-wrap{
		display: flex;
		flex-direction: row;
		align-items: center;
		
		i{
			margin-left: 4rpx;
		}
		.name{
			font-size: 14px;
			color: #333;
			margin-left: 10px;
		}
		/deep/ .el-avatar{
			width: 36px;
			height: 36px;
			line-height: 36px;
			
			.el-icon-user-solid{
				font-size: 18px;
			}
		} 
	}
</style>
