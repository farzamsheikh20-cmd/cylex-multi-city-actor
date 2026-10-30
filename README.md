# Cylex Directory Actor

A GitHub-ready Apify Actor. **Dry run is on by default.** No paid run has been performed.

## Setup
Create a repository, upload the **extracted contents**, including `.actor/`, then link the repo in Apify and build from `main`. Do not upload just the ZIP into the repo.

## Input
Locations use `City, ST` strings, for example `["Houston, TX","Dallas, TX"]`. Multiple trades are combined with every city. Supported trade slugs are in `src/core.js`. For nationwide coverage supply a vetted city list in manageable batches; no automatic nationwide enumeration is included. There is no external-company-site crawling, only publicly displayed Cylex profile contacts. Robots rules are checked and challenge pages are not bypassed.

## Safety
The built-in `maxEstimatedUsd` is **NOT** a guaranteed Apify spending cap; set an Apify platform spending limit separately. A dry run still incurs possible compute cost in Apify. Any site blocking or robots rule uncertainty stops live extraction. Live selectors and permissions must still be checked using a small authorized pilot.

## Local verification
Run `npm test` for dependency-free planner/parser tests. `node --check src/*.js` validates source syntax. `npm install` and an Apify cloud build still need to pass to confirm dependency resolution.

## Proxy mode
`proxyMode: "DATACENTER"` enables Apify datacenter proxies via `Actor.createProxyConfiguration()`. Every request, including `robots.txt`, passes through a proxy using `undici.ProxyAgent`. `proxyMode: "OFF"` makes direct requests. Residential proxies are not configured. No retries after HTTP 403/429, and robots.txt denial stops access. Proxy credentials are never logged. Proxies are not a guarantee of access; follow target website policies.

Before any live test, use Apify platform spending limits. `maxEstimatedUsd` is an internal assumption only, not an Apify billing cap.
