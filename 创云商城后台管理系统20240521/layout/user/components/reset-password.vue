<template>
	<el-dialog class="dialog" title="修改密码" :close-on-click-modal="false" :visible.sync="formVisible">
	    <el-form v-if="formVisible" ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
			<el-form-item label="旧密码" prop="oldPassword">
	            <el-input password v-model="formData.oldPassword" clearable maxlength="15" placeholder="请输入旧密码" />
	        </el-form-item>
			<el-form-item label="新密码" prop="newPassword">
			    <el-input v-model="formData.newPassword" clearable maxlength="15" placeholder="请输入新密码" />
			</el-form-item>
			<el-form-item label="确认密码" prop="rePassword">
			    <el-input v-model="formData.rePassword" clearable maxlength="15" placeholder="请再次输入新密码" />
			</el-form-item>
	    </el-form>
	    <div slot="footer" class="dialog-footer" style="padding-left: 140px">
	        <el-button size="medium" class="confirm-btn" @click="formVisible=false"> 取消 </el-button>
	        <el-button size="medium" class="confirm-btn" type="primary" @click="submit"> 提交 </el-button>
	    </div>
	</el-dialog>
</template>

<script>
	export default {
		name: 'ResetPassword',
		data() {
			return {
				formVisible: false, //表单显示状态
				formData: {}, //表单数据
				rules: {
					oldPassword: [{required: true, message: '请输入旧密码', trigger: 'blur'}],
				    newPassword: [{required: true, message: '请输入新密码', trigger: 'blur'}],
					rePassword: [{required: true, message: '请再次输入新密码', trigger: 'blur'}],
				}
			}
		},
		methods: {
			//提交
			submit(){
				this.$refs.dataForm.validate(async res=>{
				    if(res === false){
						return;
				    }
					const {
						oldPassword,
						newPassword,
						rePassword
					} = this.formData;
					if(newPassword !== rePassword){
						this.$message.error('两次密码输入不一致');
						return;
					}
					const response = await this.$request('admin', 'resetPassword', {
						oldPassword,
						newPassword,
						passwordConfirmation: rePassword
					});
					if(response.status === 1){
						this.$message.success(response.msg);
						this.formVisible = false;
						this.$store.commit('logout');
						setTimeout(()=>{
							this.$router.push({
								name: 'login'
							})
						}, 1000)
					}else{
						this.$message.error(response.msg);
					}
				})
			},
			open(){
				this.formData = {};
				this.formVisible = true;
			}
		}
	}
</script>

<style scoped lang="scss">

</style>
