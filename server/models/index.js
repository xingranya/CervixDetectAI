/* eslint-disable @typescript-eslint/no-require-imports */
const { sequelize } = require('../config/sequelize');

// 导入所有模型
const User = require('./User');
const UserAvatar = require('./UserAvatar');
const Patient = require('./Patient');
const Study = require('./Study');
const StudyImage = require('./StudyImage');
const AnalysisTask = require('./AnalysisTask');
const AnalysisResult = require('./AnalysisResult');
const MedicalReport = require('./MedicalReport');
const SmsCode = require('./SmsCode');
const EmailCode = require('./EmailCode');
const Order = require('./Order');

// 定义模型关系

// User 关系
User.hasMany(UserAvatar, { foreignKey: 'user_id', as: 'avatars' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
User.hasMany(Patient, { foreignKey: 'created_by', as: 'created_patients' });
User.hasMany(Study, { foreignKey: 'user_id', as: 'studies' });
User.hasMany(AnalysisTask, { foreignKey: 'user_id', as: 'analysis_tasks' });
User.hasMany(AnalysisResult, { foreignKey: 'reviewed_by', as: 'reviewed_results' });
User.hasMany(MedicalReport, { foreignKey: 'generated_by', as: 'generated_reports' });
User.hasMany(MedicalReport, { foreignKey: 'signed_by', as: 'signed_reports' });

// UserAvatar 关系
UserAvatar.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Patient 关系
Patient.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Patient.hasMany(Study, { foreignKey: 'patient_id', as: 'studies' });
Patient.hasMany(MedicalReport, { foreignKey: 'patient_id', as: 'reports' });

// Study 关系
Study.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Study.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Study.hasMany(StudyImage, { foreignKey: 'study_id', as: 'images' });
Study.hasMany(AnalysisTask, { foreignKey: 'study_id', as: 'analysis_tasks' });
Study.hasMany(AnalysisResult, { foreignKey: 'study_id', as: 'analysis_results' });
Study.hasMany(MedicalReport, { foreignKey: 'study_id', as: 'reports' });

// StudyImage 关系
StudyImage.belongsTo(Study, { foreignKey: 'study_id', as: 'study' });

// AnalysisTask 关系
AnalysisTask.belongsTo(Study, { foreignKey: 'study_id', as: 'study' });
AnalysisTask.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AnalysisTask.hasOne(AnalysisResult, { foreignKey: 'task_id', as: 'result' });

// AnalysisResult 关系
AnalysisResult.belongsTo(AnalysisTask, { foreignKey: 'task_id', as: 'task' });
AnalysisResult.belongsTo(Study, { foreignKey: 'study_id', as: 'study' });
AnalysisResult.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
AnalysisResult.hasMany(MedicalReport, { foreignKey: 'analysis_result_id', as: 'reports' });

// MedicalReport 关系
MedicalReport.belongsTo(Study, { foreignKey: 'study_id', as: 'study' });
MedicalReport.belongsTo(AnalysisResult, {
  foreignKey: 'analysis_result_id',
  as: 'analysis_result',
});
MedicalReport.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
MedicalReport.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });
MedicalReport.belongsTo(User, { foreignKey: 'signed_by', as: 'signer' });

// Order 关系
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 导出所有模型和sequelize实例
module.exports = {
  sequelize,
  User,
  UserAvatar,
  Patient,
  Study,
  StudyImage,
  AnalysisTask,
  AnalysisResult,
  MedicalReport,
  SmsCode,
  EmailCode,
  Order,
};
