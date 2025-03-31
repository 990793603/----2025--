<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
            <el-form-item label="分组名称" prop="name">
                <el-input v-model="formData.name" clearable maxlength="20" placeholder="请输入分组名称" />
            </el-form-item>
			<el-form-item label="分组权限" prop="name" style="width: 500px;">
				<el-checkbox-group v-model="checkList">
				    <el-checkbox 
						v-for="(item, index) in roleList"
						:key="index"
						:label="item.value"
					>
						<span>{{ item.name }}</span>
					</el-checkbox>
				</el-checkbox-group>
			</el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer" style="padding-left: 140px">
            <el-button size="medium" class="confirm-btn" @click="formVisible=false"> 取消 </el-button>
            <el-button size="medium" class="confirm-btn" type="primary" @click="submit"> 提交 </el-button>
        </div>
    </el-dialog>
</template>

<script>
	import routers from '@/router/routers'
    export default {
        data() {
            return {
                formVisible: false, //表单显示状态
				roleList: [],
				checkList: [],
                formData: {}, //表单数据
                rules: {
                    name: [{required: true, message: '请输入分组名称', trigger: 'blur'}]
                }
            }
        },
		computed: {
			formTitle(){
				return this.formData._id ? '修改分组' : '添加分组';
			}
		},
        watch: {
			formVisible(state){
			    if(state){
					//默认数据
					if(!this.formData._id){
						this.formData = {
							name: '',
						}
					}
					this.init();
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
					const operation = this.formData._id ? 'updateRoles' : 'addRoles';
					const response = await this.$request('admin', operation, {
						...this.formData,
						node: this.checkList
					});
					if(response.status === 1){
						this.$message.success(response.msg);
						this.$emit('refreshData');
						this.formVisible = false;
					}else{
						this.$message.error(response.msg);
					}
                })
            },
			init(){
				const list = [];
				routers.forEach(item=> {
					if(item.children){
						item.children.forEach(child=> {
							if(child.meta && child.meta.access){
								list.push({
									name: child.meta.title,
									value: child.meta.access[0]
								})
							}
						})
					}
				})
				this.checkList = this.formData.node || [];
				this.roleList = list;
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
