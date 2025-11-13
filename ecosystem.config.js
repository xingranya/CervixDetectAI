// PM2 配置文件 - 用于生产环境进程管理
module.exports = {
  apps: [
    {
      name: 'cervix-detect-api',
      cwd: './server',
      script: './index.js',
      instances: 'max', // 使用所有CPU核心
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};
