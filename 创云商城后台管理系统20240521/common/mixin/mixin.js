export default{
	data(){
		return {
			loaded: false, 
			page: 1,
			pageLimit: 15,
			totalSize: 0,
		}
	},
	methods: {
		showPopup(key, params){
			this.$refs[key].open(params);
		},
		hidePopup(key){
			this.$refs[key].close();
		},
		/* 分页 */
		pagination(page){
		    this.page = page;
		    this.loadList();
		},
	}
}