<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
			<el-form-item label="分组" prop="role_id">
			    <el-select v-model="formData.role_id" filterable default-first-option placeholder="请选择管理员分组">
			        <el-option v-for="item in roleList" :key="item._id" :label="item.name" :value="item._id"></el-option>
			    </el-select>
			</el-form-item>
			<el-form-item label="用户名" prop="username">
			    <el-input v-model="formData.username" :disabled="!!formData._id" clearable maxlength="30" placeholder="请输入用户名" />
			</el-form-item>
			<el-form-item v-if="!formData._id" label="密码" prop="password">
			    <el-input v-model="formData.password" clearable maxlength="30" placeholder="请输入密码" />
			</el-form-item>
			<el-form-item v-else label="密码" prop="password">
			    <el-input value="********" disabled clearable maxlength="30" placeholder="请输入密码" />
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
                formData: {}, //表单数据
                rules: {
					role_id: [{required: true, message: '请选择管理员分组', trigger: ["blur",'change']},],
                    username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
					password: [{required: true, message: '请输入密码', trigger: 'blur'}]
                }
            }
        },
		props: {
		    roleList: {
		        type: Array,
		        default(){
		            return [];
		        }
			}
		},
		computed: {
			formTitle(){
				return this.formData._id ? '修改管理员' : '添加管理员';
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
					const operation = this.formData._id ? 'updateAdmin' : 'addAdmin';
					const {
						username,
						password,
						role_id,
						_id
					} = this.formData;
					const response = await this.$request('admin', operation, {
						username,
						password,
						role_id,
						_id
					});
					if(response.status === 1){
						this.$message.success('添加成功');
						this.$emit('refreshData');
						this.formVisible = false;
					}else{
						this.$message.error(response.msg);
					}
                })
            },
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
	.tip{
		font-size: 11px;
		color: #ff4443;
	}
</style>
