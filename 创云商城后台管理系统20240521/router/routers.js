import Layout from '@/layout/index'

export default [{
		path: '/login',
		component: () => import('@/pages/login/login.vue'),
		name: 'login',
		meta: {
			title: '用户登录',
			hideInMenu: true,
			hideInBread: true
		}
	},
	{
		path: '/',
		name: '_index',
		component: Layout,
		meta: {
			title: '首页',
			hideInMenu: true,
			icon: 'md-home'
		},
		children: [{
			path: 'index',
			name: 'index',
			meta: {
				title: '首页',
				icon: 'md-home'
			},
			component: () => import('@/pages/index/index')
		}]
	},
	{
		path: '/admin',
		component: Layout,
		name: '/admin/admin',
		meta: {
			title: '系统管理',
			icon: 'el-icon-s-order'
		},
		children: [
			{
				path: 'admin',
				name: 'admin',
				meta: {
					title: '管理员管理',
					access: ['admin']
				},
				component: () => import('@/pages/admin/admin')
			},
			{
				path: 'roles',
				name: 'roles',
				meta: {
					title: '分组管理',
					access: ['roles']
				},
				component: () => import('@/pages/admin/roles')
			}
		]
	},
	{
		path: '/product',
		component: Layout,
		name: '/product/index',
		meta: {
			title: '商品管理',
			icon: 'el-icon-goods'
		},
		children: [
			{
				path: 'product',
				name: 'product',
				meta: {
					title: '商品管理',
					access: ['product']
				},
				component: () => import('@/pages/product/product')
			}, {
				path: 'product-category',
				name: 'product-category',
				meta: {
					title: '分类管理',
					access: ['productCategory']
				},
				component: () => import('@/pages/product/category')
			}, {
				path: 'rating',
				name: 'rating',
				meta: {
					title: '评价管理',
					access: ['rating']
				},
				component: () => import('@/pages/rating/rating')
			},
		]
	},
	{
		path: '/order',
		component: Layout,
		name: '/order/list',
		meta: {
			title: '订单管理',
			icon: 'el-icon-s-order'
		},
		children: [
			{
				path: 'order',
				name: 'order',
				meta: {
					title: '订单管理',
					access: ['order']
				},
				component: () => import('@/pages/order/list')
			}
		]
	},
	{
		path: '/promotion',
		component: Layout,
		name: '/promotion/index',
		meta: {
			title: '促销管理',
			icon: 'el-icon-s-data'
		},
		children: [
			{
				path: 'coupon',
				name: 'coupon',
				meta: {
					title: '优惠券',
					access: ['coupon']
				},
				component: () => import('@/pages/coupon/list')
			},{
				path: 'full-reduction',
				name: 'full-reduction',
				meta: {
					title: '订单满减',
					access: ['full-reduction']
				},
				component: () => import('@/pages/full-reduction/list')
			}
		]
	},
	{
		path: '/user',
		component: Layout,
		name: '/user/user',
		meta: {
			title: '用户管理',
			icon: 'el-icon-user'
		},
		children: [
				{
				path: 'user',
				name: 'user',
				meta: {
					title: '用户管理',
					access: ['user']
				},
				component: () => import('@/pages/user/user')
			},{
				path: 'feedback',
				name: 'feedback',
				meta: {
					title: '意见反馈',
					access: ['feedback']
				},
				component: () => import('@/pages/user/feedback')
			}
		]
	},
	{
		path: '/money-log',
		component: Layout,
		name: '/money-log/index',
		meta: {
			title: '财务管理',
			icon: 'el-icon-money'
		},
		children: [
				{
				path: 'money-log',
				name: 'money-log',
				meta: {
					title: '资金记录',
					access: ['moneyLog']
				},
				component: () => import('@/pages/money-log/index')
			}
		]
	},
	{
		path: '/advert',
		component: Layout,
		name: '/advert/index',
		meta: {
			title: '广告管理',
			icon: 'el-icon-film'
		},
		children: [
			{
				path: 'navigator',
				name: 'navigator',
				meta: {
					title: '导航管理',
					access: ['navigator']
				},
				component: () => import('@/pages/advert/navigator')
			},{
				path: 'advert',
				name: 'advert',
				meta: {
					title: '广告管理',
					access: ['advert']
				},
				component: () => import('@/pages/advert/advert')
			}
		]
	},
	{
		path: '/article',
		component: Layout,
		name: '/article/index',
		meta: {
			title: '文章管理',
			icon: 'el-icon-notebook-1'
		},
		children: [
			{
				path: 'article',
				name: 'article',
				meta: {
					title: '文章列表',
					access: ['article']
				},
				component: () => import('@/pages/article/article')
			},{
				path: 'article-category',
				name: 'article-category',
				meta: {
					title: '文章分类',
					access: ['articleCategory']
				},
				component: () => import('@/pages/article/category')
			}
		]
	},
	{
		path: '/notice',
		component: Layout,
		name: '/notice/index',
		meta: {
			title: '公告管理',
			icon: 'el-icon-chat-line-square'
		},
		children: [
			{
				path: 'notice',
				name: 'notice',
				meta: {
					title: '公告列表',
					access: ['notice']
				},
				component: () => import('@/pages/notice/notice')
			}
		]
	},
	{
		path: '/express',
		component: Layout,
		name: '/express/index',
		meta: {
			title: '物流管理',
			icon: 'el-icon-box'
		},
		children: [
			{
				path: 'express',
				name: 'express',
				meta: {
					title: '物流公司',
					access: ['express']
				},
				component: () => import('@/pages/express/list')
			},
			{
				path: 'refund-address',
				name: 'refund-address',
				meta: {
					title: '退货回邮地址',
					access: ['refund-address']
				},
				component: () => import('@/pages/refund-address/list')
			}
		]
	},
	{
		path: '/version',
		component: Layout,
		name: '/version/index',
		meta: {
			title: '版本管理',
			icon: 'el-icon-upload'
		},
		children: [
			{
				path: 'version',
				name: 'version',
				meta: {
					title: '历史版本',
					access: ['version']
				},
				component: () => import('@/pages/version/version')
			}
		]
	},
	{
		path: '/401',
		name: 'error_401',
		meta: {
			hideInMenu: true
		},
		component: () => import('@/pages/error-page/401.vue')
	},
	{
		path: '/500',
		name: 'error_500',
		meta: {
			hideInMenu: true
		},
		component: () => import('@/pages/error-page/500.vue')
	},
	{
		path: '*',
		name: 'error_404',
		meta: {
			hideInMenu: true
		},
		component: () => import('@/pages/error-page/404.vue')
	}
]
