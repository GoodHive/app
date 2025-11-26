module.exports = {
  apps: [
    {
      name: 'goodhive-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/home/juhan/goodhive-web',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/juhan/.pm2/logs/goodhive-error.log',
      out_file: '/home/juhan/.pm2/logs/goodhive-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
