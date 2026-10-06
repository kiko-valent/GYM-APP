// Servidor de QA aislado. No carga credenciales ni conecta con Supabase.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
const root = process.cwd();
const demoNotice = { name:'fittrack-demo-notice', transformIndexHtml:() => [
  {tag:'div',attrs:{id:'fittrack-demo-notice',role:'note',style:'position:fixed;top:0;left:0;right:0;z-index:9999;background:#facc15;color:#111827;padding:10px 16px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;font:13px system-ui;text-align:center'},
    children:'<strong>DEMO · DATOS SIMULADOS</strong><span>Esta rutina no es la tuya.</span><a href="http://127.0.0.1:3000/settings" style="color:#111827;text-decoration:underline;font-weight:700">Abrir mi rutina real</a>',injectTo:'body-prepend'},
  {tag:'style',children:'body{padding-top:72px}',injectTo:'head'},
] };
const server = await createServer({ configFile:false, root, cacheDir:path.join(root,'.tmp/vite-demo-cache'), plugins:[react(),demoNotice],
  resolve: { alias:[{ find:'@/lib/customSupabaseClient', replacement:path.join(root,'tests/previewClient.js') }, {find:'@',replacement:path.join(root,'src')}] },
  server: { host:'127.0.0.1',port:3001,strictPort:true } });
await server.listen();
server.printUrls();
