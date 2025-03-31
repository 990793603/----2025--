<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
            <el-form-item label="广告位" prop="advert_type">
                <el-select v-model="formData.advert_type" filterable default-first-option placeholder="请选择广告位">
                    <el-option v-for="item in typeList" :key="item.type" :label="item.name" :value="item.type"></el-option>
                </el-select>
            </el-form-item>
			<el-form-item label="广告名称" prop="name">
                <el-input v-model="formData.name" clearable maxlength="20" placeholder="请输入导航名称" />
            </el-form-item>
            <el-form-item label="链接地址" prop="link">
                <el-input v-model="formData.link" clearable maxlength="500" placeholder="请输入链接地址" />
            </el-form-item>
			<el-form-item v-if="formVisible" label="广告图片" prop="image">
			    <image-upload ref="imageUpload" :files="formData.image ? [formData.image] : []" @onChanged="onImageChanged"></image-upload>
			</el-form-item>
			<el-form-item label="排序" prop="sort">
				<el-input-number v-model="formData.sort" :step="1" :min="0" :max="999" step-strictly></el-input-number>
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
                formVisible: false, //表单显示状态
                formData: {}, //表单数据
				typeList: [
					{name: '首页轮播图', type: 'carousel'},
					{name: '首页中部广告位', type: 'middle'}
				],
                rules: {
					advert_type: [{required: true, message: '请选择广告位', trigger: 'blur'}],
                    name: [{required: true, message: '请输入广告名称', trigger: 'blur'}],
                    link: [{required: true, message: '请输入链接地址', trigger: 'blur'}],
					image: [{required: true, message: '请上传广告图标', trigger: 'blur'}],
					sort: [{required: true}],
					status: [{required: true}]
                }
            }
        },
		computed: {
			formTitle(){
				return this.formData._id ? '修改广告' : '添加广告';
			}
		},
        watch: {
			formVisible(state){
			    if(state){
					//默认数据
					if(!this.formData._id){
						this.formData = {
							advert_type: '',
							name: '',
							link: '',
							image: '',
							sort: 0,
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
            submit(){
                this.$refs.dataForm.validate(async res=>{
                    if(res === false){
						return;
                    }
					this.formData.type = 'advert';
					const operation = this.formData._id ? 'updateAdvert' : 'addAdvert';
					const response = await this.$request('advert', operation, this.formData);
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
            margin-bottom: 5vh;
            min-width: 880px;
            max-width: 880px;
        }
    }
</style>
