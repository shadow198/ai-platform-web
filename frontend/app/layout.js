export const metadata = { title:'AI Tools Hub', description:'AI 工具导航 + 新闻' };
export default function RootLayout({ children }){
  return (<html lang="zh-CN"><body style={{fontFamily:'ui-sans-serif,system-ui', margin:0}}>{children}</body></html>);
}
