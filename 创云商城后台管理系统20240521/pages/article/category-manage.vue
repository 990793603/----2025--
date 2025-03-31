<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">

            <el-form-item label="分类名称" prop="name">
                <el-input v-model="formData.name" clearable maxlength="10" placeholder="请输入分类名称" />
            </el-form-item>

			<el-form-item label="是否启用" prop="status">
				<el-switch 
					class="has-text"
					style="margin-left: 6px;" 
					v-model="formData.status" 
					:width="36" 
					:active-value="1" 
					:inactive-value="0"
					active-text="启用"
					inactive-text="禁用">
				></el-switch>
			</el-form-item>

        </el-form>
        <div slot="footer" class="dialog-footer" style="padding-left: 140px">
            <el-button size="medium" class="confirm-btn" @click="formVisible=false">取消</el-button>
            <el-button size="medium" class="confirm-btn" type="primary" @click="submit">提交</el-button>
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
                    name: [{required: true, message: '请输入分类名称', trigger: 'blur'}],
					status: [{required: true}],
                }
            }
        },
		computed: {
			formTitle(){
				return this.formData._id ? '编辑分类' : '添加分类';
			}
		},
        watch: {
            formVisible(state){
                if(state){
					//默认数据
					if(!this.formData._id){
						this.formData = {
							name: '',
							status: 1
						}
					}
				}else{
					this.$refs.dataForm.resetFields();
					this.formData = {}; //清空表单
				}
            }
        },
        methods: {
            submit(){
                this.$refs.dataForm.validate( async res=>{
                    if(res === false){
						return;
                    }
					const response = await this.$request('article', 'setCategory', this.formData);
					if(response.status === 1){
						this.$message.success(response.msg);
						this.$emit('refreshData');
						this.formVisible = false;
					}else{
						this.$message.error(response.msg);
					}
                })
            }
        }
    }
</script>

<style lang="scss" scoped>
    /* 加宽行 */
    .form-item-widen{
        width: 650px;
    }
    .dialog{

        & /deep/ .el-dialog__body{
            padding-bottom: 10px;
        }
        & /deep/ .el-dialog{
           /* margin-top: 5vh !important; */
            margin-bottom: 5vh;
            min-width: 880px;
            max-width: 880px;
        }
    }
</style>
