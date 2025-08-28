'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

export default function Admin(){
  const router = useRouter();
  const [tools, setTools] = useState([]);
  const [news, setNews] = useState([]);
  const [schedulers, setSchedulers] = useState([]);
  const [schedulerForm, setSchedulerForm] = useState({ name:'', url:'', cronExpression:'0 */6 * * *', isActive:true, dataType:'RSS' });
  const [form, setForm] = useState({ name:'', category:'text-gen', description:'', site:'#', img:'', free:true, lang:'中文,英文', rating:4.5, tags:'示例' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(()=>{
    if(!token){ router.push('/login'); return; }
    const headers = { 'Content-Type':'application/json' };
    if (token) headers['Authorization'] = 'Bearer '+token;
    fetch(API, { method:'POST', headers, body: JSON.stringify({ query: '{ tools{ items{ id name category } pageInfo{ total } } news{ items{ id title } pageInfo{ total } } schedulers{ items{ id name url cronExpression isActive dataType status lastRun } pageInfo{ total } } }' }), })
      .then(r=>r.json())
      .then((res)=>{
        const d = res && res.data ? res.data : {};
        setTools(d.tools?.items || []);
        setNews(d.news?.items || []);
        setSchedulers(d.schedulers?.items || []);
      })
      .catch(()=>{});
  },[]);

  async function addTool(){
    const input = { ...form, lang: form.lang.split(',').map(s=>s.trim()), tags: form.tags.split(',').map(s=>s.trim()) };
    const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ query: 'mutation($i:ToolInput!){ addTool(input:$i){ id name } }', variables:{ i: input } }) });
    const { data, errors } = await res.json();
    if(errors){ alert(errors[0].message); return; }
    setTools(prev=>[...prev, data.addTool]);
  }

  async function delTool(id){
    const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ query: 'mutation($id:ID!){ deleteTool(id:$id) }', variables:{ id } }) });
    const { errors } = await res.json();
    if(errors){ alert(errors[0].message); return; }
    setTools(prev=>prev.filter(t=>t.id!==id));
  }

  async function addScheduler(){
    const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ query: 'mutation($i:SchedulerInput!){ addScheduler(input:$i){ id name url cronExpression isActive dataType status } }', variables:{ i: schedulerForm } }) });
    const { data, errors } = await res.json();
    if(errors){ alert(errors[0].message); return; }
    setSchedulers(prev=>[data.addScheduler, ...prev]);
  }

  async function toggleSchedulerActive(s){
    const input = { name:s.name, url:s.url, cronExpression:s.cronExpression, isActive:!s.isActive, dataType:s.dataType };
    const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ query: 'mutation($id:ID!,$i:SchedulerInput!){ updateScheduler(id:$id,input:$i){ id isActive status } }', variables:{ id: s.id, i: input } }) });
    const { data, errors } = await res.json();
    if(errors){ alert(errors[0].message); return; }
    setSchedulers(prev=>prev.map(x=>x.id===s.id? { ...x, ...data.updateScheduler } : x));
  }

  async function runScheduler(id){
    const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ query: 'mutation($id:ID!){ runScheduler(id:$id) }', variables:{ id } }) });
    const { errors } = await res.json();
    if(errors){ alert(errors[0].message); return; }
    alert('任务已触发');
  }

  async function deleteScheduler(id){
    const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ query: 'mutation($id:ID!){ deleteScheduler(id:$id) }', variables:{ id } }) });
    const { errors } = await res.json();
    if(errors){ alert(errors[0].message); return; }
    setSchedulers(prev=>prev.filter(s=>s.id!==id));
  }

  return (
    <main style={{maxWidth:980,margin:'0 auto',padding:24}}>
      <h1>后台管理</h1>
      <button onClick={()=>{localStorage.removeItem('token');router.push('/')}}>退出登录</button>

      <section style={{marginTop:16}}>
        <h2>新增工具</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          <input placeholder="名称" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input placeholder="分类" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}/>
          <input placeholder="官网" value={form.site} onChange={e=>setForm(f=>({...f,site:e.target.value}))}/>
          <input placeholder="封面图" value={form.img} onChange={e=>setForm(f=>({...f,img:e.target.value}))}/>
          <input placeholder="语言 CSV" value={form.lang} onChange={e=>setForm(f=>({...f,lang:e.target.value}))}/>
          <input placeholder="标签 CSV" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/>
          <input placeholder="评分" value={form.rating} onChange={e=>setForm(f=>({...f,rating:parseFloat(e.target.value)||0}))}/>
          <label><input type="checkbox" checked={form.free} onChange={e=>setForm(f=>({...f,free:e.target.checked}))}/> 免费</label>
          <textarea placeholder="描述" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>
        <button onClick={addTool} style={{marginTop:8}}>提交</button>
      </section>

      <section style={{marginTop:24}}>
        <h2>工具列表</h2>
        <ul>
          {tools.map(t=>(
            <li key={t.id} style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid #eee',padding:'6px 0'}}>
              <span>{t.name}（{t.category}）</span>
              <button onClick={()=>delTool(t.id)}>删除</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{marginTop:24}}>
        <h2>定时任务</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          <input placeholder="任务名" value={schedulerForm.name} onChange={e=>setSchedulerForm(f=>({...f,name:e.target.value}))}/>
          <input placeholder="抓取URL" value={schedulerForm.url} onChange={e=>setSchedulerForm(f=>({...f,url:e.target.value}))}/>
          <input placeholder="cron表达式" value={schedulerForm.cronExpression} onChange={e=>setSchedulerForm(f=>({...f,cronExpression:e.target.value}))}/>
          <select value={schedulerForm.dataType} onChange={e=>setSchedulerForm(f=>({...f,dataType:e.target.value}))}>
            <option value="RSS">RSS</option>
            <option value="JSON">JSON</option>
            <option value="API">API</option>
          </select>
          <label><input type="checkbox" checked={schedulerForm.isActive} onChange={e=>setSchedulerForm(f=>({...f,isActive:e.target.checked}))}/> 启用</label>
        </div>
        <button onClick={addScheduler} style={{marginTop:8}}>新增定时任务</button>
        <ul style={{marginTop:12}}>
          {schedulers.map(s=>(
            <li key={s.id} style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr auto',gap:8,alignItems:'center',borderBottom:'1px solid #eee',padding:'6px 0'}}>
              <span>{s.name}</span>
              <span style={{fontSize:12,color:'#666'}}>{s.url}</span>
              <span>{s.cronExpression}</span>
              <span>{s.status||'IDLE'}{s.lastRun?` / 上次: ${new Date(s.lastRun).toLocaleString()}`:''}</span>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>toggleSchedulerActive(s)}>{s.isActive?'停用':'启用'}</button>
                <button onClick={()=>runScheduler(s.id)}>立即运行</button>
                <button onClick={()=>deleteScheduler(s.id)}>删除</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
