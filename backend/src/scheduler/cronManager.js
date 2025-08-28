import cron from 'node-cron';
import DataFetcher from './dataFetcher.js';

export class CronManager {
  constructor(prisma) {
    this.prisma = prisma;
    this.jobs = new Map();
    this.dataFetcher = new DataFetcher(prisma);
  }

  async loadAndStartAll() {
    const activeSchedulers = await this.prisma.scheduler.findMany({ where: { isActive: true } });
    for (const s of activeSchedulers) {
      this.startJob(s);
    }
  }

  startJob(scheduler) {
    this.stopJob(scheduler.id);
    try {
      if (!scheduler.isActive) return;
      const task = cron.schedule(scheduler.cronExpression, async () => {
        await this.dataFetcher.fetchData(scheduler);
      }, { scheduled: true });
      this.jobs.set(scheduler.id, task);
    } catch (err) {
      // 保存错误信息
      this.prisma.scheduler.update({ where: { id: scheduler.id }, data: { status: 'FAILED', errorMessage: err.message } }).catch(()=>{});
    }
  }

  stopJob(id) {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
    }
  }

  async runNow(id) {
    const scheduler = await this.prisma.scheduler.findUnique({ where: { id: Number(id) } });
    if (!scheduler) throw new Error('Scheduler not found');
    return this.dataFetcher.fetchData(scheduler);
  }
}

export default CronManager;


