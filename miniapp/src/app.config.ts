export default {
  pages: [
    'pages/index/index',
    'pages/elderly-detail/elderly-detail',
    'pages/alert-list/alert-list',
    'pages/alert-detail/alert-detail',
    'pages/bind/bind',
    'pages/mine/mine',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1890ff',
    navigationBarTitleText: 'SmartCare 守护家人',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '🏠 首页',
      },
      {
        pagePath: 'pages/alert-list/alert-list',
        text: '🔔 告警',
      },
      {
        pagePath: 'pages/mine/mine',
        text: '👤 我的',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于紧急情况定位',
    },
  },
};
