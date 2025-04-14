<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
<el-form-item label="分类id">
                {{formData._id}}
            </el-form-item>
            <el-form-item label="上级分类" prop="parent_id">
                <el-select v-model="formData.parent_id" filterable default-first-option placeholder="请选择上级分类">
                    <el-option v-for="item in renderCateList" :key="item._id" :label="item.name" :value="item._id"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="分类名称" prop="name">
                <el-input v-model="formData.name" clearable maxlength="10" placeholder="请输入分类名称" />
            </el-form-item>

            <el-form-item label="排序" prop="sort">
				<el-input-number v-model="formData.sort" :step="1" :min="0" :max="999" step-strictly></el-input-number>
            </el-form-item>
            <el-form-item v-if="formVisible" label="分类图片" prop="image">
                <image-upload ref="imageUpload" :files="formData.image ? [formData.image] : []" @onChanged="onImageChanged"></image-upload>
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
    export default {
        data() {
            return {
				renderCateList: [],
                formVisible: false, //表单显示状态
                formData: {
					image: ''
				}, //表单数据
                rules: {
                    name: [{required: true, message: '请输入分类名称', trigger: 'blur'}],
					sort: [{required: true, message: '请输入排序值', trigger: 'blur'}],
					status: [{required: true}],
                    image: [{required: true, message: '请上传分类图片', trigger: 'blur'}],
                }
            }
        },
		props: {
		    cateList: Array
		},
		computed: {
			formTitle(){
				return this.formData._id ? '编辑分类' : '添加分类';
			}
		},
        watch: {
            formVisible(state){
                if(state){
					//分类处理
					const renderList = this.cateList.filter(item=> !item.parent_id && item._id != this.formData._id);
					renderList.unshift({
						_id: '',
						name: '顶级分类'
					})
					this.renderCateList = renderList;
					//默认数据
					if(!this.formData._id){
						this.formData = {
							parent_id: '',
							sort: 0,
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
					const data = {...this.formData,}
					delete data.renderName;
					const operation = data._id ? 'updateCategory' : 'addCategory';
					const response = await this.$request('product', operation, data);
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
				this.$refs.dataForm.validateField('image')
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
