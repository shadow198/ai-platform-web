import Tools from "./tools";
import News from "./news";
import Link from "next/link";
export default function Page(){
  return (
    <main style={{maxWidth:980,margin:'0 auto',padding:24}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>AI Tools Hub</h1>
        <nav style={{display:'flex',gap:12}}>
          <Link href="/login">登录</Link>
          <Link href="/admin">后台</Link>
        </nav>
      </header>
      <section style={{marginTop:16}}>
        <h2>工具</h2>
        {/* @ts-expect-error Async Server Component */}
        <Tools />
      </section>
      <section style={{marginTop:16}}>
        <h2>新闻</h2>
        {/* @ts-expect-error Async Server Component */}
        <News />
      </section>
    </main>
  );
}
