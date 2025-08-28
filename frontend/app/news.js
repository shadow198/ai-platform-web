const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';
const QUERY = `query($skip:Int,$take:Int){ news(skip:$skip,take:$take){ items{ id title summary img createdAt } pageInfo{ total hasMore } } }`;
export default async function News({ page=1, take=5 }){
  const skip = (page-1)*take;
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query: QUERY, variables:{ skip, take } }), cache:'no-store' });
  const { data } = await res.json();
  const items = data?.news?.items || [];
  return (
    <ul style={{display:'grid',gap:12,marginTop:8}}>
      {items.map(n=> (
        <li key={n.id} style={{border:'1px solid #eee',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'flex',gap:12}}>
            <img src={n.img} style={{width:160,height:100,objectFit:'cover'}}/>
            <div style={{padding:8}}>
              <div style={{fontWeight:600}}>{n.title}</div>
              <div style={{color:'#666',fontSize:13}}>{n.summary}</div>
              <div style={{color:'#999',fontSize:12}}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
