export const tradeSlugs = Object.freeze({electrical:'electricians-electrical-contractors',electrician:'electricians-electrical-contractors',plumbing:'plumbers',hvac:'heating-air-conditioning-contractors',roofing:'roofing-contractors',drywall:'drywall-contractors',concrete:'concrete-contractors','general contractor':'general-contractors'});
export function slug(s){return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function plan(input){
 const cities=input.locations??['Houston, TX']; const trades=input.trades??['electrical'];
 if(!Array.isArray(cities)||!Array.isArray(trades)||!cities.length||!trades.length)throw Error('Provide cities and trades arrays');
 if(cities.length>5000||trades.length>20)throw Error('Too many entries for one run');
 const jobs=[],seen=new Set();
 for(const location of cities){if(typeof location!=='string')throw Error('Locations must be strings like Houston, TX');const match=location.trim().match(/^(.+?),\s*([A-Za-z ]{2,25})$/);if(!match)throw Error(`Bad location: ${location}. Use City, ST`);const city=match[1].trim(),state=match[2].trim();
 for(const rawTrade of trades){const trade=String(rawTrade).toLowerCase().trim(),path=tradeSlugs[trade];if(!path)throw Error(`Unsupported trade: ${rawTrade}`);const url=`https://www.cylex.us.com/${slug(city)}/${path}/`;const key=url;if(seen.has(key))continue;seen.add(key);jobs.push({city,state,trade,url});}}
 return jobs;
}
export function decodeHtml(s){return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
export function profileUrls(html,base){const out=new Set();const re=/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;let match;while((match=re.exec(html))){try{const u=new URL(decodeHtml(match[1]),base);if(u.hostname!=='www.cylex.us.com')continue;u.hash='';if(/\/company\//i.test(u.pathname))out.add(u.href);}catch{}}return [...out];}
export function parseProfile(html,url){const title=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g,'').trim()||html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim()||'';
 const emails=[...new Set([...html.matchAll(/href\s*=\s*["']mailto:([^"'?\s]+)/gi)].map(m=>decodeURIComponent(m[1]).toLowerCase()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)))];
 const links=[...html.matchAll(/<a\b[^>]*href\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi)].map(m=>decodeHtml(m[1]));
 const website=links.find(x=>{try{const h=new URL(x).hostname.toLowerCase();return !h.endsWith('cylex.us.com')&&!/facebook|instagram|linkedin|google|twitter|yelp|youtube|maps\.apple/i.test(h);}catch{return false;}})||'';
 return {company:decodeHtml(title),website,emails,profileUrl:url};}
export function pageUrl(url,page){const u=new URL(url);if(page>1)u.searchParams.set('p',String(page));return u.href;}
