<template>
	<el-dialog class="dialog" title="用户余额充值" :close-on-click-modal="false" :visible.sync="formVisible">
	    <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
			<el-form-item label="充值金额" prop="logistic_code">
	            <el-input v-model="formData.money" clearable maxlength="50" placeholder="请输入充值金额" />
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
		data() {
			return {
				formVisible: false, //表单显示状态
				formData: {}, //表单数据
				rules: {
					money: [{required: true, message: '请输入充值金额', trigger: 'blur'}],
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
					const data = {
						...this.formData
					}
					const response = await this.$request('user', 'userRecharge', data);
					if(response.status === 1){
						this.$message.success(response.msg);
						this.$emit('refreshData');
						this.formVisible = false;
					}else{
						this.$message.error(response.msg);
					}
				})
			},
			open(data){
				this.data = data;
			}
		}
	}
</script>

<style scoped lang="scss">

</style>
