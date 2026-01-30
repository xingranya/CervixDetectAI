export interface Hospital {
  id: string;
  name: string;
  icon: string;
  // 如果是自定义图片，使用 iconUrl
  iconUrl?: string;
}

export interface Department {
  code: string;
  name: string;
}

export const HOSPITALS: Hospital[] = [
  { id: 'JZ_CENTRAL', name: '荆州市中心医院', icon: 'local_hospital', iconUrl: '/icons/hospitals/jz_central.png' },
  { id: 'JZ_JINDUN', name: '荆州区金盾门诊', icon: 'health_and_safety' },
  { id: 'WH_PEOPLE', name: '武汉大学人民医院', icon: 'medical_services', iconUrl: '/icons/hospitals/wh_people.png' },
  { id: 'HUST_TONGJI', name: '华中科技大学同济医学院', icon: 'school', iconUrl: '/icons/hospitals/hust_tongji.png' },
  { id: 'JL_SANHU', name: '江陵县三湖管理区卫生院', icon: 'healing' },
  { id: 'JZ_BAOHETANG', name: '荆州保和堂中医诊所', icon: 'spa' },
  { id: 'JZ_FUYOU', name: '荆州市妇幼保健院', icon: 'child_care', iconUrl: '/icons/hospitals/jz_fuyou.png' }
];

export const DEPARTMENTS: Department[] = [
  { code: 'FK', name: '妇科' },
  { code: 'CK', name: '产科' },
  { code: 'NK', name: '内科' },
  { code: 'WK', name: '外科' },
  { code: 'PF', name: '皮肤科' },
  { code: 'YK', name: '眼科' },
  { code: 'EK', name: '儿科' },
  { code: 'KQ', name: '口腔科' },
  { code: 'GK', name: '骨科' },
  { code: 'SJ', name: '神经科' },
  { code: 'XN', name: '心内科' },
  { code: 'HX', name: '呼吸科' },
  { code: 'XH', name: '消化科' },
  { code: 'MN', name: '泌尿科' },
  { code: 'ZY', name: '中医科' },
  { code: 'JY', name: '检验科' },
  { code: 'YX', name: '影像科' },
  { code: 'BL', name: '病理科' }
];
