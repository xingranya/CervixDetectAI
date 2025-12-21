module.exports = {
  apps: [
    {
      name: 'cervix-detect-ai-backend',
      script: 'index.js',
      instances: 1, // 或者 'max' 利用多核，但需注意数据库连接池
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
    },
  ],
};
