import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function uploadImage() {
  try {
    const form = new FormData();
    const imagePath =
      'C:/Users/xingran/.gemini/antigravity/brain/ffac95a5-7411-4d28-b980-33b7266a9ed7/uploaded_image_1766322667102.png';

    if (!fs.existsSync(imagePath)) {
      console.error('Image file not found:', imagePath);
      return;
    }

    form.append('image', fs.createReadStream(imagePath));
    form.append('patientName', 'AutoTest Patient');
    form.append('patientId', 'TEST-AUTO-001');
    form.append('studyDate', new Date().toISOString().split('T')[0]);
    form.append('modality', '细胞学涂片');

    console.log('Uploading image...');
    const response = await axios.post('http://localhost:9000/api/analyze', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log('Upload successful!');
    console.log('Response:', response.data);
    console.log('Study ID:', response.data.studyDbId);
  } catch (error) {
    console.error('Upload failed:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
  }
}

uploadImage();
