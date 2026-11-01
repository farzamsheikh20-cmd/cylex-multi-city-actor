# Cylex Directory Actor

Complete source package. Upload the **contents** to the root of your GitHub repository (preserve `.actor/`, `src/`, `test/` folders), then build in Apify from main.

Proxy: `RESIDENTIAL` selects Apify US residential proxies, `DATACENTER` selects default Apify proxies, `OFF` selects direct access.

`dryRun` defaults to true. Live extraction requires permission to access the destination; robots.txt denial, HTTP 403/429, redirect challenges and captchas stop access.

The internal request cost estimate is not an Apify billing cap. Configure platform limits separately.

Run `node --check src/main.js`, `node --check src/core.js`, `npm test` to validate source. No live Cylex requests are included in these tests.
