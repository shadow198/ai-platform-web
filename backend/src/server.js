import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { ApolloServer } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';
import CronManager from './scheduler/cronManager.js';

const prisma = new PrismaClient();
const cronManager = new CronManager(prisma);
const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// CORS whitelist (comma separated)
const allow = (process.env.CORS_ORIGIN || '*').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allow.includes('*') || allow.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));

// JWT from Authorization header
function getUser(req){
  const auth = req.headers.authorization;
  if(!auth) return null;
  const token = auth.replace('Bearer ', '');
  try { return jwt.verify(token, process.env.JWT_SECRET || 'dev_secret'); }
  catch { return null; }
}

// uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
app.use('/uploads', express.static(uploadRoot));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadRoot),
  filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if(!req.file) return res.status(400).json({ error: 'No file' });
  // Local file URL
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ prisma, cronManager, user: getUser(req), jwt, jwtSecret: process.env.JWT_SECRET || 'dev_secret' })
});
await server.start();
server.applyMiddleware({ app, path: '/graphql' });

const port = process.env.PORT || 4000;
app.listen(port, ()=> console.log(`🚀 GraphQL on http://localhost:${port}/graphql`));

// 启动后加载并启动定时任务
cronManager.loadAndStartAll().then(()=>{
  console.log('✅ Scheduler jobs loaded');
}).catch(err=>{
  console.error('Failed to start scheduler jobs', err);
});
