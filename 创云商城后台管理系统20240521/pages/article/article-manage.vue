<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
            <el-form-item label="文章分类" prop="type">
                <el-select v-model="formData.type" filterable default-first-option placeholder="请选择文章分类">
                    <el-option v-for="item in typeList" :key="item._id" :label="item.name" :value="item._id"></el-option>
                </el-select>
            </el-form-item>
			<el-form-item label="文章标题" prop="name">
                <el-input v-model="formData.name" clearable maxlength="20" placeholder="请输入文章标题" />
            </el-form-item>
			<el-form-item label="图文详情" prop="content">
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
				typeList: [],
                rules: {
					type: [{required: true, message: '请选择文章分类', trigger: 'blur'}],
                    name: [{required: true, message: '请输入文章标题', trigger: 'blur'}],
					content: [{required: true, message: '请编辑文章详情', trigger: 'blur'}],
					status: [{required: true}]
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
		created() {
			this.loadTypeList();
		},
        methods: {
			//加载分类
			async loadTypeList(){
				const response = await this.$request('article', 'getCategoryList');
				this.typeList = response.data.filter(item=> item.status === 1);
			},
			//提交
            submit(){
                this.$refs.dataForm.validate(async res=>{
                    if(res === false){
						return;
                    }
					const operation = this.formData._id ? 'updateArticle' : 'addArticle';
					const response = await this.$request('article', operation, this.formData);
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