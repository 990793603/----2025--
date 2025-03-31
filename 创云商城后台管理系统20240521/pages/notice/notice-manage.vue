<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
			<el-form-item label="公告标题" prop="name">
                <el-input v-model="formData.name" clearable maxlength="20" placeholder="请输入公告标题" />
            </el-form-item>
			<el-form-item v-if="formVisible" label="图片" prop="image">
			    <image-upload ref="imageUpload" :files="formData.image ? [formData.image] : []" @onChanged="onImageChanged"></image-upload>
			</el-form-item>
			<el-form-item label="公告详情" prop="content">
			    <Tinymce v-if="formVisible" ref="editor" v-model="formData.content" :width="660" :height="400" />
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
                    name: [{required: true, message: '请输入公告标题', trigger: 'blur'}],
					content: [{required: true, message: '请编辑公告详情', trigger: 'blur'}],
					status: [{required: true}],
                }
            }
        },
		computed: {
			formTitle(){
				return this.formData._id ? '修改文章' : '添加文章';
			}
		},
        watch: {
			formVisible(state){
			    if(state){
					//默认数据
					if(!this.formData._id){
						this.formData = {
							type: '',
							name: '',
							status: 1
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
					const response = await this.$request('notice', operation, this.formData);
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
				this.formData.image = files.length > 0 ? files[0] : '';
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