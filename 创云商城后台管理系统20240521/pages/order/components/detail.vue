<template>
	<el-dialog class="dialog" :close-on-click-modal="false" :visible.sync="formVisible">
		<div v-if="formVisible" class="wrap">
			<div class="s-header">
				<span>订单信息</span>
			</div>
			<div class="cell">
				<span class="tit">订单编号</span>
				<span>{{ data.order_number }}</span>
			</div>
			<div v-if="data.pay_type" class="cell">
				<span class="tit">付款方式</span>
				<span>{{ data.pay_type==='wxpay'?'微信支付':data.pay_type==='alipay'?'支付宝支付':'余额支付' }}</span>
			</div>
			<div v-if="data.remarks" class="cell">
				<span class="tit">订单备注</span>
				<span>{{ data.remarks }}</span>
			</div>
			<div class="log-list">
				<div class="cell" v-for="(item, index) in data.timeline" :key="index">
					<span class="tit">{{ item.type }}</span>
					<span>{{ item.time | date('Y-m-d H:i:s') }}</span>
				</div>
			</div>
			<div v-if="data.refund_product_reason" class="s-header">
				<span>申请退货信息</span>
			</div>
			<div v-if="data.refund_product_reason" class="cell">
				<span class="tit">退货理由</span>
				<span>{{ data.refund_product_reason }}</span>
			</div>
			<div v-if="data.refund_product_images && data.refund_product_images.length > 0" class="cell">
				<span class="tit">退货图片</span>
				<el-image 
					v-for="(url,uIndex) in data.refund_product_images"
					:key="uIndex"
				    style="width: 100px; height: 100px;margin-right: 10px;"
				    :src="url" 
					fit="cover"
				    :preview-src-list="data.refund_product_images">
				  </el-image>
			</div>
			<div v-if="data.refund_product_reason" class="s-header">
				<span>退货物流信息</span>
				<el-button style="margin-left: 12px;padding: 6px 10px;" type="primary" plain @click="loadRefundExpressInfo">查询物流</el-button>
			</div>
			<div v-if="refundExpressInfo.name && refundExpressInfo.data.length > 0" class="exp-list">
				<div class="item" v-for="(item, index) in refundExpressInfo.data" :key="index">
					<span class="time">{{ item.time }}</span>
					<span class="val">{{ item.context }}</span>
				</div>
			</div>
			<div class="s-header">
				<span>商品信息</span>
			</div>
			<div class="p-list">
				<div class="p-item row" v-for="(item, index) in data.products" :key="index">
					<image class="pic" :src="item.image" mode="aspectFill"></image>
					<div class="right column">
						<span class="title">{{ item.title }}</span>
						<span class="attr">{{ item.sku.name }}</span>
						<div class="bot">
							<span class="price">￥{{ item.price | price }}</span>
							<span class="num">x{{ item.number }}</span>
						</div>
					</div>
				</div>
				
				<div class="cell">
					<span class="tit">商品总价</span>
					<span>￥{{ data.price_data.goods_price }}</span>
				</div>
				<div class="cell">
					<span class="tit">订单满减</span>
					<span>-￥{{ data.price_data.full_reduction_money || 0 }}</span>
				</div>
				<div class="cell">
					<span class="tit">优惠券</span>
					<span>-￥{{ data.price_data.coupon_money || 0 }}</span>
				</div>
				<div class="cell">
					<span class="tit">积分抵扣</span>
					<span>-￥0</span>
				</div>
				<div class="cell">
					<span class="tit">实付款</span>
					<span style="font-weight:700;font-size: 16px;color:#ff4400">￥{{ data.price_data.pay_price | price }}</span>
				</div>
			</div>
			<div class="s-header">
				<span>收货信息</span>
			</div>
			<div class="cell">
				<span class="tit">收货人</span>
				<span>{{ data.address.name }}</span>
			</div>
			<div class="cell">
				<span class="tit">联系方式</span>
				<span>{{ data.address.mobile }}</span>
			</div>
			<div class="cell">
				<span class="tit">收货地址</span>
				<span>{{ data.address.address.address }} {{ data.address.address.room }}</span>
			</div>
			<template v-if="expressInfo.name">
				<div class="cell">
					<span class="tit">快递公司</span>
					<span>{{ expressInfo.name }}</span>
				</div>
				<div class="cell">
					<span class="tit">物流单号</span>
					<span>{{ data.logistic_code }}</span>
				</div>
			</template>
			
			<div v-if="data.shipper_code && data.logistic_code" class="s-header">
				<span>物流信息</span>
				<el-button style="margin-left: 12px;padding: 6px 10px;" type="primary" plain @click="loadExpressInfo">查询物流</el-button>
			</div>
			<div v-if="expressInfo.name && expressInfo.data.length > 0" class="exp-list">
				<div class="item" v-for="(item, index) in expressInfo.data" :key="index">
					<span class="time">{{ item.time }}</span>
					<span class="val">{{ item.context }}</span>
				</div>
			</div>
			<div slot="footer" class="dialog-footer center">
				<el-button size="medium" class="confirm-btn" type="primary" @click="formVisible = false">确定</el-button>
			</div>
		</div>
	</el-dialog>
</template>

<script>
	export default {
		data() {
			return {
				data: {},
				refundExpressInfo: [],
				expressInfo: [],
				formVisible: false, //表单显示状态
			}
		},
		methods: {
			open(data){
				data = JSON.parse(JSON.stringify(data))
				data.timeline.reverse()
				this.data = data;
				this.expressInfo = {}
				this.formVisible = true;
			},
			//查询退货物流信息
			async loadRefundExpressInfo(){
				const data = this.data;
				if(!data.refund_express_data || !data.refund_express_data.logistic_code){
					this.$message.error('用户未上传快递单号，无法查询');
					return;
				}
				const res = await this.$request('order', 'getExpressInfo', {
					shipper_code: data.refund_express_data.shipper_code,
					logistic_code: data.refund_express_data.logistic_code,
				});
				const expressInfo = res.data;
				if(expressInfo.name && expressInfo.data && expressInfo.data.length > 0){
					this.refundExpressInfo = expressInfo;
				}else{
					this.$message.error('未查询到物流信息');
				}
			},
			//查询发货物流信息
			async loadExpressInfo(){
				const res = await this.$request('order', 'getExpressInfo', {
					shipper_code: this.data.shipper_code,
					logistic_code: this.data.logistic_code,
					phone: this.data.address.mobile
				});
				const expressInfo = res.data;
				if(expressInfo.name && expressInfo.data && expressInfo.data.length > 0){
					this.expressInfo = expressInfo;
				}else{
					this.$message.error('未查询到物流信息');
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	/deep/{
		.el-dialog__body{
			padding-top: 0px;
		}
		.el-dialog__headerbtn .el-dialog__close{
			font-size: 24px;
		}
		.el-image-viewer__btn{
			color: #fff;
			
			i{
				font-size: 20px;
			}
			i.el-icon-circle-close{
				font-size: 30px;
			}
		}
	}
	.s-header{
		padding-bottom: 16px;
		margin-top: 20px;
		
		&:first-child{
			margin: 0;
		}
		span{
			font-size: 15px;
			color: #333;
			font-weight: bold;
		}
	}
	.cell{
		display: flex;
		padding: 7px 0;
		min-height: 36px;
		padding-left: 20px;
		
		span{
			font-size: 14px;
			color: #333;
		}
		.tit{
			flex-shrink: 0;
			width: 80px;
			color: #999;
		}
	}
	.p-item{
		padding: 10px 20px;
		padding-left: 20px;
		
		.pic{
			flex-shrink: 0;
			width: 70px;
			height: 70px;
			margin-right: 12px;
			border-radius: 4px;
		}
		.title{
			margin-bottom: 6px;
			font-size: 14px;
			color: #333;
		}
		.attr, .num{
			font-size: 13px;
			color: #999;
		}
		.bot{
			padding-top: 8px;
		}
		.price{
			margin-right: 10px;
			font-size: 14px;
		}
	}
	.exp-list{
		padding-left: 20px;
		
		.item{
			display: flex;
			margin-top: 10px;
			
			&:first-child{
				margin-top: 0;
				
				.time, .val{
					color: #409EFF;
				}
			}
		}
		.time{
			flex-shrink: 0;
			width: 150px;
			font-size: 14px;
			color: #999;
			line-height: 1.5;
		}
		.val{
			font-size: 14px;
			color: #999;
			line-height: 1.5;
		}
	}
	.dialog-footer{
		margin-top: 20px;
	}
</style>
