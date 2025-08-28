import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main(){
  const plainPassword = "admin123";
  const password = await bcrypt.hash(plainPassword, 10); // 动态生成哈希值
  console.log('password', password);
  await prisma.user.upsert({ where:{email:"admin@example.com"}, update:{}, create:{ email:"admin@example.com", password, role:"ADMIN"} });
  await prisma.tool.createMany({
    data:[
      { name:"NovaWrite", category:"text-gen", description:"中文长文生成与改写", free:true, lang:"中文,英文", rating:4.6, tags:"写作,SEO,摘要", img:"https://picsum.photos/seed/ai-writer/600/400", site:"#"},
      { name:"PixelForge", category:"image-gen", description:"插画与写实风格可调", free:false, lang:"英文", rating:4.3, tags:"插画,logo,修图", img:"https://picsum.photos/seed/ai-image/600/400", site:"#"},
      { name:"ClipCoder", category:"coding", description:"代码补全与单测生成", free:true, lang:"中文,英文,日文", rating:4.7, tags:"编程,自动化测试,重构", img:"https://picsum.photos/seed/ai-code/600/400", site:"#"},
    ], skipDuplicates:true
  });
  await prisma.news.createMany({
    data:[
      { title:"开源模型 X v2.0 发布", summary:"训练速度提升 30%", content:"详细报道内容……", img:"https://picsum.photos/seed/ai-news1/800/480" },
      { title:"推理成本下降", summary:"企业落地案例激增", content:"详细报道内容……", img:"https://picsum.photos/seed/ai-news2/800/480" },
    ], skipDuplicates:true
  });
  console.log("✅ seed done");
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});
