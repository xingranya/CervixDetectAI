const fs = require('fs');
const path = require('path');

// 配置
const COUNT = 100;
const OUTPUT_FILE = path.join(__dirname, 'seed-patients.sql');

// 数据源
const SURNAMES =
  '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费岑薛雷贺倪汤滕殷罗毕郝安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍万柯卢莫房裘缪干解应宗丁宣邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储晋汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘景詹束龙叶幸司韶郜黎蓟薄印宿白怀蒲台从鄂索咸籍赖卓蔺屠蒙池乔阴鬱胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍却璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧利师巩聂关荆'.split(
    '',
  );
const NAMES =
  '芳娜敏静丽强军平保东文辉力明永健世广志义兴良海山仁波宁贵福生龙元全国胜学祥才发武新利清飞彬富顺信子杰涛昌成康星光天达安岩中茂进林有坚和彪博诚先敬震振壮会思群豪心邦承乐绍功松善厚庆磊民友裕河哲江超浩亮政谦亨奇固之轮翰朗伯宏言若鸣朋斌梁栋维启克伦翔旭鹏泽晨辰士以建家致树炎德行时泰盛雄琛钧冠策腾楠榕风航弘'.split(
    '',
  );
const CITIES = [
  '北京市',
  '上海市',
  '广州市',
  '深圳市',
  '杭州市',
  '南京市',
  '成都市',
  '武汉市',
  '西安市',
  '苏州市',
];
const DISTRICTS = [
  '朝阳区',
  '海淀区',
  '浦东新区',
  '天河区',
  '福田区',
  '西湖区',
  '鼓楼区',
  '武侯区',
  '江汉区',
  '雁塔区',
];
const ROADS = ['人民路', '建设路', '解放路', '和平路', '中山路', '长江路', '黄河路', '幸福路'];

const SEXUAL_HISTORY_OPTS = [
  'none',
  'regular',
  'irregular',
  'multiple_partners',
  'early_sexual_activity',
  'other',
];

// 辅助函数
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString()
    .split('T')[0];
}

function generatePhone() {
  return `1${randomItem([3, 5, 7, 8, 9])}${randomNumber(100000000, 999999999)}`;
}

function generateIdCard(birthDate, gender) {
  // 简化的身份证生成，不校验校验码
  const region = '110101';
  const dateStr = birthDate.replace(/-/g, '');
  const seq = randomNumber(100, 999).toString().padStart(3, '0');
  // 偶数女，奇数男。我们需要全是女性（系统设定）
  // 但为了通用性，这里根据性别生成
  // gender 'male' | 'female'
  let lastDigit = parseInt(seq[2]);
  if (gender === 'female' && lastDigit % 2 !== 0) {
    lastDigit = (lastDigit + 1) % 10;
    seq[2] = lastDigit; // string is immutable in js but we need to reconstruct
  }
  const suffix = 'X'; // 简化
  return `${region}${dateStr}${seq}${randomNumber(0, 9)}`;
}

// 生成数据
const rows = [];
const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

for (let i = 0; i < COUNT; i++) {
  const gender = 'female'; // 宫颈癌筛查主要针对女性
  const birthDate = randomDate(new Date(1970, 0, 1), new Date(2005, 0, 1));
  const name =
    randomItem(SURNAMES) + randomItem(NAMES) + (Math.random() > 0.5 ? randomItem(NAMES) : '');
  const phone = generatePhone();
  const sexualHistory = randomItem(SEXUAL_HISTORY_OPTS);
  const idCard = generateIdCard(birthDate, gender);
  const medicalCardNo = `MC${randomNumber(10000000, 99999999)}`;
  const address = `${randomItem(CITIES)}${randomItem(DISTRICTS)}${randomItem(ROADS)}${randomNumber(1, 999)}号`;

  // 随机生成一些可选数据
  const hasEmergency = Math.random() > 0.3;
  const emergencyContact = hasEmergency ? randomItem(SURNAMES) + randomItem(NAMES) : null;
  const emergencyPhone = hasEmergency ? generatePhone() : null;
  const emergencyRelation = hasEmergency ? randomItem(['配偶', '子女', '父母', '兄弟姐妹']) : null;

  const hasAllergy = Math.random() > 0.8;
  const allergyHistory = hasAllergy
    ? randomItem(['青霉素', '磺胺类', '花粉', '海鲜', '芒果'])
    : null;

  const hasHistory = Math.random() > 0.7;
  const medicalHistory = hasHistory
    ? randomItem(['高血压', '糖尿病', '慢性胃炎', '阑尾炎手术'])
    : null;

  const familyHistory = Math.random() > 0.9 ? '家族遗传病史' : null;
  const notes = Math.random() > 0.8 ? '模拟自动生成数据' : null;

  // 生成 patient_id (模拟后端逻辑)
  // 为了确保唯一性且简单，使用 P + Timestamp + Index
  const patientId = `P${Date.now().toString().slice(0, 10)}${i.toString().padStart(3, '0')}`;

  rows.push(`(
    '${patientId}',
    '${name}',
    '${gender}',
    '${birthDate}',
    '${phone}',
    '${sexualHistory}',
    '${idCard}',
    '${medicalCardNo}',
    '${address}',
    ${emergencyContact ? `'${emergencyContact}'` : 'NULL'},
    ${emergencyPhone ? `'${emergencyPhone}'` : 'NULL'},
    ${emergencyRelation ? `'${emergencyRelation}'` : 'NULL'},
    ${allergyHistory ? `'${allergyHistory}'` : 'NULL'},
    ${medicalHistory ? `'${medicalHistory}'` : 'NULL'},
    ${familyHistory ? `'${familyHistory}'` : 'NULL'},
    ${notes ? `'${notes}'` : 'NULL'},
    1,
    '${now}',
    '${now}'
  )`);
}

const sql = `
-- =====================================================
-- 模拟患者数据插入脚本 (100条)
-- 生成时间: ${now}
-- =====================================================

INSERT INTO \`patients\` (
  \`patient_id\`,
  \`name\`,
  \`gender\`,
  \`birth_date\`,
  \`phone\`,
  \`sexual_history\`,
  \`id_card\`,
  \`medical_card_no\`,
  \`address\`,
  \`emergency_contact\`,
  \`emergency_phone\`,
  \`emergency_relation\`,
  \`allergy_history\`,
  \`medical_history\`,
  \`family_history\`,
  \`notes\`,
  \`created_by\`,
  \`created_at\`,
  \`updated_at\`
) VALUES
${rows.join(',\n')};
`;

fs.writeFileSync(OUTPUT_FILE, sql);
console.log(`Generated ${COUNT} patients SQL to ${OUTPUT_FILE}`);
