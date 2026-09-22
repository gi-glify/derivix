// Start the customer dev server on port 5175; use PLAYWRIGHT_MODULE for an external Playwright installation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1];
assert(url, 'Supabase URL required for request interception');
const host = new URL(url).hostname;
const user = { id:'11111111-1111-4111-8111-111111111111', aud:'authenticated', role:'authenticated', email:'browser-test@example.test', user_metadata:{full_name:'Browser Test'}, app_metadata:{}, created_at:new Date().toISOString() };
const token = [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'test'].join('.');
const browser = await chromium.launch({ headless:true, channel:process.env.BROWSER_CHANNEL || 'chrome' });
const context = await browser.newContext({ viewport:{width:390,height:844} });
await context.addInitScript(({host,user,token}) => {
  localStorage.setItem('sb-'+host.split('.')[0]+'-auth-token', JSON.stringify({access_token:token,refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
}, {host,user,token});
let mode='normal', contracts=[], submitted=[], stateCalls=0, tickCalls=0;
const indices=[{symbol:'V50_1S',name:'Volatility 50 (1s) Index',precision:2,base_price:'267860.19'}];
const ticks=Array.from({length:100},(_,i)=>({sequence:i+1,value:267860+i/100,digit:i%10,created_at:new Date(Date.UTC(2026,8,22,0,0,i)).toISOString()}));
await context.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.hostname==='127.0.0.1') return route.continue();
 if(u.hostname!==host) return route.abort();
 let result={};
 if(u.pathname.includes('/auth/v1/user')) result=user;
 else if(u.pathname.endsWith('/rpc/binary_api')) {
   const req=route.request().postDataJSON();
   if(mode==='error') return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({code:'PGRST202',message:'Function unavailable'})});
   if(req.p_action==='markets') result={indices:mode==='empty'?[]:indices};
   else if(req.p_action==='tick') { tickCalls++; result={recorded:true}; }
   else if(req.p_action==='state') {stateCalls++;result={contracts,ticks:mode==='empty'?{}:{V50_1S:ticks}};}
   else if(req.p_action==='create') {submitted.push(req.p_payload); contracts=[{id:'contract-1',symbol:'V50_1S',contract_type:req.p_payload.contractType,prediction:req.p_payload.prediction,stake:String(req.p_payload.stake),payout:'19.60',duration_ticks:req.p_payload.durationTicks,opening_value:'267860.19',final_value:null,final_digit:null,status:'OPEN',created_at:new Date().toISOString(),settles_at:new Date(Date.now()+12000).toISOString(),settled_at:null}]; result={contract:contracts[0]};}
 } else if(u.pathname.endsWith('/rpc/account_api')) result= mode==='malformed'?{summary:null}:{summary:{total:'100',reserved:contracts.some(c=>c.status==='OPEN')?'10':'0',available:contracts.some(c=>c.status==='OPEN')?'90':'100',currency:'KES',mode:'demo'}};
 else result=[];
 await route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
});
const page=await context.newPage(); const crashes=[];page.on('pageerror',e=>crashes.push(e.message));
await page.goto('http://127.0.0.1:5175/app/binary');
await page.locator('.binary-wallet strong').filter({hasText:'100.00'}).waitFor();
const skip = page.getByRole('button',{name:'Skip tour'});
if (await skip.isVisible()) await skip.click();
const cookies = page.getByRole('button',{name:'Essential only'});
if (await cookies.isVisible()) await cookies.click();
assert.equal(await page.locator('.binary-digit').count(),10);
await page.waitForTimeout(1100);
assert(tickCalls > 0, 'the simulated market stream should request a stored tick');
assert.equal(await page.getByLabel('Index',{exact:true}).inputValue(),'V50_1S');
assert.equal(await page.getByLabel('Stake',{exact:true}).inputValue(),'');
const boxes=await page.locator('.binary-digit-ring').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
assert.equal(boxes[0].y,boxes[4].y);assert(boxes[5].y>boxes[0].y);assert.equal(boxes[5].y,boxes[9].y);
assert(Math.abs(boxes[0].w-boxes[0].h)<1);
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:'/private/tmp/binary-mobile.png',fullPage:true});
await page.getByLabel('Stake',{exact:true}).fill('10');
assert.equal(await page.locator('.binary-buy.teal').isEnabled(),true);
await page.getByLabel('Trade type',{exact:true}).selectOption('1');
assert.equal(await page.locator('.binary-buy.teal .binary-buy-title').innerText(),'Over');
await page.getByRole('button',{name:'9',exact:true}).click();
assert.equal(await page.locator('.binary-buy.teal').isDisabled(),true);
await page.getByLabel('Trade type',{exact:true}).selectOption('2');
assert.equal(await page.locator('.binary-buy.coral .binary-buy-title').innerText(),'Differs');
await page.getByLabel('Trade type',{exact:true}).selectOption('0');
await page.locator('.binary-buy.teal').click();
await page.locator('.binary-contract-status').filter({hasText:'until expiry'}).waitFor();
assert.equal(submitted.length,1);assert.equal(submitted[0].contractType,'EVEN');
assert.equal(await page.getByLabel('Stake',{exact:true}).isDisabled(),true);
contracts=[{...contracts[0],status:'WON',final_digit:8,final_value:'267861.18',settled_at:new Date().toISOString()}];
await page.getByRole('button',{name:'Refresh Binary data'}).click();
await page.getByRole('status').filter({hasText:'Condition met'}).waitFor();
await page.getByText('Contract history',{exact:false}).first().click();
await page.locator('.binary-history').filter({hasText:'Payout KES 19.60'}).waitFor();
for(const width of [320,768,1440]) {
 await page.setViewportSize({width,height:900});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'overflow at '+width);
 await page.screenshot({path:'/private/tmp/binary-'+width+'.png',fullPage:true});
}
mode='error';await page.getByRole('button',{name:'Refresh Binary data'}).click();
await page.getByRole('alert').filter({hasText:'awaiting backend setup'}).waitFor();
assert.equal(await page.locator('.binary-buy.teal').isDisabled(),true);
await page.reload();await page.getByRole('alert').filter({hasText:'awaiting backend setup'}).waitFor();
assert.equal(await page.locator('.binary-wallet strong').innerText(),'—');
mode='malformed';await page.getByRole('button',{name:'Retry connection'}).click();
await page.getByRole('alert').filter({hasText:'Binary data is unavailable'}).waitFor();
mode='empty';contracts=[];await page.getByRole('button',{name:'Retry connection'}).click();
await page.locator('.binary-stage-label').filter({hasText:'No recorded ticks yet'}).waitFor();
assert.equal(await page.locator('.binary-digit-ring span').first().innerText(),'—');
assert.equal(await page.locator('.binary-buy.teal').isDisabled(),true);
assert.deepEqual(crashes,[]);
console.log('PASS: real RPC shape, stored simulated tick pulses, numeric strings, responsive trading ticket, active/settled results, empty/error/retry, mobile/desktop overflow, no page errors. State reads: '+stateCalls);
await browser.close();
