import {readFile,writeFile,mkdir,copyFile,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validate,activeDeals,googleMapsUrl} from './model.mjs';
const data=validate(JSON.parse(await readFile('data/deals.json','utf8')));await mkdir('dist',{recursive:true});
const publicData={updatedAt:data.updatedAt,deals:activeDeals(data).map(({evidence,...d})=>d)};
await writeFile('dist/deals.json',JSON.stringify(publicData,null,2)+'\n');await copyFile('scripts/model.mjs','dist/model.mjs');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const list=publicData.deals.map(d=>`<article class="deal"><div class="deal-top"><span class="badge">${escape(d.timeLabel)}</span><span>${escape(d.town)}</span></div><div class="price">${escape(d.priceLabel)}</div><h3>${escape(d.title)}</h3><p class="restaurant">${escape(d.restaurant)}</p><div class="deal-location"><p class="address">${escape(d.address)}</p><a href="${escape(googleMapsUrl(d))}" target="_blank" rel="noopener noreferrer" aria-label="${escape(d.restaurant)} on Google Maps (opens in a new tab)">Google Maps ↗</a></div><p class="terms">${escape(d.terms)}</p><div class="deal-foot"><span>Website checked ${escape(d.lastChecked)}</span><a href="${escape(d.sourceUrl)}" target="_blank" rel="noopener noreferrer">View offer ↗</a></div></article>`).join('');
const towns=[...new Set(publicData.deals.map(d=>d.town))].sort().map(t=>`<option>${escape(t)}</option>`).join('');
const template=await readFile('src/index.html','utf8');
let html=template.replace('<!-- TOWNS -->',towns).replace('<!-- DEALS -->',list).replace('<!-- DATA -->',JSON.stringify(publicData).replaceAll('<','\\u003c'));
// Each changed asset gets a fresh URL, avoiding mixed releases in browser caches.
for(const file of ['app.mjs','style.css','brand.css','fonts.css','templates.js','templates.css','themes.css']) {
  const contents=await readFile('src/'+file);
  const version=createHash('sha256').update(contents).digest('hex').slice(0,12);
  html=html.replaceAll('"./'+file+'"','"./'+file+'?v='+version+'"');
  await copyFile('src/'+file,'dist/'+file);
}
await writeFile('dist/index.html',html);
console.log(`Built ${publicData.deals.length} deals as static files.`);

await cp('src/fonts','dist/fonts',{recursive:true});

await cp('src/images','dist/images',{recursive:true});
