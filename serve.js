// Petit serveur local pour tester la page : node serve.js, puis http://localhost:8766/
const http=require('http'),fs=require('fs'),p=require('path');
const root=p.join(__dirname,'docs'), port=process.env.PORT||8766;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
http.createServer((req,res)=>{ let f=p.join(root,decodeURIComponent(req.url.split('?')[0].split('#')[0])); if(req.url==='/'||f.endsWith(p.sep)) f=p.join(root,'index.html');
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end('404');return;} res.writeHead(200,{'Content-Type':types[p.extname(f)]||'application/octet-stream','Cache-Control':'no-store'}); res.end(d); }); }).listen(port,()=>console.log('http://localhost:'+port+'/'));
