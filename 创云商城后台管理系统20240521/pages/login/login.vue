<template>
	<div class="login-container">
		<div class="form">
			<div class="title-container center">
				<image class="logo" src="/static/admin/admin-logo.png"></image>
			</div>
			
			<div class="cell row">
				<span class="mix-icon icon-yonghu"></span>
				<input v-model="username" class="input" type="text" placeholder="请输入用户名" placeholder-style="color:#fff" />
			</div>
			<div class="cell row">
				<span class="mix-icon icon-mima"></span>
				<input v-model="password" password class="input" type="text" placeholder="请输入密码" placeholder-style="color:#fff" />
			</div>
			
			<el-button :loading="loading" type="primary" @click.native.prevent="confirm">登录</el-button>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				username: '',
				password: '',
				loading: false
			}
		},
		methods: {
			async confirm(){
				const {username, password} = this;
				if(!username){
					this.$message.error('请输入用户名');
					return;
				}
				if(!password){
					this.$message.error('请输入密码');
					return;
				}
				this.loading = true;
				const res = await this.$request('admin', 'login', {
					username, 
					password
				}, {
					showLoading: false
				})
				if(res.status === 1){
					this.loading = false;
					this.$store.commit('setToken', res);
					this.$router.push({
						name: 'index'
					});
				}else{
					this.$message.error(res.msg);
					this.loading = false;
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.login-container {
		min-height: 100%;
		width: 100%;
		background-color: #304156;
		overflow: hidden;
	}
	.title-container {
		position: relative;
		padding-bottom: 40px;
	
		.logo{
			width: 300px;
			height: 120px;
		}
	}
	.cell{
		height: 48px;
		margin-bottom: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.1);
		border-radius: 5px;
		color: #454545;
		
		.input{
			flex: 1;
			background-color: transparent;
			border: 0;
			font-size: 18px;
			color: #fff;
		}
	}
	.form {
		position: relative;
		width: 520px;
		max-width: 100%;
		padding: 160px 35px 0;
		margin: 0 auto;
		overflow: hidden;
	}
	.mix-icon{
		width: 40px;
		margin-left: 16px;
		font-size: 23px;
		color: #fff;
	}
	.icon-yonghu{
		font-size: 20px;
	}
	/deep/ .el-button--primary{
		width: 100%;
		height: 44px;
		margin-top: 20px;

		span{
			font-size: 18px;
		}
	}
</style>
