<template>
    <div :class="{fullscreen:fullscreen, loaded: loaded}" class="tinymce-container" :style="{width:containerWidth}">
        <textarea :id="tinymceId" class="tinymce-textarea" />
    </div>
</template>

<script>
import plugins from './plugins'
import toolbar from './toolbar'
import load from './dynamicLoadScript'

const tinymceCDN = 'https://cdn.jsdelivr.net/npm/tinymce-all-in-one@4.9.3/tinymce.min.js'

export default {
    name: 'Tinymce',
    props: {
        id: {
            type: String,
            default() {
                return 'vue-tinymce-' + +new Date() + ((Math.random() * 1000).toFixed(0) + '')
            }
        },
        value: {
            type: String,
            default: ''
        },
        toolbar: {
            type: Array,
            required: false,
            default() {
                return []
            }
        },
        menubar: {
            type: String,
            default: 'file edit insert view format table'
        },
        height: {
            type: [Number, String],
            required: false,
            default: 360
        },
        width: {
            type: [Number, String],
            required: false,
            default: 'auto'
        }
    },
    data() {
        return {
			loaded: false,
            hasChange: false,
            hasInit: false,
            tinymceId: this.id,
            fullscreen: false,
            languageTypeList: {
                'en': 'en',
                'zh': 'zh_CN',
                'es': 'es_MX',
                'ja': 'ja'
            }
        }
    },
    computed: {
        containerWidth() {
            const width = this.width
            if (/^[\d]+(\.[\d]+)?$/.test(width)) { // matches `100`, `'100'`
                return `${width}px`
            }
            return width
        }
    },
    watch: {
        value(val) {
            if (!this.hasChange && this.hasInit) {
                this.$nextTick(() =>
                window.tinymce.get(this.tinymceId).setContent(val || ''))
            }
        }
    },
    mounted() {
        this.init()
    },
    activated() {
        if (window.tinymce) {
            this.initTinymce()
        }
    },
    deactivated() {
        this.destroyTinymce()
    },
    destroyed() {
        this.destroyTinymce()
    },
    methods: {
        init() {
            // dynamic load tinymce from cdn
            load(tinymceCDN, (err) => {
                if (err) {
                    this.$message.error(err.message)
                    return
                }
                this.initTinymce()
            })
        },
        initTinymce() {
            const _this = this
            window.tinymce.init({
                selector: `#${this.tinymceId}`,
                images_upload_handler: async (blobInfo, succFun, failFun, progress)=> {
                    progress(0);
					let fileName = + new Date() + ('000000' + Math.floor(Math.random() * 999999)).slice(-6);
					fileName += blobInfo.blob().type === 'image/jpeg' ? '.jpg' : '.png';
					const result = await uniCloud.uploadFile({
						filePath: blobInfo.blobUri(),
						cloudPath: fileName,
						onUploadProgress: progressEvent=> {
							progress(Math.round(
								(progressEvent.loaded * 100) / progressEvent.total
							));
						}
					});
					
					const tempFiles = await uniCloud.getTempFileURL({
						fileList: [result.fileID]
					})
					const tempFile = tempFiles.fileList[0];
					if(tempFile.download_url || tempFile.fileID){
						succFun(tempFile.download_url || tempFile.fileID);
					}else{
						failFun('上传失败');
					}
                },
                language: this.languageTypeList['zh'],
                height: this.height,
                body_class: 'panel-body ',
                object_resizing: false,
                toolbar: this.toolbar.length > 0 ? this.toolbar : toolbar,
                menubar: this.menubar,
                plugins: plugins,
                end_container_on_empty_block: true,
                powerpaste_word_import: 'clean',
                code_dialog_height: 450,
                code_dialog_width: 1000,
                advlist_bullet_styles: 'square',
                advlist_number_styles: 'default',
                imagetools_cors_hosts: ['www.tinymce.com', 'codepen.io'],
                default_link_target: '_blank',
                link_title: false,
                nonbreaking_force_tab: true, // inserting nonbreaking space &nbsp; need Nonbreaking Space Plugin
                init_instance_callback: editor => {
                    //if (_this.value) {
                       editor.setContent(_this.value || '')
					   setTimeout(()=>{
						   this.loaded = true;
					   }, 100)
                    //}
                    _this.hasInit = true
                    editor.on('NodeChange Change KeyUp SetContent', () => {
                        this.hasChange = true
                        this.$emit('input', editor.getContent())
                    })
                },
                setup(editor) {
                    editor.on('FullscreenStateChanged', (e) => {
                        _this.fullscreen = e.state
                    })
                }
            })
        },
        destroyTinymce() {
            const tinymce = window.tinymce.get(this.tinymceId)
                if (this.fullscreen) {
                tinymce.execCommand('mceFullScreen')
            }

            if (tinymce) {
                tinymce.destroy()
            }
        },
        setContent(value) {
            window.tinymce.get(this.tinymceId).setContent(value)
        },
        getContent() {
            window.tinymce.get(this.tinymceId).getContent()
        },
        imageSuccessCBK(arr) {
            const _this = this
            arr.forEach(v => {
                window.tinymce.get(_this.tinymceId).insertContent(`<img class="wscnph" src="${v.url}" >`)
            })
        }
    }
}
</script>

<style scoped lang="scss">
	/deep/ {
		.tinymce-container {
		    position: relative;
		    line-height: normal;
		}
		.tinymce-container>>>.mce-fullscreen {
		    z-index: 10000;
		}
		.tinymce-textarea {
		    visibility: hidden;
		    z-index: -1;
		}
		.editor-custom-btn-container {
		    position: absolute;
		    right: 4px;
		    top: 4px;
		    /*z-index: 2005;*/
		}
		.fullscreen .editor-custom-btn-container {
		    z-index: 10000;
		    position: fixed;
		}
		.editor-upload-btn {
		    display: inline-block;
		}
		.mce-tinymce{
		    box-shadow: 0 1px 2px rgba(0, 0, 0, 0) !important;
		    border-color: #DCDFE6 !important;
		}
		.mce-top-part::before{
		    box-shadow: 0 1px 2px rgba(0, 0, 0, 0) !important;
		}
		.mce-edit-area{
		    border-color: #DCDFE6 !important;
			
			iframe{
				opacity: 0;
			}
		}
		.mce-statusbar{
		    border-color: #DCDFE6 !important;
		}
		#mceu_27{
		    border-radius: 5px;
		    overflow: hidden;
		}
		/* 菜单图标字体颜色 */
		.mce-ico{
		    color: #7e8086 !important;
		}
		/* 选中项图标为白色 */
		.mce-btn.mce-active i{
		    color: #fff !important;
		}
		/* 背景颜色图标 */
		i.mce-i-backcolor{
		    color: #fff !important;
		    background-color: #ff944c !important;
		}
		/* 字体颜色图标 */
		i.mce-i-forecolor{
		    color: #ff944c !important;
		    transform: scale(1.1);
		}
	}
	.loaded /deep/ iframe{
		opacity: 1;
	}
</style>