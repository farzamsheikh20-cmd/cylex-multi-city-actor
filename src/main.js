import { Actor, log } from 'apify';
import robotsParser from 'robots-parser';
import { ProxyAgent } from 'undici';
import { plan, pageUrl, profileUrls, parseProfile } from './core.js';

const defaults = {dryRun:true,locations:['Houston, TX','Dallas, TX','Austin, TX'],trades:['electrical'],maxListings:100,maxListingsPerJob:25,maxPagesPerJob:3,maxRequests:30,maxRuntimeSeconds:180,minDelayMs:3000,extractEmails:true,maxEstimatedUsd:0.25,estimatedUsdPerRequest:0.005,proxyMode:'RESIDENTIAL'};
await Actor.init();
try {
 const input={...defaults,...(await Actor.getInput()||{})};
 const jobs=plan(input);
 if(!['RESIDENTIAL','DATACENTER','OFF'].includes(input.proxyMode))throw Error('Invalid proxyMode');
 for(const k of ['maxListings','maxListingsPerJob','maxPagesPerJob','maxRequests','maxRuntimeSeconds','minDelayMs'])if(!Number.isInteger(input[k])||input[k]<=0)throw Error(`Invalid ${k}`);
 if(input.maxRequests>2000||input.minDelayMs<1000||input.maxRuntimeSeconds>3600)throw Error('Safety bounds exceeded');
 if(input.dryRun){await Actor.setValue('SUMMARY',{mode:'DRY_RUN',jobs,plannedJobs:jobs.length,proxyMode:input.proxyMode,notice:'No directory HTTP requests were sent; compute costs may still apply.'});log.info(`Dry-run jobs: ${jobs.length}`);}
 else {
  const counters={requests:0,records:0,jobsCompleted:0,stopReason:'',proxyMode:input.proxyMode};
  const proxyConfig=input.proxyMode==='RESIDENTIAL' ? await Actor.createProxyConfiguration({groups:['RESIDENTIAL'],countryCode:'US'}) : input.proxyMode==='DATACENTER' ? await Actor.createProxyConfiguration() : null;
  if(input.proxyMode!=='OFF'&&!proxyConfig)throw Error('Selected Apify proxy configuration is unavailable.');
  const seen=new Set();let lastRequest=0;const end=Date.now()+input.maxRuntimeSeconds*1000;
  async function get(url){
   if(Date.now()>end||counters.requests>=input.maxRequests||((counters.requests+1)*input.estimatedUsdPerRequest)>input.maxEstimatedUsd)throw Error('STOP: runtime, request count or estimated cost limit');
   const wait=Math.max(0,input.minDelayMs-(Date.now()-lastRequest));if(wait)await new Promise(r=>setTimeout(r,wait));
   if(Date.now()>end)throw Error('STOP: runtime');counters.requests++;lastRequest=Date.now();
   const proxyUrl=proxyConfig?await proxyConfig.newUrl():null;
   if(proxyConfig&&!proxyUrl)throw Error('STOP: no Apify proxy URL available');
   const agent=proxyUrl?new ProxyAgent(proxyUrl):null;
   try {
    const response=await fetch(url,{redirect:'manual',headers:{'user-agent':'CylexDirectoryResearch/1.0','accept':'text/html,text/plain'},signal:AbortSignal.timeout(12000),...(agent?{dispatcher:agent}:{})});
    if([401,403,429].includes(response.status))throw Error(`STOP: blocked (${response.status}) at ${new URL(url).pathname}; proxyMode=${input.proxyMode}`);
    if(response.status>=300&&response.status<400)throw Error('STOP: redirect (no bypass attempts)');
    if(!response.ok)throw Error(`STOP: HTTP ${response.status}`);
    if(Number(response.headers.get('content-length')||0)>1500000)throw Error('STOP: large response');
    const body=await response.text();if(body.length>1500000)throw Error('STOP: large document');
    if(/captcha|verify you are human|access denied|checking your browser/i.test(body.slice(0,1500)))throw Error('STOP: challenge detected');
    return body;
   } finally {if(agent)await agent.close();}
  }
  let robots=null;
  async function permitted(url){if(!robots){const robotsText=await get('https://www.cylex.us.com/robots.txt');robots=robotsParser('https://www.cylex.us.com/robots.txt',robotsText);}return robots.isAllowed(url,'CylexDirectoryResearch/1.0')===true;}
  try {
   outer:for(const job of jobs){let perJob=0;
    for(let p=1;p<=input.maxPagesPerJob;p++){
     if(perJob>=input.maxListingsPerJob||counters.records>=input.maxListings)break;
     const url=pageUrl(job.url,p);if(!await permitted(url))throw Error('STOP: robots policy disallows or cannot verify listing page');
     const profiles=profileUrls(await get(url),url);if(!profiles.length)break;
     for(const profile of profiles){if(perJob>=input.maxListingsPerJob||counters.records>=input.maxListings)break;if(seen.has(profile))continue;seen.add(profile);
      if(!await permitted(profile))continue;
      const details=parseProfile(await get(profile),profile);if(!details.company)continue;
      await Actor.pushData({company:details.company,website:details.website,email:input.extractEmails?(details.emails[0]||''):'',emails:input.extractEmails?details.emails:[],profileUrl:profile,city:job.city,state:job.state,trade:job.trade,source:'Cylex USA'});
      counters.records++;perJob++;
     }
    }
    counters.jobsCompleted++;if(counters.records>=input.maxListings)break outer;
   }
  }catch(e){counters.stopReason=String(e.message||e);log.warning(counters.stopReason);}
  await Actor.setValue('SUMMARY',{mode:'LIVE',...counters,plannedJobs:jobs.length,estimatedRequestCostUsd:counters.requests*input.estimatedUsdPerRequest,disclaimer:'Internal estimate only; actual compute/proxy charges are separate.'});
 }
}finally{await Actor.exit();}
