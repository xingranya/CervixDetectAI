/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const dotenv = require('dotenv');

// 固定读取 server/.env，避免因启动目录不同导致配置不一致
dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

