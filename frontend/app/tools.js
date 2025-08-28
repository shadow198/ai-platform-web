const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';
const QUERY = `query($skip:Int,$take:Int,$orderBy:String,$order:String){ tools(skip:$skip,take:$take,orderBy:$orderBy,order:$order){ items{ id name description img site rating } pageInfo{ total hasMore } } }`;
export default async function Tools({ page=1, take=6 }){
  const skip = (page-1)*take;
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query: QUERY, variables:{ skip, take, orderBy:'createdAt', order:'desc' } }), cache:'no-store' });
  const { data } = await res.json();
  const items = data?.tools?.items || [];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {items.map(t=> (
        <a key={t.id} href={t.site} target="_blank" style={{border:'1px solid #eee',borderRadius:12,overflow:'hidden'}}>
          <img src={t.img} style={{width:'100%',height:120,objectFit:'cover'}}/>
          <div style={{padding:10}}>
            <div style={{fontWeight:600}}>{t.name} <span style={{fontSize:12}}>⭐ {t.rating}</span></div>
            <div style={{fontSize:13,color:'#555'}}>{t.description}</div>
          </div>
        </a>
      ))}
    </div>
  );
}
