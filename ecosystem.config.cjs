// PM2 Production Configuration for Hostinger VPS (novesta.online)
// Start:   pm2 start ecosystem.config.cjs
// Reload:  pm2 reload ecosystem.config.cjs
// Logs:    pm2 logs novesta-app
// Persist: pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'novesta-app',
      // Uses native Node 22.18+ TypeScript execution (matches `npm start`).
      // If your Hostinger VPS runs Node 20 LTS, change `script` to `./node_modules/.bin/tsx`
      // and set `args: 'server.ts'`.
      script: 'server.ts',
      interpreter: 'node',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
