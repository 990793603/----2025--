<script>
	export default {
		onLaunch: function() {
			
		},
		onShow: function() {
			
		},
		onHide: function() {
			
		}
	}
</script>

<style lang="scss">
	@import url("./common/css/common.css");
	@import url("./common/css/icon.css");
	
	* {
		font-size: 13px;
		-webkit-user-select: auto !important;
		user-select: auto !important;
	}
	.content{
		height: 100%;
		overflow: hidden;
	}
	.handle-box {
	    display: flex;
	    align-items: center;
	    padding: 12px 10px;
	    background-color: #fff;
	    border-bottom: 1px solid #f0f0f0;
	    margin-bottom: 5px;
	}
	.el-loading-mask{
		left: 210px !important;
	}
	div /deep/ {
		/* button */
		.el-button--small,
		.el-button--small.is-round {
			padding: 8px 10px;
		}

		.el-button--medium.confirm-btn {
			padding: 9px 36px;
			letter-spacing: 2px;
			font-size: 15px;
		}

		.el-dialog__footer {
			text-align: left;
		}

		/* switch */
		.el-switch {
			transform: scale(1.3);
			margin: 5px 0;

			&.has-text{
				.el-switch__label {
					position: absolute;
					display: none;
					color: #fff;
					line-height: 17px;
				
					span {
						font-size: 10px;
					}
				}
				
				/*打开时文字位置设置*/
				.el-switch__label--right {
					z-index: 1;
					right: -5px;
				}
				
				/*关闭时文字位置设置*/
				.el-switch__label--left {
					z-index: 1;
					left: 20px;
				}
				
				/*显示文字*/
				.el-switch__label.is-active {
					display: block;
				}
				
				.el-switch__core,
				.el-switch__label {
					width: 45px !important;
				}
			}
		}

		/* select */
		.el-select-dropdown__item.is-disabled {
			color: #909399;
		}

		/* pagination */
		.el-pagination {
			padding: 15px 16px;
			background-color: #fff;

			.btn-prev,
			.btn-next {
				border: none !important;
				height: 28px;
				line-height: 28px;
			}
		}

		/* 模态框 */
		.el-message-box {
			padding: 5px 5px 15px;

			.el-button--small {
				padding: 9px 22px;
				letter-spacing: 2px;
				font-size: 13px;

				&:nth-child(2) {
					margin-left: 15px;
				}
			}
		}
		.el-table td.is-center .cell{
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
	/* 滚动条 */
	::-webkit-scrollbar-track-piece {
	    background-color: rgba(255,255,255,.5); /*滚动条的背景颜色*/
	   border-radius: 100px; /*滚动条的圆角宽度*/
	}
	::-webkit-scrollbar {
	    width: 6px; /*滚动条的宽度*/
	    height: 6px; /*滚动条的高度*/
		transform: translateX(10px);
	}
	::-webkit-scrollbar-thumb:vertical { /*垂直滚动条的样式*/
	    height: 50px;
	    background-color: #ccc;
	    border-radius: 100px;
	}
	::-webkit-scrollbar-thumb:hover { /*滚动条的hover样式*/
	    height: 50px;
	    background-color: #9f9f9f;
	   border-radius: 100px;
	}
	
</style>
