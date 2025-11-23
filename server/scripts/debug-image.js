/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
// 尝试加载根目录的 .env 文件
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');
const models = require('../models');
const { Study, StudyImage, sequelize } = models;

async function checkLatestImage() {
  try {
    const study = await Study.findOne({
      order: [['created_at', 'DESC']],
      include: [{ model: StudyImage, as: 'images' }],
    });

    if (!study) {
      console.log('❌ No studies found.');
      return;
    }

    console.log(`📝 Latest Study ID: ${study.id} (${study.study_id})`);
    console.log(`👤 Patient ID: ${study.patient_id}`);

    if (study.images && study.images.length > 0) {
      const img = study.images[0];
      console.log(`🖼️ Image ID: ${img.id}`);
      console.log(`📂 Stored Filename: ${img.stored_filename}`);
      console.log(`📍 File Path (DB): ${img.file_path}`);

      // Construct absolute path based on server/index.js logic
      const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
      const absolutePath = path.join(uploadDir, img.stored_filename);

      console.log(`🔎 Checking file at: ${absolutePath}`);
      if (fs.existsSync(absolutePath)) {
        console.log('✅ File exists on disk.');
      } else {
        console.log('❌ File NOT found on disk!');
      }
    } else {
      console.log('❌ No images found for this study.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkLatestImage();
