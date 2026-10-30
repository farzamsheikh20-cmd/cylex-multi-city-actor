import {Actor,log} from 'apify';
import robotsParser from 'robots-parser';
import {planJobs,safeUrl} from './planner.js';
import {listProfiles,parseProfile,parsePublicWebsiteEmails} from './parser.js';
const UA='DirectoryContactResearch/1.0 (respect robots; non-browser crawler)';
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
const defaults={dryRun:true,locations:[{city:'Houston',state:'Texas'},{city:'Dallas',state:'Texas'},{city:'Austin',state:'Texas'}],trades:['electrical'],maxListings:100,maxListingsPerJob:50,maxCategoryPagesPerJob:5,maxRequests:160,minDelayMs:2500,maxRuntimeSeconds:540,extractEmails:true,visitBusinessWebsites:false,maxBusinessPages:1,maxEstimatedUsd:0.50,estimatedUsdPerRequest:0.003};
await Actor.init();
const stats={requests:0,categoryPages:0,profilesVisited:0,records:0,blocked:false,stopReason:'',jobsCompleted:0};
try{
 const i={...defaults,...(await Actor.getInput()||{})};
 for(const field of ['maxListings','maxListingsPerJob','maxCategoryPagesPerJob','maxRequests','maxRuntimeSeconds','maxBusinessPages']) if(!Number.isInteger(i[field])||i[field]<1) throw Error(`Invalid ${field}`);
 if(i.maxListings>10000||i.maxRequests>5000||i.maxCategoryPagesPerJob>30||i.maxRuntimeSeconds>3600||i.minDelayMs<1000||i.maxEstimatedUsd<=0||i.estimatedUsdPerRequest<=0) throw Error('Safety limits exceeded');
 const jobs=planJobs(i);
 if(i.dryRun) {const summary={mode:'DRY_RUN',jobs,config:i,warning:'No network requests to directories; running on Apify may still incur compute cost.'}; await Actor.setValue('SUMMARY',summary);log.info('DRY_RUN: no scraping executed', {jobs:jobs.length});}
 else {
  const deadline=Date.now()+i.maxRuntimeSeconds*1000;
  const robots=new Map();let last=0;const seenProfiles=new Set(),seenCompanies=new Set();
  function check(){if(Date.now()>=deadline) throw Error('STOP runtime deadline');if(stats.requests>=i.maxRequests)throw Error('STOP request count');if((stats.requests+1)*i.estimatedUsdPerRequest>i.maxEstimatedUsd)throw Error('STOP internal estimated budget');}
  async function fetchText(url,robot=false){
   check();const delta=Date.now()-last;if(delta<i.minDelayMs)await wait(i.minDelayMs-delta);check();
   stats.requests++;last=Date.now();let r;
   try{r=await fetch(url,{redirect:'manual',headers:{'user-agent':UA,'accept':robot?'text/plain':'text/html'},signal:AbortSignal.timeout(12000)});}catch(e){throw Error(`STOP network failure: ${e.message}`);}
   if([401,403,429].includes(r.status)){stats.blocked=true;throw Error(`STOP blocked HTTP ${r.status}`);}
   if(r.status>=300 && r.status<400)throw Error(`STOP redirect HTTP ${r.status}`);
   if(!r.ok)throw Error(`HTTP ${r.status}`);
   if(!robot && !(r.headers.get('content-type')||'').includes('text/html'))throw Error('Unexpected response type');
   if(Number(r.headers.get('content-length')||0)>2000000)throw Error('Oversized response');
   const body=await r.text();if(body.length>2000000)throw Error('Oversized document');
   if(!robot && /captcha|verify you are human|access denied|checking your browser/i.test(body.slice(0,2000))){stats.blocked=true;throw Error('STOP challenge detected');}return body;
  }
  async function allowed(url){const origin=new URL(url).origin;if(!robots.has(origin)){try{const body=await fetchText(`${origin}/robots.txt`,true);robots.set(origin,robotsParser(`${origin}/robots.txt`,body));}catch(e){log.warning(`Robots inaccessible, skipping ${origin}: ${e.message}`);robots.set(origin,null);}}
   const parser=robots.get(origin);return !!parser && parser.isAllowed(url,UA)===true;
  }
  async function get(url){if(!await allowed(url)){log.warning('Robots disallowed/unverified, skipped '+url);return null;}return fetchText(url);}
  try {
   outer:for(const job of jobs){if(stats.records>=i.maxListings)break;let savedForJob=0;const pages=[job.url],donePages=new Set();
    while(pages.length&&donePages.size<i.maxCategoryPagesPerJob&&savedForJob<i.maxListingsPerJob&&stats.records<i.maxListings){
     const page=pages.shift();if(donePages.has(page))continue;donePages.add(page);
     const html=await get(page);if(!html)break;stats.categoryPages++;
     const {profiles,pages:more}=listProfiles(html,page);
     for(const p of more)if(!donePages.has(p)&&!pages.includes(p))pages.push(p);
     for(const url of profiles){if(seenProfiles.has(url))continue;seenProfiles.add(url);
      if(stats.records>=i.maxListings||savedForJob>=i.maxListingsPerJob)break;
      const profileHtml=await get(url);if(!profileHtml)continue;stats.profilesVisited++;
      const data=parseProfile(profileHtml,url);if(!data.company)continue;
      const key=(data.website?new URL(data.website).hostname.replace(/^www\./,''):data.company.toLowerCase().replace(/[^a-z0-9]/g,''));
      if(seenCompanies.has(key))continue;seenCompanies.add(key);
      let emailSource=data.emails.length?url:'';
      if(i.extractEmails && i.visitBusinessWebsites && data.website){
       const businessUrl=safeUrl(data.website);if(businessUrl){try{const html=await get(businessUrl);if(html){const e=parsePublicWebsiteEmails(html);data.emails=[...new Set([...data.emails,...e])];if(e.length)emailSource += (emailSource?'; ':'')+businessUrl;}}catch(e){if(e.message.startsWith('STOP'))throw e;log.warning('External website skipped: '+e.message);}}
      }
      if(!i.extractEmails)data.emails=[];
      await Actor.pushData({company:data.company,city:job.city,state:job.state,trade:job.trade,website:data.website,email:data.emails[0]||'',emails:data.emails,emailSource,profileUrl:url,directory:'Cylex USA'});
      stats.records++;savedForJob++;
     }
    }
    stats.jobsCompleted++;
   }
  }catch(e){stats.stopReason=e.message;log.warning(stats.stopReason);}
  await Actor.setValue('SUMMARY',{mode:'LIVE',jobsRequested:jobs.length,stats,estimatedRequestCostUsd:Number((stats.requests*i.estimatedUsdPerRequest).toFixed(4)),warning:'Internal estimate ONLY: not an Apify billing ceiling. Apify compute and proxies may cost more.'});
  log.info('Complete',stats);
 }
}finally{await Actor.exit();}
