import test from 'node:test';import assert from 'node:assert/strict';
import {planJobs,slug,isProfile,extractEmails,safeUrl} from '../src/planner.js';
test('city x trade creates jobs and deduplicates duplicate cities',()=>{const j=planJobs({locations:[{city:'San Antonio',state:'Texas'},{city:'San Antonio',state:'Texas'},{city:'Dallas',state:'TX'}],trades:['electrical','plumbing']});assert.equal(j.length,4);assert.equal(j[0].url,'https://www.cylex.us.com/san-antonio/electricians-electrical-contractors/');});
test('multi state electrical creates independent jobs',()=>assert.equal(planJobs({locations:[{city:'Houston',state:'TX'},{city:'Miami',state:'FL'}],trades:['electrical']}).length,2));
test('reject unsupported malformed trade',()=>assert.throws(()=>planJobs({locations:[{city:'Dallas',state:'TX'}],trades:['http://bad']})));
test('profile identification',()=>{assert.ok(isProfile('https://www.cylex.us.com/company/demo-123.html'));assert.ok(!isProfile('https://wrong.com/company/demo-123.html'));});
test('extract and normalize public emails',()=>assert.deepEqual(extractEmails('Info@Test.com INFO@test.com sales@test.com'),['info@test.com','sales@test.com']));
test('safe URL refuses javascript',()=>assert.equal(safeUrl('javascript:alert(1)','https://www.cylex.us.com'),null));
