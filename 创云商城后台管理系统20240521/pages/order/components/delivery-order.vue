<template>
	<el-dialog class="dialog" title="订单发货" :close-on-click-modal="false" :visible.sync="formVisible">
	    <el-form v-if="formVisible" ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
	       <el-form-item label="收货人姓名">
				<span>{{ data.address.name }}</span>
	       </el-form-item>
		   <el-form-item label="联系方式">
		   		<span>{{ data.address.mobile }}</span>
		   </el-form-item>
		   <el-form-item label="收货地址">
		   		<span>{{ data.address.address.address }}{{ data.address.room }}</span>
		   </el-form-item>
			<el-form-item label="快递公司" prop="shipper_code">
	            <el-select v-model="formData.shipper_code" filterable default-first-option placeholder="请选择快递公司">
	                <el-option v-for="item in expressList" :key="item.code" :label="item.name" :value="item.code"></el-option>
	            </el-select>
	        </el-form-item>
			<el-form-item label="快递单号" prop="logistic_code">
	            <el-input v-model="formData.logistic_code" clearable maxlength="50" placeholder="请输入快递单号" />
	        </el-form-item>
	    </el-form>
	    <div slot="footer" class="dialog-footer" style="padding-left: 140px">
	        <el-button size="medium" class="confirm-btn" @click="formVisible=false"> 取消 </el-button>
	        <el-button style="margin-left: 10px;" size="medium" class="confirm-btn" type="primary" @click="submit"> 提交 </el-button>
	    </div>
	</el-dialog>
</template>

<script>
	export default {
		data() {
			return {
				expressList: [], //快递公司
				data: {},
				formVisible: false, //表单显示状态
				formData: {}, //表单数据
				rules: {
					shipper_code: [{required: true, message: '请选择快递公司', trigger: 'blur'}],
				    logistic_code: [{required: true, message: '请输入快递单号', trigger: 'blur'}],
				}
			}
		},
		created() {
			this.loadExpress();
		},
		methods: {
			//提交
			submit(){
				this.$refs.dataForm.validate(async res=>{
				    if(res === false){
						return;
				    }
					const data = {
						order_id: this.data._id,
						shipper_name: this.expressList.filter(item=> item.code === this.formData.shipper_code)[0].name,
						...this.formData
					}
					const response = await this.$request('order', 'deliveryOrder', data);
					if(response.status === 1){
						this.$message.success(response.msg);
						this.$emit('refreshData');
						this.formVisible = false;
					}else{
						this.$message.error(response.msg);
					}
				})
			},
			//获取快递公司列表
			async loadExpress(){
				const res = await this.$request('order', 'getExpressComp')
				this.expressList = res.data;
			},
		}
	}
</script>

<style scoped lang="scss">

</style>
