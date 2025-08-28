'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Login(){
  const [email,setEmail]=useState('admin@example.com');
  const [password,setPassword]=useState('admin123');
  const [error,setError]=useState('');
  const router = useRouter();
  async function submit(e){
    e.preventDefault();
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ query: 'mutation($e:String!,$p:String!){ login(email:$e,password:$p){ token } }', variables:{ e:email, p:password } })
    });
    const { data, errors } = await res.json();
    if(errors){ setError(errors[0]?.message || '登录失败'); return; }
    localStorage.setItem('token', data.login.token);
    router.push('/admin');
  }
  return (
    <main style={{maxWidth:360,margin:'80px auto',padding:20,border:'1px solid #eee',borderRadius:12}}>
      <h1>登录</h1>
      <form onSubmit={submit} style={{display:'grid',gap:8,marginTop:12}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="密码" />
        <button type="submit">登录</button>
        {error && <div style={{color:'red'}}>{error}</div>}
      </form>
    </main>
  );
}
