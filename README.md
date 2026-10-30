# Cylex Multi-City Contact Extractor

Neutral-name GitHub-ready Apify Actor. No paid runs were conducted while preparing the package.

## Features

- `locations`: any list of `{ "city": "Dallas", "state": "Texas" }` objects (up to 1000 per batch)
- `trades`: category IDs (`electrical` is confirmed; others need URL validation)
- Automatically produces city × trade combinations
- Paginated Cylex categories (`?p=2`) and individual company pages
- Public `mailto:` email extraction on profile pages
- Optional external business homepage check, off by default
- In-run duplicate avoidance by website domain or company name
- `dryRun: true` means no directory requests; running on Apify still uses compute
- Request, runtime, page, per-job and estimated-cost limits
- Robots check; stops on 401, 403, 429, challenge pages and unknown redirects; no proxy circumvention

## Github upload

Create a GitHub repository named `cylex-multi-city-actor`. Extract this ZIP and upload all extracted files (including `.actor/`), NOT the ZIP alone. The root must include `package.json`, `Dockerfile`, `.actor/` and `src/`. In Apify Console create Actor → Connect Git repository, authorize GitHub, choose repo/branch, then build. No paid scraping runs were launched here.

## First steps

1. Run `npm install` then `npm test` and `npm run check` on a computer with network access.
2. Keep `dryRun: true` and inspect the planned jobs.
3. Confirm site permissions for the targets and enable one city with `maxListings:5`, `maxRequests:12` and an Apify platform spending limit.
4. Validate fields, then expand to 3–5 cities. Duplicates are removed only inside one run; merge exported batches using website/domain externally.
5. For nationwide searches prepare a city/state list from a licensed city dataset and split into manageable regional batches. State by itself DOES NOT enumerate all cities.

## Notes

- The program currently constructs city/category URLs using the Cylex pattern; not every category or city URL is guaranteed to exist. The trade slugs other than electrical are candidates only.
- Some company pages may not display website or public email; no values are fabricated.
- Cylex live accessibility, current markup, and robots permissions could not be fully verified in the local environment. No live extraction success is claimed.
- The internal USD estimate is a request counter × assumed price, **not** an actual Apify billing limit. Use Apify platform budgets separately.
- Website terms and permissions must be checked before any live crawl.
