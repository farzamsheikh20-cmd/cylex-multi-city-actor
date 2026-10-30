import test from 'node:test';import assert from 'node:assert/strict';import {plan,profileUrls,parseProfile,pageUrl} from '../src/core.js';
test('3 cities x 2 trades',()=>assert.equal(plan({locations:['Houston, TX','Dallas, TX','Austin, TX'],trades:['electrical','plumbing']}).length,6));
test('deduplicate jobs',()=>assert.equal(plan({locations:['Houston, TX','Houston, TX'],trades:['electrical']}).length,1));
test('reject bad cities',()=>assert.throws(()=>plan({locations:['Texas'],trades:['electrical']})));
test('reject unsupported trade',()=>assert.throws(()=>plan({locations:['Austin, TX'],trades:['not a trade']})));
test('page number',()=>assert.equal(pageUrl('https://www.cylex.us.com/houston/electricians-electrical-contractors/',2),'https://www.cylex.us.com/houston/electricians-electrical-contractors/?p=2'));
test('profile links are same-host',()=>assert.deepEqual(profileUrls('<a href="/company/abc.html">A</a><a href="https://evil.test/company/x">B</a>','https://www.cylex.us.com/houston/'),['https://www.cylex.us.com/company/abc.html']));
test('extract public email and website',()=>{const x=parseProfile('<h1>Electric Co</h1><a href="mailto:office@example.com">email</a><a href="https://electric.example/">site</a>','https://www.cylex.us.com/company/a');assert.equal(x.company,'Electric Co');assert.equal(x.emails[0],'office@example.com');assert.equal(x.website,'https://electric.example/');});
