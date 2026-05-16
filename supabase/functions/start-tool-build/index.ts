import { createClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding/base64';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const gh = (path: string, opts: RequestInit = {}) =>
  fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...((opts as any).headers ?? {}),
    },
  });

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().slice(0, 40);
}

// ── Build scripts (inline, same as original documentation) ──────

function makeWorkflow() {
  return `name: Build React to HTML
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - name: Setup project
        run: bash setup.sh
      - name: Install deps
        timeout-minutes: 5
        run: bun install
      - name: Apply mock (post-install)
        run: node setup-base44-mock.cjs
      - name: Build
        timeout-minutes: 5
        run: CI=false NODE_ENV=production bun run build
      - name: Inject form interceptor
        run: node setup-form-interceptor.cjs
      - name: Verify dist
        run: test -f dist/index.html || (echo "Build failed: no index.html" && exit 1)
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 3
`;
}

function makeSetupSh() {
  return `#!/bin/bash
set -e
echo "=== Detecting project type ==="
if [ -f project.zip ]; then
  if file -b project.zip | grep -q "Zip archive" || xxd -l 4 project.zip | grep -q "504b 0304"; then
    echo "Real ZIP detected"
    unzip -q project.zip -d extracted/ || true
    if find extracted/ -name "package.json" -maxdepth 3 | head -1 | grep -q "package.json"; then
      PKG_DIR=$(dirname $(find extracted/ -name "package.json" -maxdepth 3 | head -1))
      cp -r "$PKG_DIR/." .
      echo "Full project extracted"
    else
      JSX=$(find extracted/ -name "*.jsx" -o -name "*.tsx" | head -1)
      if [ -n "$JSX" ]; then
        mkdir -p src && cp "$JSX" src/App.jsx
        echo "JSX extracted from ZIP"
      fi
    fi
  else
    echo "Text file treated as JSX"
    mkdir -p src && cp project.zip src/App.jsx
  fi
fi
node setup-pkg.cjs
node setup-files.cjs
node setup-shadcn.cjs
node setup-stubs.cjs
node setup-patch-vite.cjs
node setup-base44-mock.cjs
node setup-env.cjs
`;
}

function makeSetupPkg() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
// Scan all source files for dependency detection
let src = '';
function scanDir(dir) {
  try {
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      try {
        if (fs.statSync(fp).isDirectory()) {
          if (!['node_modules','.git','dist','build','.next'].includes(f)) scanDir(fp);
        } else if (/\\.(jsx?|tsx?)$/.test(f)) {
          src += '\\n' + fs.readFileSync(fp, 'utf8');
        }
      } catch {}
    });
  } catch {}
}
scanDir('src');
scanDir('app');
scanDir('pages');
const deps = {
  'react': '^18.3.1',
  'react-dom': '^18.3.1',
};
const devDeps = {
  '@vitejs/plugin-react': '^4.3.4',
  'vite': '^5.4.21',
};
if (src.includes('react-router')) deps['react-router-dom'] = '^6.28.0';
if (src.includes('lucide-react')) deps['lucide-react'] = '^0.468.0';
if (src.includes('framer-motion')) deps['framer-motion'] = '^11.11.0';
if (src.includes('recharts')) deps['recharts'] = '^2.13.0';
if (src.includes('@tanstack/react-query')) deps['@tanstack/react-query'] = '^5.62.0';
if (src.includes('react-hook-form')) deps['react-hook-form'] = '^7.54.0';
if (src.includes('zod')) deps['zod'] = '^3.23.8';
if (src.includes('zustand')) deps['zustand'] = '^5.0.2';
if (src.includes('sonner')) deps['sonner'] = '^1.7.0';
if (src.includes('date-fns')) deps['date-fns'] = '^4.1.0';
if (src.includes('clsx')) deps['clsx'] = '^2.1.1';
if (src.includes('tailwind-merge')) deps['tailwind-merge'] = '^2.5.4';
const usesTailwind = src.includes('className=') || src.includes('@/') || src.includes('tailwind');
// Selective Radix: only install packages actually imported in source
const allRadix = ['accordion','alert-dialog','aspect-ratio','avatar','checkbox','collapsible','context-menu','dialog','dropdown-menu','hover-card','label','menubar','navigation-menu','popover','progress','radio-group','scroll-area','select','separator','slider','slot','switch','tabs','toast','toggle','toggle-group','tooltip'];
let radixInstalled = 0;
allRadix.forEach(p => {
  if (src.includes(\`@radix-ui/react-\${p}\`)) {
    deps[\`@radix-ui/react-\${p}\`] = '^1.0.0';
    radixInstalled++;
  }
});
// If no direct @radix-ui imports but uses shadcn/ui aliases, install common subset
if (radixInstalled === 0 && src.includes('@/components/ui')) {
  ['dialog','dropdown-menu','label','select','separator','tabs','toast','tooltip','slot','popover','avatar','checkbox','progress'].forEach(p => {
    deps[\`@radix-ui/react-\${p}\`] = '^1.0.0';
  });
}
if (usesTailwind) {
  deps['class-variance-authority'] = '^0.7.0';
  devDeps['tailwindcss'] = '^3.4.17';
  devDeps['postcss'] = '^8.5.1';
  devDeps['autoprefixer'] = '^10.4.20';
  devDeps['tailwindcss-animate'] = '^1.0.7';
}
const pkg = { name:'react-to-html-build', version:'1.0.0', private:true, type:'module', scripts:{ build:'vite build', dev:'vite' }, dependencies:deps, devDependencies:devDeps };
if (!fs.existsSync('package.json')) {
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  console.log('Generated package.json with', Object.keys(deps).length, 'deps');
} else {
  console.log('package.json exists, merging deps');
  const existing = JSON.parse(fs.readFileSync('package.json','utf8'));
  existing.dependencies = { ...pkg.dependencies, ...(existing.dependencies||{}) };
  existing.devDependencies = { ...pkg.devDependencies, ...(existing.devDependencies||{}) };
  fs.writeFileSync('package.json', JSON.stringify(existing, null, 2));
}
`;
}

function makeSetupFiles() {
  return `#!/usr/bin/env node
const fs = require('fs');
const src = fs.existsSync('src/App.jsx') ? fs.readFileSync('src/App.jsx','utf8') : '';
const usesTailwind = src.includes('className=') || src.includes('@/') || src.includes('tailwind');
const usesAlias = src.includes('@/');
// vite.config.js
if (!fs.existsSync('vite.config.js')) {
  const alias = usesAlias ? "import path from 'path';\\n" : '';
  const aliasConfig = usesAlias ? "\\n    resolve: { alias: { '@': path.resolve(__dirname, './src') } }," : '';
  fs.writeFileSync('vite.config.js', \`\${alias}import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()],\${aliasConfig}
  resolve: { extensions: ['.mjs','.js','.jsx','.ts','.tsx','.json'] }
});\`);
}
// index.html
if (!fs.existsSync('index.html')) {
  fs.writeFileSync('index.html', \`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>\`);
}
// tailwind
if (usesTailwind) {
  if (!fs.existsSync('tailwind.config.js')) fs.writeFileSync('tailwind.config.js', "/** @type {import('tailwindcss').Config} */\\nexport default { content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [require('tailwindcss-animate')] };");
  if (!fs.existsSync('postcss.config.js')) fs.writeFileSync('postcss.config.js', "export default { plugins: { tailwindcss: {}, autoprefixer: {} } };");
}
// src/index.css
if (!fs.existsSync('src/index.css')) {
  const tw = usesTailwind ? '@tailwind base;\\n@tailwind components;\\n@tailwind utilities;\\n' : '* { box-sizing: border-box; margin: 0; padding: 0; }\\n';
  fs.writeFileSync('src/index.css', tw);
}
// src/main.jsx
if (!fs.existsSync('src/main.jsx')) {
  fs.writeFileSync('src/main.jsx', "import React from 'react';\\nimport ReactDOM from 'react-dom/client';\\nimport './index.css';\\nimport App from './App.jsx';\\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);");
}
// src/lib/utils.js
fs.mkdirSync('src/lib', { recursive: true });
if (!fs.existsSync('src/lib/utils.js')) {
  fs.writeFileSync('src/lib/utils.js', "import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge'; export function cn(...inputs) { return twMerge(clsx(inputs)); }");
}
console.log('Files generated');
`;
}

function makeSetupBase44Mock(appId: string) {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
// Remove @base44/sdk from package.json
try {
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
  delete (pkg.dependencies||{})['@base44/sdk'];
  fs.writeFileSync('package.json', JSON.stringify(pkg,null,2));
} catch {}
// Create mock client
const mock = \`
const _store = {};
const entity = (name) => ({
  create: (d) => { const r = {id:Math.random().toString(36).slice(2),...d}; window.dispatchEvent(new CustomEvent('base44:entity:create',{detail:{entity:name,data:r}})); return Promise.resolve(r); },
  list: () => Promise.resolve([]),
  filter: () => Promise.resolve([]),
  get: () => Promise.resolve(null),
  update: (id,d) => Promise.resolve({id,...d}),
  delete: () => Promise.resolve({success:true}),
});
const handler = { get:(_,n)=>entity(n) };
export const base44 = {
  entities: new Proxy({},handler),
  auth: { me:()=>Promise.resolve(null), isAuthenticated:()=>false, login:()=>Promise.resolve(null), logout:()=>Promise.resolve() },
  integrations: { Core: { InvokeLLM:()=>Promise.resolve({result:''}), SendEmail:()=>Promise.resolve(), UploadFile:()=>Promise.resolve({url:''}), GoogleDriveUpload:()=>Promise.resolve() } },
  functions: { invoke:()=>Promise.resolve({data:{}}) },
  analytics: { track:()=>{} },
};
export default base44;
\`;
fs.mkdirSync('src/api', { recursive: true });
fs.writeFileSync('src/api/base44Client.js', mock);
// AuthContext mock
const authMock = \`
import React, { createContext, useContext, useState } from 'react';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user] = useState(null);
  return <AuthContext.Provider value={{user,isAuthenticated:false}}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext) || {user:null,isAuthenticated:false}; }
export default AuthContext;
\`;
['src/lib','src/context'].forEach(d => {
  fs.mkdirSync(d, {recursive:true});
  ['AuthContext.jsx','AuthContext.tsx','AuthContext.js'].forEach(f => {
    const p = path.join(d,f);
    if (fs.existsSync(p)) { fs.writeFileSync(p, authMock); console.log('Replaced',p); }
  });
});
// node_modules/@base44/sdk mock
fs.mkdirSync('node_modules/@base44/sdk', {recursive:true});
fs.writeFileSync('node_modules/@base44/sdk/index.js', 'module.exports = {};');
fs.writeFileSync('node_modules/@base44/sdk/package.json', JSON.stringify({name:'@base44/sdk',version:'0.0.0',main:'index.js',exports:{'.':{require:'./index.js',import:'./index.js'},'./\*':'./'}}));
// vite.config alias
try {
  let cfg = fs.readFileSync('vite.config.js','utf8');
  if (!cfg.includes('@base44/sdk')) {
    cfg = cfg.replace('plugins: [react()]', "plugins: [react()],\\n  resolve: { alias: [{ find: /^@base44\\\\/sdk(\\\\/.*)?$/, replacement: path.resolve(__dirname,'src/api/base44Client.js') }] }");
    fs.writeFileSync('vite.config.js', cfg);
  }
} catch {}
console.log('Base44 mock installed');
`;
}

function makeSetupEnv(appId: string, webhookUrl: string) {
  return `#!/usr/bin/env node
const fs = require('fs');
const appId = '${appId || 'mock-app-id'}';
const webhookUrl = '${webhookUrl || ''}';
fs.writeFileSync('.env', \`VITE_BASE44_APP_ID=\${appId}\\nVITE_APP_ID=\${appId}\\n\`);
fs.writeFileSync('.env.production', \`VITE_BASE44_APP_ID=\${appId}\\nVITE_APP_ID=\${appId}\\n\`);
if (webhookUrl) fs.writeFileSync('.form-webhook-url', webhookUrl);
console.log('.env created');
`;
}

function makeSetupFormInterceptor() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let webhookUrl = '';
try { webhookUrl = fs.readFileSync('.form-webhook-url','utf8').trim(); } catch {}
const script = \`<script>
(function(){
  var WEBHOOK_URL='\${webhookUrl}'||window.FORM_WEBHOOK_URL||'';
  function send(data){ if(!WEBHOOK_URL)return; fetch(WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{}); }
  window.addEventListener('base44:entity:create',function(e){ send({_source:location.href,_timestamp:new Date().toISOString(),_entity:e.detail&&e.detail.entity,_type:'base44_entity_create',data:e.detail&&e.detail.data}); });
  document.addEventListener('submit',function(e){
    var f=e.target; if(f.method&&f.method.toLowerCase()!=='post')return;
    e.preventDefault();
    var d=Object.fromEntries(new FormData(f).entries());
    send({_source:location.href,_timestamp:new Date().toISOString(),_type:'form_submit',data:d});
  },true);
})();
</script>\`;
const htmlPath = path.join('dist','index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath,'utf8');
  html = html.replace('</body>', script+'</body>');
  fs.writeFileSync(htmlPath, html);
  console.log('Form interceptor injected');
}
`;
}

function makeSetupShadcn() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const src = fs.existsSync('src/App.jsx') ? fs.readFileSync('src/App.jsx','utf8') : '';
const uiDir = 'src/components/ui';
fs.mkdirSync(uiDir, {recursive:true});
const comps = {
  button: "import * as React from 'react'; import { cn } from '@/lib/utils'; const Button = React.forwardRef(({className,variant='default',size='default',...props},ref)=>(<button ref={ref} className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',className)} {...props}/>)); Button.displayName='Button'; export { Button };",
  card: "import * as React from 'react'; import { cn } from '@/lib/utils'; const Card = React.forwardRef(({className,...p},r)=><div ref={r} className={cn('rounded-lg border bg-card text-card-foreground shadow-sm',className)} {...p}/>); Card.displayName='Card'; const CardHeader = React.forwardRef(({className,...p},r)=><div ref={r} className={cn('flex flex-col space-y-1.5 p-6',className)} {...p}/>); CardHeader.displayName='CardHeader'; const CardTitle = React.forwardRef(({className,...p},r)=><h3 ref={r} className={cn('text-2xl font-semibold',className)} {...p}/>); CardTitle.displayName='CardTitle'; const CardContent = React.forwardRef(({className,...p},r)=><div ref={r} className={cn('p-6 pt-0',className)} {...p}/>); CardContent.displayName='CardContent'; export { Card, CardHeader, CardTitle, CardContent };",
  input: "import * as React from 'react'; import { cn } from '@/lib/utils'; const Input = React.forwardRef(({className,type,...p},r)=><input type={type} ref={r} className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',className)} {...p}/>); Input.displayName='Input'; export { Input };",
  label: "import * as React from 'react'; import { cn } from '@/lib/utils'; const Label = React.forwardRef(({className,...p},r)=><label ref={r} className={cn('text-sm font-medium leading-none',className)} {...p}/>); Label.displayName='Label'; export { Label };",
  badge: "import * as React from 'react'; import { cn } from '@/lib/utils'; function Badge({className,...p}){ return <div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',className)} {...p}/>; } export { Badge };",
  dialog: "import * as React from 'react'; import * as DialogPrimitive from '@radix-ui/react-dialog'; import { cn } from '@/lib/utils'; const Dialog=DialogPrimitive.Root; const DialogTrigger=DialogPrimitive.Trigger; const DialogPortal=DialogPrimitive.Portal; const DialogOverlay=React.forwardRef(({className,...p},r)=><DialogPrimitive.Overlay ref={r} className={cn('fixed inset-0 z-50 bg-black/80',className)} {...p}/>); DialogOverlay.displayName=DialogPrimitive.Overlay.displayName; const DialogContent=React.forwardRef(({className,children,...p},r)=><DialogPortal><DialogOverlay/><DialogPrimitive.Content ref={r} className={cn('fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg rounded-lg w-full max-w-lg',className)} {...p}>{children}</DialogPrimitive.Content></DialogPortal>); DialogContent.displayName=DialogPrimitive.Content.displayName; const DialogTitle=React.forwardRef(({className,...p},r)=><DialogPrimitive.Title ref={r} className={cn('text-lg font-semibold',className)} {...p}/>); DialogTitle.displayName=DialogPrimitive.Title.displayName; export { Dialog, DialogTrigger, DialogContent, DialogTitle };",
  tabs: "import * as React from 'react'; import * as TabsPrimitive from '@radix-ui/react-tabs'; import { cn } from '@/lib/utils'; const Tabs=TabsPrimitive.Root; const TabsList=React.forwardRef(({className,...p},r)=><TabsPrimitive.List ref={r} className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1',className)} {...p}/>); TabsList.displayName=TabsPrimitive.List.displayName; const TabsTrigger=React.forwardRef(({className,...p},r)=><TabsPrimitive.Trigger ref={r} className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',className)} {...p}/>); TabsTrigger.displayName=TabsPrimitive.Trigger.displayName; const TabsContent=React.forwardRef(({className,...p},r)=><TabsPrimitive.Content ref={r} className={cn('mt-2',className)} {...p}/>); TabsContent.displayName=TabsPrimitive.Content.displayName; export { Tabs, TabsList, TabsTrigger, TabsContent };",
  separator: "import * as React from 'react'; import * as SeparatorPrimitive from '@radix-ui/react-separator'; import { cn } from '@/lib/utils'; const Separator=React.forwardRef(({className,orientation='horizontal',...p},r)=><SeparatorPrimitive.Root ref={r} decorative orientation={orientation} className={cn('shrink-0 bg-border',orientation==='horizontal'?'h-[1px] w-full':'h-full w-[1px]',className)} {...p}/>); Separator.displayName=SeparatorPrimitive.Root.displayName; export { Separator };",
  textarea: "import * as React from 'react'; import { cn } from '@/lib/utils'; const Textarea=React.forwardRef(({className,...p},r)=><textarea ref={r} className={cn('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',className)} {...p}/>); Textarea.displayName='Textarea'; export { Textarea };",
  select: "export { default as Select } from './select-stub.jsx';",
  avatar: "import * as React from 'react'; import { cn } from '@/lib/utils'; const Avatar=React.forwardRef(({className,...p},r)=><div ref={r} className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',className)} {...p}/>); Avatar.displayName='Avatar'; const AvatarImage=React.forwardRef(({className,...p},r)=><img ref={r} className={cn('aspect-square h-full w-full',className)} {...p}/>); AvatarImage.displayName='AvatarImage'; const AvatarFallback=React.forwardRef(({className,...p},r)=><div ref={r} className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted',className)} {...p}/>); AvatarFallback.displayName='AvatarFallback'; export { Avatar, AvatarImage, AvatarFallback };",
  progress: "import * as React from 'react'; import { cn } from '@/lib/utils'; const Progress=React.forwardRef(({className,value,...p},r)=><div ref={r} className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary',className)} {...p}><div className='h-full w-full flex-1 bg-primary transition-all' style={{transform:\`translateX(-\${100-(value||0)}%)\`}}/></div>); Progress.displayName='Progress'; export { Progress };",
  skeleton: "import { cn } from '@/lib/utils'; function Skeleton({className,...p}){return <div className={cn('animate-pulse rounded-md bg-muted',className)} {...p}/>} export { Skeleton };",
};
const usedComponents = Object.keys(comps).filter(c => src.includes(\`@/components/ui/\${c}\`) || src.includes(\`from '../components/ui/\${c}\`));
usedComponents.forEach(c => {
  const fp = path.join(uiDir,\`\${c}.jsx\`);
  if (!fs.existsSync(fp)) { fs.writeFileSync(fp, comps[c]); console.log('Created',fp); }
});
console.log('shadcn setup done');
`;
}

function makeSetupStubs() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
function walk(dir) {
  try {
    return fs.readdirSync(dir).flatMap(f => {
      const fp = path.join(dir,f);
      return fs.statSync(fp).isDirectory() ? walk(fp) : [fp];
    });
  } catch { return []; }
}
const files = walk('src');
const importRe = /from ['"](\\.{1,2}\/[^'"]+)['"]/g;
files.forEach(file => {
  if (!/\.(jsx?|tsx?)$/.test(file)) return;
  let src; try { src = fs.readFileSync(file,'utf8'); } catch { return; }
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const imp = m[1];
    const dir = path.dirname(file);
    const base = path.resolve(dir, imp);
    const exts = ['.jsx','.tsx','.js','.ts'];
    const exists = exts.some(e => fs.existsSync(base+e)) || fs.existsSync(base) || fs.existsSync(base+'/index.jsx') || fs.existsSync(base+'/index.js');
    if (!exists) {
      const isComponent = /[A-Z]/.test(path.basename(base,path.extname(base))[0]);
      const stub = isComponent
        ? \`export default function \${path.basename(base,path.extname(base)).replace(/[^a-zA-Z0-9]/g,'_')}(props) { return null; }\`
        : \`export default {}; export const __stub = () => {};\`;
      const target = base.endsWith('.jsx')||base.endsWith('.tsx')||base.endsWith('.js')||base.endsWith('.ts') ? base : base+'.jsx';
      try { fs.mkdirSync(path.dirname(target),{recursive:true}); if(!fs.existsSync(target)){fs.writeFileSync(target,stub); console.log('Stub:',target);} } catch {}
    }
  }
});
console.log('Stubs done');
`;
}

function makeSetupPatchVite() {
  return `#!/usr/bin/env node
const fs = require('fs');
const cfg = fs.existsSync('vite.config.js') ? fs.readFileSync('vite.config.js','utf8') : '';
if (!cfg.includes('resolve.extensions') && !cfg.includes("extensions:")) {
  const updated = cfg.includes("defineConfig(")
    ? cfg.replace(/}\s*\)\s*;?\s*$/, "  resolve: { extensions: ['.mjs','.js','.jsx','.ts','.tsx','.json'] }\n});")
    : cfg;
  fs.writeFileSync('vite.config.js', updated || \`import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins:[react()], resolve:{extensions:['.mjs','.js','.jsx','.ts','.tsx','.json']} });\`);
}
console.log('vite.config patched');
`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Auth
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { file_url, project_name, build_id, ai_tool, app_id, webhook_url } = await req.json();
  if (!file_url || !project_name || !build_id) return Response.json({ error: 'Missing params' }, { status: 400 });

  try {
    // 1. Get GitHub username
    const userRes = await gh('/user');
    const { login: github_username } = await userRes.json();

    // 2. Create temp private repo
    const repoName = `build-${sanitize(project_name)}-${Date.now()}`;
    const createRes = await gh('/user/repos', {
      method: 'POST',
      body: JSON.stringify({ name: repoName, private: true, auto_init: false }),
    });
    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.message ?? 'Failed to create repo');
    }

    // 3. Download project file
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) throw new Error('Failed to download file: ' + file_url);
    const fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    const fileB64 = encodeBase64(fileBytes);

    // 4. Build scripts
    const scripts: Record<string, string> = {
      'setup.sh':                  makeSetupSh(),
      'setup-pkg.cjs':             makeSetupPkg(),
      'setup-files.cjs':           makeSetupFiles(),
      'setup-shadcn.cjs':          makeSetupShadcn(),
      'setup-stubs.cjs':           makeSetupStubs(),
      'setup-patch-vite.cjs':      makeSetupPatchVite(),
      'setup-base44-mock.cjs':     makeSetupBase44Mock(app_id ?? ''),
      'setup-env.cjs':             makeSetupEnv(app_id ?? '', webhook_url ?? ''),
      'setup-form-interceptor.cjs':makeSetupFormInterceptor(),
      '.github/workflows/build.yml': makeWorkflow(),
    };

    // 5. Create blobs in parallel
    const blobShas: Record<string, string> = {};
    await Promise.all(
      Object.entries(scripts).map(async ([filePath, content]) => {
        const res = await gh(`/repos/${github_username}/${repoName}/git/blobs`, {
          method: 'POST',
          body: JSON.stringify({ content, encoding: 'utf-8' }),
        });
        const { sha } = await res.json();
        blobShas[filePath] = sha;
      })
    );

    // project.zip blob
    const zipBlobRes = await gh(`/repos/${github_username}/${repoName}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: fileB64, encoding: 'base64' }),
    });
    const { sha: zipSha } = await zipBlobRes.json();
    blobShas['project.zip'] = zipSha;

    // 6. Create Git tree
    const tree = Object.entries(blobShas).map(([path, sha]) => ({
      path,
      mode: path.endsWith('.sh') ? '100755' : '100644',
      type: 'blob',
      sha,
    }));
    const treeRes = await gh(`/repos/${github_username}/${repoName}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ tree }),
    });
    const { sha: treeSha } = await treeRes.json();

    // 7. Create commit
    const commitRes = await gh(`/repos/${github_username}/${repoName}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message: `build: ${project_name}`, tree: treeSha }),
    });
    const { sha: commitSha } = await commitRes.json();

    // 8. Create ref (triggers workflow)
    await gh(`/repos/${github_username}/${repoName}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: 'refs/heads/main', sha: commitSha }),
    });

    // 9. Update build record
    await supabase.from('build_history').update({
      github_run_id: `${github_username}/${repoName}`,
      status: 'processing',
    }).eq('id', build_id);

    return Response.json({ success: true, repo: repoName, github_username }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    await supabase.from('build_history').update({ status: 'failed', error_message: String(e) }).eq('id', build_id);
    return Response.json({ error: String(e) }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});
