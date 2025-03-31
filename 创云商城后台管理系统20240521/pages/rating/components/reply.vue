<template>
	<el-dialog class="dialog" title="订单发货" :close-on-click-modal="false" :visible.sync="formVisible">
	    <el-form v-if="formVisible" ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
	       <el-form-item label="评价内容">
				<span>{{ data.content }}</span>
	       </el-form-item>
			<el-form-item label="回复内容" prop="reply">
	            <el-input type="textarea" v-model="formData.reply" clearable maxlength="150" placeholder="请输入回复内容" />
	        </el-form-item>
	    </el-form>
	    <div slot="footer" class="dialog-footer" style="padding-left: 150px">
	        <el-button size="medium" class="confirm-btn" @click="formVisible=false"> 取消 </el-button>
	        <el-button size="medium" class="confirm-btn" type="primary" @click="submit"> 提交 </el-button>
	    </div>
	</el-dialog>
</template>

<script>
	export default {
		data() {
			return {
				data: {},
				formVisible: false, //表单显示状态
				formData: {
					reply: ''
				}, //表单数据
				rules: {
					reply: [{required: true, message: '请输入回复内容', trigger: 'blur'}],
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
						id: this.data._id,
						...this.formData
					}
					const response = await this.$request('rating', 'reply', data);
					if(response.status === 1){
						this.$message.success('回复成功');
						this.$emit('refreshData');
						this.formVisible = false;
					}else{
						this.$message.error(response.msg);
					}
				})
			},
			open(data){
				this.data = JSON.parse(JSON.stringify(data));
				if(data.reply){
					this.formData.reply = data.reply;
				}else{
					this.formData.reply = '';
				}
				this.formVisible = true;
			}
		}
	}
</script>

<style scoped lang="scss">
	/deep/ {
		.el-textarea__inner{
			width: 400px;
			height: 100px;
		}
	}
</style>
