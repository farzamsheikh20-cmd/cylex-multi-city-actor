import * as cheerio from 'cheerio';
import {safeUrl,isProfile,extractEmails} from './planner.js';
const isExternal = v => {try {const u=new URL(v);return /^https?:$/.test(u.protocol) && !/(^|\.)cylex\.us\.com$/.test(u.hostname) && !/(^|\.)(facebook|instagram|linkedin|youtube|yelp|google|x|twitter)\.com$/.test(u.hostname);}catch{return false;}};
export function listProfiles(html, pageUrl) {
 const $=cheerio.load(html); const profiles=new Set(), pages=new Set();
 $('a[href]').each((_,e)=> { const url=safeUrl($(e).attr('href'),pageUrl); if (!url) return;
  if(isProfile(url)) profiles.add(url);
  const a=new URL(url), b=new URL(pageUrl);
  if(a.origin===b.origin && a.pathname===b.pathname && /^[1-9]\d*$/.test(a.searchParams.get('p')||'')) pages.add(url);
 });
 return {profiles:[...profiles],pages:[...pages]};
}
export function parseProfile(html, pageUrl) {
 const $=cheerio.load(html);
 const company=($('h1').first().text()||$('meta[property="og:title"]').attr('content')||'').replace(/\s+/g,' ').trim();
 const emails=new Set(); let website='';
 $('a[href]').each((_,e)=>{
  const a=$(e),href=a.attr('href')||'',label=(a.text()+' '+(a.attr('title')||'')).toLowerCase();
  if(href.toLowerCase().startsWith('mailto:')) extractEmails(decodeURIComponent(href.slice(7))).forEach(v=>emails.add(v));
  const u=safeUrl(href,pageUrl);
  if(u && isExternal(u) && (/website|web site|homepage|visit website/.test(label) || /^https?:\/\//i.test(a.text().trim()) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(a.text().trim()))) website ||=u;
 });
 // Some pages label external links with a website-specific container.
 if(!website) $('[itemprop="url"], a[rel="nofollow"]').each((_,e)=> {const u=safeUrl($(e).attr('href'),pageUrl);if(!website && u && isExternal(u)) website=u;});
 return {company,website,emails:[...emails]};
}
export function parsePublicWebsiteEmails(html){const $=cheerio.load(html);const emails=[]; $('a[href^="mailto:"]').each((_,e)=>emails.push(...extractEmails(decodeURIComponent($(e).attr('href').slice(7)))));return [...new Set(emails)];}
