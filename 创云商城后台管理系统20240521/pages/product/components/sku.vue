<template>
    <div>
        <!-- 规格列表 -->
        <div class="spec-list">
            <div class="spec-item" v-for="(specItem, specIndex) in specList" :key="specIndex">
                <div class="spec-title-wrapper">
                    <span>{{ specItem.name }}</span>
                    <i class="el-icon-error" @click="deleteSpec(specItem, specIndex)"></i>
                </div>
                <div class="attr-list">
                    <!-- 属性列表-->
                    <div v-if="attrItem.parent == specItem.name" class="attr-item" v-for="(attrItem, attrIndex) in attrList" :key="attrIndex">
                        <span>{{ attrItem.name }}</span>
                        <i class="el-icon-error" @click="deleteAttr(attrIndex)"></i>
                    </div>
                    <!-- 新增属性 -->
                    <div class="attr-input-wrapper">
                        <el-input maxlength="20" placeholder="请输入规格值" v-model="specItem.newAttr"></el-input>
                        <div class="attr-add-btn" @click="addNewAttr(specItem)">
                            <span>添加</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 新增规格属性-->
        <div v-if="newState" class="spec-add-wrapper">
            <div class="spec-add-input-wrapper">
                <el-input v-model="newSpec" maxlength="20" placeholder="请输入规格名称"></el-input>
                <el-input v-model="newAttr" maxlength="20" placeholder="请输入规格值"></el-input>
            </div>
            <el-button type="primary" @click="addSpecAttr">确 定</el-button>
            <el-button @click="toggleSpec">取 消</el-button>
        </div>
        <el-button v-else type="primary" icon="el-icon-circle-plus-outline" @click="toggleSpec" >添加规格</el-button>
        <!-- 规格属性tabel -->
        <el-table v-if="skuList.length > 0" class="sku-table" :data="skuList" border>
            <el-table-column prop="name" label="规格"></el-table-column>
            <el-table-column prop="image" label="规格图片" align="center" width="90">
				<template slot-scope="scope">
					<image-upload 
						:index="scope.$index" 
						:files="scope.row.image ? [scope.row.image] : []"
						@onChanged="onImageChanged"
					></image-upload>
				</template>
            </el-table-column>
            <el-table-column prop="price" label="销售价" width="120">
                <template slot-scope="scope">
                    <el-input v-model="scope.row.price" v-el-input="'price'" maxlength="8" ></el-input>
                </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="120">
                <template slot-scope="scope">
                    <el-input v-model="scope.row.stock" v-el-input="'int'" maxlength="8" @input="onStockChange"></el-input>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
    export default {
        directives: {
            elInput: {
                update(el, { value, modifiers }, vnode) {
                    try {
                        const element = el.children[0];
                        if(!element.value){
                           return false;
                        }
                        switch(value){
                            case 'price':
                                element.value= element.value.match(/\d+(\.\d{0,2})?/) ? element.value.match(/\d+(\.\d{0,2})?/)[0] : ''
                                break;
                            case 'int':
                                element.value= element.value.replace(/[^\d]/g, '');
                                break;
                        }
                        element.dispatchEvent(new Event(modifiers.lazy ? 'change' : 'input'))
                    } catch (e) {}
                }
            },
        },
        data() {
            return {
                newState: false, //是否正在新增规格
                newSpec: '', //新增规格
                newAttr: '', //新增属性
                specList: [
                    /* {name: '颜色', newAttr: ''},
                    {name: '尺寸', newAttr: ''}, */
                ],
                attrList: [
                    /* {name: '蓝色', parent: '颜色'},
                    {name: '红色', parent: '颜色'},
                    {name: '14寸', parent: '尺寸'},
                    {name: '15寸', parent: '尺寸'}, */
                ],
                skuList: []
            }
        },
		props: {
			skuData: {
				type: Object,
				default(){
					return {}
				}
			},
			sku: {
				type: Array,
				default(){
					return []
				}
			}
		},
        watch: {
            specList(){
                this.calcCombination();
            },
            attrList(){
                this.calcCombination();
            }
        },
		created() {
			if(this.sku && this.sku.length > 0){
				if(!this.skuData.specList || this.skuData.specList.length === 0 || !this.skuData.attrList || this.skuData.attrList.length === 0){
					return;
				}
				this.specList = this.skuData.specList;
				this.attrList = this.skuData.attrList;
				this.$nextTick(()=>{
					this.skuList = this.sku;
				})
			}
		},
        methods: {
            /* 初始化 */
            init(data = null){
                this.newState = false,
                this.newSpec = '';
                this.newAttr = '';
                this.specList = [];
                this.attrList = [];
                this.skuList = [];
            },
            /* 面板状态 -> 新增规格 */
            toggleSpec(){
                this.newState = !this.newState;
            },
            /* 新增规格 */
            addSpecAttr(){
                const {newSpec, newAttr, specList} = this;
                if(!newSpec || !newAttr){
                    this.$message.error('请填写规格或规格值');
                    return;
                }
                if(specList.some(spec=> spec.name == newSpec)){
                    this.$message.error('已经存在相同规格');
                    return;
                }
                this.specList.push({
                    name: newSpec,
					newAttr: ''
                })
                this.attrList.push({
                    name: newAttr,
                    parent: newSpec
                })
                this.toggleSpec();
            },
            /* 删除规格 */
            deleteSpec(item, index){
				this.$confirm(`是否要删除规格：${item.name}，删除后不可恢复`, '删除规格', {
				    confirmButtonText: '删除',
				    type: 'warning'
				}).then(async ()=>{
					this.attrList = this.attrList.filter(attr=> attr.parent != item.name);
					this.specList.splice(index, 1);
				}).catch(()=>{})
            },
            /* 新增属性 */
            addNewAttr(item){
                if(!item.newAttr){
                    this.$message.error('请填写规格值');
                    return;
                }
                if(this.attrList.some(attr=>attr.name == item.newAttr && attr.parent == item.name)){
                     this.$message.error('已经存在相同规格值');
                     return;
                }
                this.attrList.push({
                    name: item.newAttr,
                    parent: item.name
                })
                item.newAttr = '';
            },
            /* 删除属性 */
            deleteAttr(index){
                this.attrList.splice(index, 1);
            },
            /* 组合规格与属性 */
            calcCombination(){
                const list = [];
                this.specList.forEach(spec=> {
                    list.push(
                        this.attrList.filter(attr=> attr.parent === spec.name).map(fattr=> fattr.name)
                    );
                })
            	let tempArray = [];
            	list.forEach((arrItem) => {
            		if (tempArray.length === 0) {
            			tempArray = arrItem;
            		} else {
            			const emptyArray = [];
            			tempArray.forEach((item) => {
            				arrItem.forEach((value) => {
            					emptyArray.push(typeof item === 'string' ? [item, value] : [...item, value])
            				})
            			})
                        tempArray = emptyArray;
            		}
            	});
                this.skuList = tempArray.map(sku=>{
                    const index = this.skuList.findIndex(item=> item.name == sku.name);
                    if(index >= 0){
                        return this.skuList[index];
                    }
                    return {
                        name: typeof sku === 'string' ? sku : sku.join(' '),
                        image: '',
                        price: '',
                        stock: ''
                    }
                });
				this.$nextTick(()=>{
					this.$forceUpdate();
					this.onStockChange();
				})
            },
			onImageChanged(files, index){
				this.skuList[index].image = files.length > 0 ? files[0] : '';
			},
			onStockChange(){
				let stock = 0;
				this.skuList.forEach(item=>{
					stock += item.stock ? +item.stock : 0;
				})
				this.$emit('setStock', stock || '');
			}
        }
    }
</script>

<style lang="scss" scoped>
    /* 图片列*/
    .sku-table{
        margin-top: 15px;

        /deep/ .is-center .cell{
            max-height: 50px;
            overflow: hidden;
        }
		/deep/ .image-upload-content{
			padding-left: 10px;
			
			.image-wrap{
				width: 50px;
				height: 50px;
				margin: 0;
				border-radius: 3px;
			}
			.add-btn{
				width: 50px;
				height: 50px;
				margin: 0;
				border-radius: 3px;
				
				i{
					font-size: 20px;
				}
			}
			.options{
				line-height: 50px;
				
				i{
					padding: 4px;
					font-size: 14px;
				}
			}
		}
    }

    /* 加宽行 */
    .form-item-widen{
        width: 600px;
    }
    .el-table--small{
        min-width: 600px;
    }

    /* 新增规格 */
    .spec-add-wrapper{

        .spec-add-input-wrapper{
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 76px;
            padding: 10px 0 8px;
        }
        .el-input{
            width: 200px;
        }
    }

    /* 规格列表 */
    .spec-list{

        .spec-title-wrapper{
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            font-size: 14px;
            color: #303133;

            .el-icon-error{
                padding: 0 6px;
                font-size: 16px;
                color: #909399;
            }
        }
    }
    /* 属性列表 */
    .attr-list{
        display: flex;
        flex-wrap: wrap;

        .attr-item{
            flex-shrink: 0;
            padding: 0 15px;
            margin-right: 12px;
            margin-bottom: 12px;
            border: 1px solid #DCDFE6;
            border-radius: 2px;
            position: relative;

            .el-icon-error{
                position: absolute;
                right: -7px;
                top: -7px;
                font-size: 14px;
                color: #909399;
                display: none;
            }
            &:hover .el-icon-error{
                display: block;
            }
        }

        .attr-input-wrapper{
            position: relative;
            margin-bottom: 12px;

            .attr-add-btn{
                position: absolute;
                right: 1px;
                top: 1px;
                width: 67px;
                height: 30px;
                font-size: 13px;
                color: #909399;
                text-align: center;
                line-height: 30px;
                border-left: 1px solid #DCDFE6;
                border-radius: 0 4px 4px 0;
                background-color: #f5f7fa;
            }
            .el-input{
                width: 190px;

                & /deep/ .el-input__inner{
                    padding: 0 70px 0 5px;
                }
            }
        }
    }
</style>
