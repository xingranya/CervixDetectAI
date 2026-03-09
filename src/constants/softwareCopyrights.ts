export interface SoftwareCopyrightItem {
  id: string;
  name: string;
  version: string;
  registrationNo: string;
  certificateNo: string;
  imageUrl?: string;
}

const parseRegistrationNo = (registrationNo: string): number => {
  const numericPart = registrationNo.replace(/\D/g, '');
  return Number.parseInt(numericPart, 10) || 0;
};

export const SOFTWARE_COPYRIGHTS: SoftwareCopyrightItem[] = [
  {
    id: 'cervix-intelligent-reading-grading-v1',
    name: '宫颈智能阅片与分级管理系统',
    version: 'V1.0.0',
    registrationNo: '2026SR0224083',
    certificateNo: '软著登字第17438364号',
    imageUrl: 'https://img1.tucang.cc/api/image/show/891726e07f8df56776b90b11f4fe801c',
  },
  {
    id: 'primary-cervical-screening-cloud-platform-v1',
    name: '基层宫颈癌筛查云服务平台',
    version: 'V1.0.0',
    registrationNo: '2026SR0218929',
    certificateNo: '软著登字第17433210号',
    imageUrl: 'https://img1.tucang.cc/api/image/show/0fa3bb9507fbe9c7cfc73dbeebdd0968',
  },
  {
    id: 'cervix-navigation-ai-screening-v1',
    name: '宫颈护航智能辅助筛查系统',
    version: 'V1.0.0',
    registrationNo: '2026SR0207339',
    certificateNo: '软著登字第17421620号',
    imageUrl: 'https://img1.tucang.cc/api/image/show/a8e0b88a3384cb87a11db07a0a96d2f2',
  },
];

export const SORTED_SOFTWARE_COPYRIGHTS: SoftwareCopyrightItem[] = [...SOFTWARE_COPYRIGHTS].sort(
  (a, b) => parseRegistrationNo(b.registrationNo) - parseRegistrationNo(a.registrationNo),
);
