import cron from 'node-cron';
import { cleanupExpiredDevices, logAccess } from './database.js';

/**
 * Scheduler for automatic tasks
 * - Cleanup expired devices every hour
 * - Generate daily reports
 */

export function initScheduler() {
  console.log('📅 Initializing task scheduler...');

  // Cleanup expired devices every hour
  const cleanupJob = cron.schedule('0 * * * *', () => {
    console.log('⏰ Running scheduled cleanup...');
    const cleaned = cleanupExpiredDevices();
    if (cleaned > 0) {
      logAccess('SYSTEM', 'AUTO_CLEANUP', `Cleaned ${cleaned} expired devices`);
    }
  });

  // Daily summary at midnight
  const dailyJob = cron.schedule('0 0 * * *', () => {
    console.log('📊 Generating daily summary...');
    // Could send email/SMS summary to admin here
  });

  cleanupJob.start();
  dailyJob.start();

  console.log('✅ Scheduler started');

  return { cleanupJob, dailyJob };
}
