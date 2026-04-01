export interface NavigationLinkItem {
  title: string;
  caption: string;
  icon: string;
  route: string;
}

export interface NavigationSection {
  title?: string;
  links: NavigationLinkItem[];
}

export const MAIN_NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    links: [
      {
        title: '仪表盘',
        caption: '首页',
        icon: 'dashboard',
        route: '/app',
      },
      {
        title: '数据报表',
        caption: '病例与报告',
        icon: 'analytics',
        route: '/app/studies',
      },
      {
        title: '患者管理',
        caption: '患者信息',
        icon: 'people',
        route: '/app/patients',
      },
      {
        title: '上传分析',
        caption: '新分析',
        icon: 'upload',
        route: '/app/upload',
      },
    ],
  },
  {
    title: '分析功能',
    links: [
      {
        title: '随访管理',
        caption: '复查计划',
        icon: 'event_note',
        route: '/app/follow-ups',
      },
      {
        title: '套餐订阅',
        caption: '套餐权益',
        icon: 'api',
        route: '/app/models',
      },
      {
        title: '订单管理',
        caption: '账单与续约',
        icon: 'receipt_long',
        route: '/app/orders',
      },
      {
        title: 'AI与偏好设置',
        caption: '引擎与服务',
        icon: 'tune',
        route: '/app/ai-preferences',
      },
      {
        title: '系统设置',
        caption: '系统配置',
        icon: 'settings',
        route: '/app/settings',
      },
    ],
  },
];
