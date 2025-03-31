<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
            <el-form-item label="优惠券名称" prop="title">
                <el-input v-model="formData.title" clearable maxlength="20" placeholder="请输入优惠券名称" />
            </el-form-item>
            <el-form-item label="使用金额" prop="total_money">
                <el-input v-model="formData.total_money" clearable maxlength="4" placeholder="请输入最低使用金额" />
            </el-form-item>
			<el-form-item label="优惠券面值" prop="coupon_money">
			    <el-input v-model="formData.coupon_money" clearable maxlength="4" placeholder="请输入优惠券面值" />
			</el-form-item>
			<el-form-item label="发放数量" prop="number">
			    <el-input v-model="formData.number" clearable maxlength="4" placeholder="请输入发放数量" />
			</el-form-item>
			<el-form-item label="生效时间" prop="start_time">
				<el-date-picker
					v-model="formData.start_time"
					type="datetime"
					placeholder="请选择生效时间">
				</el-date-picker>
			</el-form-item>
			<el-form-item label="过期时间" prop="end_time">
				<el-date-picker
					v-model="formData.end_time"
					type="datetime"
					placeholder="请选择过期时间">
				</el-date-picker>
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
                rules: {
                    title: [{required: true, message: '请输入优惠券名称', trigger: 'blur'}],
                    total_money: [{required: true, message: '请输入最低使用金额', trigger: 'blur'}],
					coupon_money: [{required: true, message: '请输入优惠券面值', trigger: 'blur'}],
					number: [{required: true, message: '请输入发放数量', trigger: 'blur'}],
					start_time: [{required: true, message: '请选择生效时间', trigger: 'blur'}],
					end_time: [{required: true, message: '请选择过期时间', trigger: 'blur'}],
                }
            }
        },
		computed: {
			formTitle(){
				return this.formData._id ? '修改优惠券' : '添加优惠券';
			}
		},
        watch: {
			formVisible(state){
			    if(state){
					//默认数据
					if(!this.formData._id){
						this.formData = {
							title: '',
							total_money: '',
							coupon_money: '',
							number: '',
							start_time: '',
							end_time: '',
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
					const data = {
						...this.formData,
						start_time: +this.formData.start_time,
						end_time: +this.formData.end_time,
						total_money: +this.formData.total_money,
						coupon_money: +this.formData.coupon_money,
						number: +this.formData.number
					}
					const operation = data._id ? 'update' : 'add';
					const response = await this.$request('coupon', operation, data);
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
            margin-bottom: 5vh;
            min-width: 880px;
            max-width: 880px;
        }
    }
</style>
