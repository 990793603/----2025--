<template>
    <el-dialog class="dialog" :title="formTitle" :close-on-click-modal="false" :visible.sync="formVisible">
        <el-form ref="dataForm" :rules="rules" :model="formData" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
			<el-form-item label="发布平台" prop="platform">
			   <el-select v-model="formData.platform" filterable clearable default-first-option placeholder="选择平台" class="handle-select mr5">
			       <el-option v-for="item in platformList" :key="item.value" :label="item.name" :value="item.value"></el-option>
			   </el-select>
			</el-form-item>
			<el-form-item label="版本号" prop="version">
                <el-input v-model="formData.version" clearable maxlength="20" placeholder="请输入版本号 如1.0.1" />
            </el-form-item>
			<el-form-item v-if="formVisible" label="安装包" prop="downloadLink">
				<view ref="input">
					<el-button size="medium" class="confirm-btn" type="primary">上传安装包</el-button>
				</view>
				<text class="file-name">{{ fileName }}</text>
			</el-form-item>
			<el-form-item label="更新内容" prop="description">
			    <el-input type="textarea" :autosize="{ minRows: 4, maxRows: 10}" v-model="formData.description" clearable placeholder="请输入更新内容，多条用;隔开" />
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
				platformList: [
					{name: '安卓', value: 'android'},
				],
				fileName: '',
                formVisible: false, //表单显示状态
                formData: {
					downloadLink: ''
				}, //表单数据
                rules: {
					platform: [{required: true, message: '请选择平台', trigger: ["blur",'change']}],
                    version: [{required: true, message: '请输入版本号', trigger: 'blur'}],
					description: [{required: true, message: '请输入更新内容', trigger: 'blur'}],
					downloadLink: [{required: true, message: '请上传安装包', trigger: ["blur",'change']}],
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
							platform: '',
							version: '',
							description: '',
							downloadLink: ''
						}
						this.fileName = '';
					}
					this.fileName = '';
					setTimeout(()=>{
						this.initUploadBtn();
					}, 500)
				}else{
					this.$refs.dataForm.resetFields();
					this.formData = {}
				}
			}
        },
        methods: {
			//提交
            submit(){
                this.$refs.dataForm.validate(async res=>{
                    if(res === false){
						return;
                    }
					const operation = this.formData._id ? 'update' : 'add';
					const response = await this.$request('version', operation, {
						...this.formData, 
						version: +this.formData.version.replace(/\./g, '')
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
			async upload(file, inputDom){
				const loading = this.$loading({
					background: 'rgba(0,0,0,0.2)',
					fullscreen: true,
					text: '正在上传'
				});
				var reader = new FileReader();
				reader.readAsDataURL(file);
				const base64 = await new Promise(resolve=> {
					reader.onload = function (e) {
						resolve(this.result)
					}
				})
				const fileNameSp = file.name.split('.');
				const tempFilename = + new Date() + ('000000' + Math.floor(Math.random() * 999999)).slice(-6);
				const result = await uniCloud.uploadFile({
					filePath: base64,
					cloudPath: tempFilename + '.' + fileNameSp[fileNameSp.length - 1],
					onUploadProgress: progressEvent=> {
						//上传进度
						let progress = Math.round(
							(progressEvent.loaded * 100) / progressEvent.total
						);
						console.log(progress);
						loading.text = progress + '%';
					}
				});
				if(typeof uniCloud.getTempFileURL === 'undefined'){
					this.formData.downloadLink =  result.fileID;
					this.fileName = file.name || tempFilename;
					this.$message.success('文件上传成功');
				}else{
					const tempFiles = await uniCloud.getTempFileURL({
						fileList: [result.fileID]
					})
					const tempFile = tempFiles.fileList[0];
					if(tempFile.code === 'SUCCESS'){
						this.formData.downloadLink = tempFile.download_url;
						this.fileName = file.name || tempFilename;
						this.$message.success('文件上传成功');
					}else{
						console.log('error');
						this.$message.error('文件上传失败');
					}
				}
				loading.close();
			},
			initUploadBtn(){
				var input = document.createElement('input')
				input.style.width="150px";
				input.style.height="35px";
				input.type = 'file'//添加file类型
				input.style.position="absolute";
				input.style.top="0";
				input.style.left="0";
				input.style.opacity="0";
				input.style.overflow="hidden"; //防止注意input 元素溢出
				input.id = 'file';
				this.$refs.input.$el.appendChild(input);
				input.onchange = (event) => {
					var file = event.target.files[0];
					this.upload(file, input);
				}
			},
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