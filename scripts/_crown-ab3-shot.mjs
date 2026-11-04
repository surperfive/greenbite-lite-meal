import { chromium } from 'playwright';
import path from 'node:path';
const file='file:///'+path.resolve('scripts/_crown-ab3.html').replace(/\\/g,'/');
const b=await chromium.launch({channel:'chrome'});
const p=await b.newPage({viewport:{width:800,height:1060},deviceScaleFactor:2});
await p.goto(file,{waitUntil:'load'}); await p.waitForTimeout(400);
await p.screenshot({path:'scripts/_shots/crown-ab3.png',fullPage:true});
console.log('ok'); await b.close();
