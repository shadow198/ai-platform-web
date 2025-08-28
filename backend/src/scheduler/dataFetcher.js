import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

/**
 * 数据抓取器 - 支持RSS、JSON API等多种数据源
 */
export class DataFetcher {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * 根据定时任务配置抓取数据
   * @param {Object} scheduler - 定时任务配置
   */
  async fetchData(scheduler) {
    try {
      console.log(`开始抓取数据: ${scheduler.name} - ${scheduler.url}`);
      
      // 更新任务状态为运行中
      await this.updateSchedulerStatus(scheduler.id, 'RUNNING', null);
      
      const response = await axios.get(scheduler.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'AI-Tools-Scheduler/1.0'
        }
      });

      let data;
      switch (scheduler.dataType.toUpperCase()) {
        case 'RSS':
          data = await this.parseRSSData(response.data);
          break;
        case 'JSON':
          data = this.parseJSONData(response.data);
          break;
        case 'API':
          data = this.parseAPIData(response.data);
          break;
        default:
          throw new Error(`不支持的数据类型: ${scheduler.dataType}`);
      }

      // 存储数据到数据库
      await this.storeData(data, scheduler);
      
      // 更新任务状态为成功
      await this.updateSchedulerStatus(scheduler.id, 'SUCCESS', null);
      
      console.log(`数据抓取完成: ${scheduler.name}, 共处理 ${data.length} 条记录`);
      return { success: true, count: data.length };
      
    } catch (error) {
      console.error(`数据抓取失败: ${scheduler.name}`, error.message);
      
      // 更新任务状态为失败
      await this.updateSchedulerStatus(scheduler.id, 'FAILED', error.message);
      
      return { success: false, error: error.message };
    }
  }

  /**
   * 解析RSS数据
   * @param {string} xmlData - RSS XML数据
   */
  async parseRSSData(xmlData) {
    const result = await parseXML(xmlData);
    const items = [];
    
    if (result.rss && result.rss.channel && result.rss.channel[0].item) {
      for (const item of result.rss.channel[0].item) {
        items.push({
          title: item.title ? item.title[0] : '',
          summary: item.description ? item.description[0].replace(/<[^>]*>/g, '').substring(0, 200) : '',
          content: item.description ? item.description[0] : '',
          link: item.link ? item.link[0] : '',
          pubDate: item.pubDate ? new Date(item.pubDate[0]) : new Date()
        });
      }
    }
    
    return items;
  }

  /**
   * 解析JSON数据
   * @param {Object} jsonData - JSON数据
   */
  parseJSONData(jsonData) {
    const items = [];
    
    // 假设JSON数据是一个数组或包含items数组的对象
    const dataArray = Array.isArray(jsonData) ? jsonData : (jsonData.items || jsonData.data || []);
    
    for (const item of dataArray) {
      items.push({
        title: item.title || item.name || '',
        summary: (item.summary || item.description || '').substring(0, 200),
        content: item.content || item.description || '',
        link: item.link || item.url || '',
        pubDate: item.pubDate || item.createdAt || item.date ? new Date(item.pubDate || item.createdAt || item.date) : new Date()
      });
    }
    
    return items;
  }

  /**
   * 解析API数据
   * @param {Object} apiData - API响应数据
   */
  parseAPIData(apiData) {
    // API数据处理逻辑与JSON类似，可以根据具体API格式调整
    return this.parseJSONData(apiData);
  }

  /**
   * 存储数据到数据库
   * @param {Array} items - 要存储的数据项
   * @param {Object} scheduler - 定时任务配置
   */
  async storeData(items, scheduler) {
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const item of items) {
      try {
        // 检查是否已存在相同标题的新闻
        const existingNews = await this.prisma.news.findFirst({
          where: {
            title: item.title
          }
        });
        
        if (existingNews) {
          // 更新现有记录
          await this.prisma.news.update({
            where: { id: existingNews.id },
            data: {
              summary: item.summary,
              content: item.content,
              updatedAt: new Date()
            }
          });
          updatedCount++;
        } else {
          // 创建新记录
          await this.prisma.news.create({
            data: {
              title: item.title,
              summary: item.summary,
              content: item.content,
              img: null // 可以后续扩展图片抓取功能
            }
          });
          createdCount++;
        }
      } catch (error) {
        console.error(`存储数据项失败:`, item.title, error.message);
      }
    }
    
    console.log(`数据存储完成: 新增 ${createdCount} 条，更新 ${updatedCount} 条`);
  }

  /**
   * 更新定时任务状态
   * @param {number} schedulerId - 任务ID
   * @param {string} status - 状态
   * @param {string} errorMessage - 错误信息
   */
  async updateSchedulerStatus(schedulerId, status, errorMessage) {
    const updateData = {
      status,
      lastRun: new Date(),
      updatedAt: new Date()
    };
    
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    } else if (status === 'SUCCESS') {
      updateData.errorMessage = null;
    }
    
    await this.prisma.scheduler.update({
      where: { id: schedulerId },
      data: updateData
    });
  }
}

export default DataFetcher;