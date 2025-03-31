<template>
    <div class="image-upload-content">
		
		<div class="image-wrap" v-for="(item, index) in fileList" :key="index">
			<image 
				class="image" 
				mode="aspectFill" 
				:src="item.filePath"
				@click="openImageViewer"
			></image>
			<!-- 进度条 -->
			<view v-if="item.progress < 100" class="progress-wrap">
				<text class="progress">{{ item.progress }}%</text>
			</view>
			<!-- 操作项 -->
			<view class="options">
				<i class="el-icon-zoom-in" @click="openImageViewer"></i>
				<i class="el-icon-delete" @click="deleteFile(index)"></i>
			</view>
		</div>
		<!-- 新增按钮 -->
		<div v-if="fileList.length < count" class="add-btn" @click="chooseImage">
			<i class="el-icon-plus"></i>
		</div>
		<!-- 查看大图 -->
		<el-image-viewer 
			v-if="showImageViewer" 
			:on-close="closeImageViewer" 
			:url-list="fileList.map(v=>v.filePath)" 
		></el-image-viewer>
    </div>
</template>

<script>
	import ElImageViewer from 'element-ui/packages/image/src/image-viewer'
    export default {
        name: 'MixImageUpload',
		components: { ElImageViewer },
        data(){
            return {
				showImageViewer: false,
                fileList: []
            }
        },
        props: {
			files: {
				type: Array,
				default(){
					return [];
				}
			},
            count: {
                type: Number,
                default: 1
            },
			index: {
				type: Number,
				default: 0
			}
        },
        created() {
			setTimeout(()=>{
				this.fileList = this.files.map(item=>{
					return {
						filePath: item,
						url: item
					}
				})
			}, 500)
        },
        methods: {
			/* 预览 */
			openImageViewer(){
				this.showImageViewer = true;
			},
			/* 关闭预览 */
			closeImageViewer(){
				this.showImageViewer = false;
			},
			chooseImage(){
				uni.chooseImage({
					count: this.count - this.fileList.length,
					success: res=>{
						const files = res.tempFiles;
						for(let i=0; i<files.length; i++){
							if(this.fileList.length >= this.count){
								this.$message.error('最多上传'+ this.count + '张图片');
								return;
							}
							this.fileList.push({
								progress: 0,
								filePath: files[i].path
							});
							this.upload(files[i], this.fileList.length - 1);
						}
					}
				})
			},
			/**
			 * 上传图片
			 */
			async upload(file, index){
				let fileName = + new Date() + ('000000' + Math.floor(Math.random() * 999999)).slice(-6);
				fileName += file.type === 'image/jpeg' ? '.jpg' : '.png';
 				const result = await uniCloud.uploadFile({
					filePath: file.path,
					cloudPath: fileName,
					onUploadProgress: progressEvent=> {
						//上传进度
						this.fileList[index].progress = Math.round(
							(progressEvent.loaded * 100) / progressEvent.total
						);
					}
				});
				
				const tempFiles = await uniCloud.getTempFileURL({
					fileList: [result.fileID]
				})
				const tempFile = tempFiles.fileList[0];
				if(tempFile.download_url || tempFile.fileID){
					this.fileList[index].url = tempFile.download_url || tempFile.fileID;
					this.$emit('onChanged', this.fileList.map(item=> item.url), this.index);
				}else{
					this.fileList.splice(index, 1);
				}
			},
			deleteFile(index){
				this.fileList.splice(index, 1);
				this.$emit('onChanged', this.fileList.map(item=> item.url), this.index);
			}
        }
    }
</script>

<style scoped lang="scss">
	.image-upload-content{
		display: flex;
		flex-wrap: wrap;
	}
	.image-wrap, .add-btn{
		width: 80px;
		height: 80px;
		margin-bottom: 8px;
	}
	.image-wrap{
		margin-right: 8px;
		position: relative;
		border-radius: 6px;
		overflow: hidden;
		
		.image{
			width: 100%;
			height: 100%;
		}
		.progress-wrap, .options{
			position: absolute;
			left: 0;
			top: 0;
			z-index: 15;
			width: 100%;
			height: 100%;
			background-color: rgba(0,0,0,.5);
		}
		.progress-wrap{
			font-size: 12px;
			color: #fff;
			line-height: 80px;
			text-align: center;
		}
		.options{
			line-height: 80px;
			text-align: center;
			opacity: 0;
			
			&:hover{
				opacity: 1;
			}
			i{
				padding: 6px;
				font-size: 17px;
				color: #fff;
			}
		}
	}
	.add-btn{
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #fbfdff;
		border: 1px dashed #c0ccda;
		border-radius: 6px;
		
		i{
			font-size: 28px;
			color: #8c939d;
		}
	}
	/deep/ .el-icon-circle-close{
		color: #fff;
		font-size: 24px;
	}
	/deep/ .el-image-viewer__mask{
		opacity: .7;
	}
</style>
