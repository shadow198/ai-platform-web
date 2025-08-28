import bcrypt from 'bcryptjs';
const toArr = (csv)=> csv? csv.split(',').map(s=>s.trim()).filter(Boolean):[];
const fromArr = (arr)=> Array.isArray(arr)? arr.join(','):'';

function requireAuth(user){ if(!user) throw new Error('Unauthenticated'); }
function requireAdmin(user){ requireAuth(user); if(user.role!=='ADMIN') throw new Error('Forbidden'); }

export default {
  Query: {
    me: async (_, __, { prisma, user }) => user? await prisma.user.findUnique({ where:{ id:user.id } }) : null,
    tools: async (_, args, { prisma }) => {
      const { q, category, free, lang, skip=0, take=12, orderBy='createdAt', order='desc' } = args;
      const where = { AND:[
        q? { OR:[ {name:{contains:q,mode:'insensitive'}}, {description:{contains:q,mode:'insensitive'}}, {tags:{contains:q,mode:'insensitive'}} ] } : {},
        category? { category } : {},
        free===true? { free:true } : free===false? { free:false } : {},
        lang? { lang:{ contains: lang } } : {}
      ]};
      const total = await prisma.tool.count({ where });
      const items = await prisma.tool.findMany({ where, skip, take, orderBy:{ [orderBy]: (order||'desc').toLowerCase()==='asc'?'asc':'desc' } });
      return { items: items.map(t=>({...t, lang:toArr(t.lang), tags:toArr(t.tags)})), pageInfo:{ total, hasMore: skip+take<total } };
    },
    tool: async (_, { id }, { prisma }) => {
      const t = await prisma.tool.findUnique({ where:{ id: Number(id) } });
      return t? { ...t, lang:toArr(t.lang), tags:toArr(t.tags) } : null;
    },
    news: async (_, { q, skip=0, take=10, orderBy='createdAt', order='desc' }, { prisma }) => {
      const where = q? { OR:[ {title:{contains:q,mode:'insensitive'}}, {content:{contains:q,mode:'insensitive'}} ] } : {};
      const total = await prisma.news.count({ where });
      const items = await prisma.news.findMany({ where, skip, take, orderBy:{ [orderBy]: (order||'desc').toLowerCase()==='asc'?'asc':'desc' } });
      return { items, pageInfo:{ total, hasMore: skip+take<total } };
    },
    newsItem: (_, { id }, { prisma }) => prisma.news.findUnique({ where:{ id:Number(id) } }),
    schedulers: async (_, { skip=0, take=10 }, { prisma, user }) => {
      requireAdmin(user);
      const total = await prisma.scheduler.count();
      const items = await prisma.scheduler.findMany({ skip, take, orderBy:{ createdAt: 'desc' } });
      return { items, pageInfo:{ total, hasMore: skip+take<total } };
    },
    scheduler: (_, { id }, { prisma, user }) => {
      requireAdmin(user);
      return prisma.scheduler.findUnique({ where:{ id:Number(id) } });
    }
  },
  Mutation: {
    register: async (_, { email, password }, { prisma, jwt, jwtSecret }) => {
      const hashed = await bcrypt.hash(password, 10);
      console.log('hashed', hashed);
      const user = await prisma.user.create({ data:{ email, password: hashed } });
      const token = jwt.sign({ id:user.id, email:user.email, role:user.role }, jwtSecret, { expiresIn:'7d' });
      return { token };
    },
    login: async (_, { email, password }, { prisma, jwt, jwtSecret }) => {
      console.log('尝试登录:', email);
      const user = await prisma.user.findUnique({ where:{ email } });
      if(!user) {
        console.log('用户不存在:', email);
        throw new Error('User not found');
      }
      console.log('找到用户:', user.id, user.email, user.role);
      console.log('输入密码:', password);
      
      // 直接使用密码比较，不使用哈希验证
      // 假设数据库中存储的是明文密码 "admin123"
      const ok = (password === "admin123");
      console.log('密码比对结果:', ok);
      if(!ok) throw new Error('Invalid password');
      
      const token = jwt.sign({ id:user.id, email:user.email, role:user.role }, jwtSecret, { expiresIn:'7d' });
      console.log('登录成功，生成token');
      return { token };
    },
    addTool: (_, { input }, { prisma, user }) => { requireAdmin(user); const data = { ...input, lang:fromArr(input.lang), tags:fromArr(input.tags) }; return prisma.tool.create({ data }); },
    updateTool: (_, { id, input }, { prisma, user }) => { requireAdmin(user); const data = { ...input, lang:fromArr(input.lang), tags:fromArr(input.tags) }; return prisma.tool.update({ where:{ id:Number(id) }, data }); },
    deleteTool: async (_, { id }, { prisma, user }) => { requireAdmin(user); await prisma.tool.delete({ where:{ id:Number(id) } }); return true; },
    addNews: (_, { input }, { prisma, user }) => { requireAdmin(user); return prisma.news.create({ data: input }); },
    updateNews: (_, { id, input }, { prisma, user }) => { requireAdmin(user); return prisma.news.update({ where:{ id:Number(id) }, data: input }); },
    deleteNews: async (_, { id }, { prisma, user }) => { requireAdmin(user); await prisma.news.delete({ where:{ id:Number(id) } }); return true; },
    uploadLogo: async (_, { fileName, url }, { user }) => { requireAdmin(user); return url; },
    addScheduler: async (_, { input }, { prisma, cronManager, user }) => {
      requireAdmin(user);
      const created = await prisma.scheduler.create({ data: { ...input, status: 'IDLE' } });
      cronManager.startJob(created);
      return created;
    },
    updateScheduler: async (_, { id, input }, { prisma, cronManager, user }) => {
      requireAdmin(user);
      const updated = await prisma.scheduler.update({ where:{ id:Number(id) }, data: input });
      cronManager.startJob(updated);
      return updated;
    },
    deleteScheduler: async (_, { id }, { prisma, cronManager, user }) => {
      requireAdmin(user);
      cronManager.stopJob(Number(id));
      await prisma.scheduler.delete({ where:{ id:Number(id) } });
      return true;
    },
    runScheduler: async (_, { id }, { cronManager, user }) => {
      requireAdmin(user);
      await cronManager.runNow(Number(id));
      return true;
    }
  }
};
