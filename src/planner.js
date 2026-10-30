export const BASE = 'https://www.cylex.us.com';
export const TRADES = {
  electrical: 'electricians-electrical-contractors',
  plumbing: 'plumbers',
  hvac: 'heating-air-conditioning-contractors',
  roofing: 'roofing-contractors',
};
export const slug = s => String(s).trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function planJobs(input) {
  const cities = (input.locations || []).map(v => typeof v === 'string' ? {city:v.split(',')[0].trim(),state:v.split(',').slice(1).join(',').trim()} : v);
  const trades = input.trades || ['electrical'];
  if (!cities.length || !trades.length) throw Error('locations and trades must not be empty');
  if (cities.length > 1000 || trades.length > 8) throw Error('Input is too large; submit smaller batches');
  const jobs = []; const found = new Set();
  for (const loc of cities) for (const trade of trades) {
    if (!loc.city || !loc.state) throw Error('Each location requires a city and state');
    if (!/^[a-zA-Z .\-']{2,40}$/.test(loc.state)) throw Error('Invalid state');
    if (!TRADES[trade] && !/^[a-z0-9-]+$/.test(trade)) throw Error('Invalid trade slug');
    const category = TRADES[trade] || trade;
    const city = loc.city.trim(), state=loc.state.trim();
    const url = `${BASE}/${slug(city)}/${category}/`;
    const key = `${slug(city)}|${slug(state)}|${category}`;
    if (!found.has(key)) {found.add(key); jobs.push({city,state,trade,category,url});}
  }
  if (jobs.length > 2000) throw Error('More than 2000 combinations; use smaller batches');
  return jobs;
}
export const safeUrl = (s, base) => { try { const u = new URL(s,base); if(!['http:','https:'].includes(u.protocol) || u.username || u.password) return null; u.hash='';return u.href;}catch{return null;} };
export const isProfile = s => {try {const u=new URL(s);return u.hostname==='www.cylex.us.com' && /^\/company\/.+\.html$/.test(u.pathname);} catch {return false;}};
export const extractEmails = text => [...new Set((String(text).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)||[]).map(x=>x.toLowerCase()))];
