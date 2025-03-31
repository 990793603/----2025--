<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
			<el-form-item label="公司名称" prop="name">
			    <el-input v-model="formData.name" clearable maxlength="20" placeholder="请输入物流公司名称" />
			</el-form-item>
			<el-form-item label="公司代码" prop="code">
			    <el-input v-model="formData.code" clearable maxlength="20" placeholder="请输入物流公司代码" />
			</el-form-item>
			<el-form-item label="客服电话" prop="phone">
			    <el-input v-model="formData.phone" clearable maxlength="20" placeholder="请输入物流公司客服电话" />
			</el-form-item>
			<el-form-item label="公司logo" prop="logo">
			    <image-upload v-if="formVisible" ref="imageUpload" :files="formData.logo ? [formData.logo] : []" @onChanged="onImageChanged"></image-upload>
			</el-form-item>
			
        </el-form>
        <div slot="footer" class="dialog-footer" style="padding-left: 140px">
            <el-button size="medium" class="confirm-btn" @click="formVisible=false"> 取消 </el-button>
            <el-button size="medium" class="confirm-btn" type="primary" @click="submit"> 提交 </el-button>
        </div>
    </el-dialog>
</template>

<script>
   import Tinymce from '@/components/Tinymce'
   export default {
       components: {
			Tinymce,
       },
        data() {
            return {
                formVisible: false, //表单显示状态
                formData: {}, //表单数据
                rules: {
					name: [{required: true, message: '请输入物流公司名称', trigger: 'blur'}],
                    code: [{required: true, message: '请输入物流公司代码', trigger: 'blur'}],
					phone: [{required: true, message: '请输入物流公司客服电话', trigger: 'blur'}],
					logo: [{required: true, message: '请上传物流公司logo', trigger: 'blur'}],
                }
            }
        },
		computed: {
			formTitle(){
				return this.formData._id ? '修改物流公司' : '添加物流公司';
			}
		},
        watch: {
			formVisible(state){
			    if(state){
					//默认数据
					if(!this.formData._id){
						this.formData = {
							name: '',
							code: '',
							phone: '',
							logo: ''
						}
					}
				}else{
					this.$refs.dataForm.resetFields();
					this.formData = {}
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
					const operation = this.formData._id ? 'update' : 'add';
					const response = await this.$request('express', operation, this.formData);
					if(response.status === 1){
						this.$message.success(response.msg);
						this.$emit('refreshData');
						this.formVisible = false;
					}else{
						this.$message.error(response.msg);
					}
                })
            },
			onImageChanged(files){
				this.formData.logo = files.length > 0 ? files[0] : '';
			}
        }
    }
</script>

<style lang="scss" scoped>
    .dialog{

        & /deep/ .el-dialog__body{
            padding-bottom: 10px;
        }
        & /deep/ .el-dialog{
            margin-bottom: 5vh;
            min-width: 880px;
            max-width: 880px;
        }
    }
</style>