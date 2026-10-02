# Security guide

[Back to the README](README.md#tests-and-security)

We test that deal content stays data, links go to suitable destinations, and published files exclude internal evidence. We also track protections that still need implementation or verification. Passing tests alone do not establish that the site is secure.

Our target is the applicable Level 1 requirements in **OWASP ASVS 5.0.0**, plus risks specific to the updater. ASVS is the Application Security Verification Standard: a list of security requirements with evidence needed to verify them. Level 1 is the starting verification level. This guide records our baseline and open work; full coverage requires checking each applicable requirement and explaining any exclusions.

## Start here

1. Run `npm test` from the project directory. It uses Node's built-in test runner and needs no live restaurant requests.
2. Use [Coverage and open work](#coverage-and-open-work) to find the area your change affects. The middle column records existing evidence; the right column records unfinished checks or protections.
3. Add a regression test when fixing a security issue. Demonstrate the unsafe input and the expected safe result.
4. For browser or hosting controls, record manual evidence using [Recording a verification](#recording-a-verification). Keep unverified items open.

## Terms used in this guide

| Term | Meaning here |
| --- | --- |
| XSS | Cross-site scripting: malicious content executes as code in a visitor's browser |
| Output encoding | Escaping content for its destination, such as HTML text or a quoted attribute |
| DOM | The page structure JavaScript reads and changes in the browser |
| SSRF | Server-side request forgery: a fetch is directed to an unintended destination, such as a private network service |
| CI | Continuous integration: GitHub Actions jobs that check, update and publish this project |
| Security headers | HTTP response settings that tell browsers how to restrict scripts, framing and other behavior |
| Regression test | A repeatable check that an issue stays fixed |
| Trust boundary | A point where data enters code or a system with different permissions |

## Scope and trust boundaries

The visitor receives static HTML, JavaScript and JSON. There is no application login, session, database or write API. URL filters are untrusted input. Reviewed deal data enters HTML text, attributes, embedded JSON and external links. Restaurant responses enter a privileged CI updater with repository write access and an optional search API secret. The local development server is separate from production hosting. The external feedback survey is a separate application and needs its own assessment.

## Coverage and open work

| Area | Current evidence | Remaining verification / work |
| --- | --- | --- |
| Output encoding / XSS | [Security tests](scripts/security.test.mjs) build hostile deal text and attribute values; verify embedded JSON cannot terminate its script container | Real-browser DOM XSS tests for client rendering, search strings, malformed parameters and optional theme controls |
| URL validation | security.test.mjs rejects executable/non-HTTPS source URLs and checks map query isolation | Reject credentials and unsuitable destinations; apply URL validation at all relevant boundaries |
| Input validation | test.mjs validates dataset, duplicate IDs, dates, prices and filters | Expand malformed types, length limits, optional fields and adversarial inputs |
| SSRF / outbound requests | [Outbound tests](scripts/outbound.test.mjs) cover exact host approval, HTTPS/port restrictions, private and special-use IPs, all DNS answers, connection address pinning and redirect rejection. [Updater tests](scripts/verify.test.mjs) exercise rejected requests and search-key isolation | CI network egress restrictions, live transport checks and periodic review of special-use IP ranges; see the scoped ASVS evidence below |
| Resource exhaustion | Outbound tests cover declared and streamed byte limits, multibyte input, DNS/header/body deadlines, cancellation and truncated responses; updater tests exercise both source and discovery size limits | Runtime memory and concurrency measurements, total job budget and broader resource exhaustion review |
| Publication / confidentiality | security.test.mjs checks a clean build's file allowlist and exclusion of evidence | Build into a clean directory to prevent stale-file publication; inspect deployed artifact and secret handling |
| Secure configuration / transport | Public deployment targets GitHub Pages; local server binds loopback | Verify live HTTPS, HSTS, CSP, frame restrictions, nosniff and referrer policy. Hosting limitations may require a different hosting configuration; do not infer headers from source code |
| Path traversal / errors | Development server checks resolved root boundary and returns generic errors | HTTP tests for encoded traversal, malformed paths, sibling paths and platform differences |
| Supply chain / CI | No npm dependencies; Pages workflow runs npm test before building | Pin action revisions, review workflow permissions and triggers, secret exposure, repository protections and runtime update policy |
| Integrity / safe failure | verify.test.mjs checks changed/missing evidence, failed requests and preservation of freshness | Explicit malicious source fixtures, discovery-only quarantine, and reports that do not expose secrets |
| Privacy / cookies | Static app has no cookie-setting code | Verify live responses and third-party integrations for cookies; URL-only template selector remains unimplemented. No-cookie policy does not imply no localStorage |
| Authentication / sessions / access control / CSRF | No application accounts or state-changing visitor endpoints identified | Provisionally inapplicable to public static app; reassess CI, survey provider and any future APIs separately |
| Logging / operations | Updater produces review and failure reports | Define report access, retention, alert handling, incident response and vulnerability reporting |

## Running and interpreting checks

Run `npm test`. Security regression tests run with the existing functional tests and in the Pages deployment workflow. They use temporary build fixtures and mocked responses rather than attacking live restaurant sites. Tests prove specific cases, not absence of vulnerabilities. Browser and production HTTP checks remain necessary. The OWASP Top 10 is an awareness checklist; ASVS supplies the verification requirements and WSTG supplies testing techniques.

Before claiming coverage, complete a version-pinned requirement-by-requirement matrix with automated-test links, manual evidence, justified exclusions and remaining failures. Production hardening and operational controls cannot be established solely by unit tests.

## Updater request safety

The updater downloads restaurant pages in GitHub Actions. A malicious URL or changed DNS record must not direct that job to its own machine, private services or a cloud metadata endpoint. DNS is the service that translates a hostname into IP addresses. Checking DNS once is insufficient if the connection asks DNS again and receives a different address.

[The outbound helper](scripts/outbound.mjs) applies the same request controls to restaurant pages and the optional Brave Search call:

- Require HTTPS on port 443, with no credentials or fragment in the URL. Restaurant hostnames must exactly match [source-hosts.json](data/source-hosts.json); Brave has its own fixed hostname. Subdomains are separate entries.
- Check all returned IP addresses and reject the destination if any address is private or in a blocked special-use range. The IPv6 policy permits ordinary global unicast and excludes protocol, transition and documentation ranges. It is deliberately conservative.
- Connect to the checked address using a pinned DNS lookup. Keep the original hostname for TLS certificate validation, require at least TLS 1.2 and disable socket pooling for these requests.
- Reject redirects, including redirects within the same website. The helper makes no second request and therefore cannot forward the search key to a redirect destination.
- Limit restaurant bodies to 3,000,000 bytes and search bodies to 1,000,000 bytes. Count incoming bytes before retaining each chunk, even when Content-Length is missing or inaccurate. Response headers have a separate 16,384-byte limit.
- Apply one 20-second deadline to DNS, connection, headers and body. Destroy the request/response on failure. A DNS operation already in progress may finish later, but its result cannot start a request after the deadline.
- Request uncompressed responses and reject compressed bodies. This avoids expanding an unexpectedly large compressed payload; a source that insists on compression needs manual review.
- Use fixed connection/DNS error messages instead of recording provider error details. Invalid search JSON also gets a fixed error message. The transport has no cookie jar or proxy support.

These controls use Node's HTTPS transport and do not add an npm dependency. Tests substitute DNS and transport responses, so they do not contact live restaurant sites or validate real certificates. TLS configuration is checked in the request options; live certificate and deployment verification remain open. The limits bound each request, not the whole updater job. They also cannot prevent an approved public website from making requests on its own behalf.

### Reviewing a new or moved source

1. Confirm the final HTTPS page belongs to the restaurant and contains the actual offer terms. Approve the destination based on that review, not on a redirect or discovered link alone.
2. Add its exact hostname to `data/source-hosts.json` if needed. Existing entries were initialized from the current reviewed listings. Do not add wildcards, local hosts or private-network addresses.
3. Update the listing's source URL and review its verification excerpts and fingerprint. The hostname list approves where requests can go; it does not verify an offer.
4. Run `npm test` and `npm run build`. After a controlled update, inspect the review/failure report. A redirect, blocked destination, oversized response or timeout preserves that source's previous freshness dates. Other successfully verified sources can still advance.

Adding a hostname is a security-relevant configuration change and should receive code review. Network restrictions outside the application are an additional protection still to be configured in CI.

## ASVS evidence for this pass

This is a scoped evidence record dated October 2, 2026 for the local working tree. It does not mark complete application-level requirements as verified. The Level 2 rows supplement our Level 1 target because the updater has privileges beyond those of the public static site.

| ASVS 5.0.0 requirement | Scope and evidence | Status / remaining work |
| --- | --- | --- |
| 1.2.1 (Level 1), context-specific output encoding | `security.test.mjs`: hostile text and attributes in generated HTML | Partial: generated HTML cases pass; real-browser client rendering is still open |
| 1.2.2 (Level 1), URL encoding and safe protocols | `security.test.mjs`: source URL schemes and map query isolation; `outbound.test.mjs`: approved outbound URL policy | Partial: broader link/input boundary review remains open |
| 1.2.3 (Level 1), JavaScript/JSON output encoding | `security.test.mjs`: embedded JSON cannot close its script container and round-trips the input | Partial: remaining dynamic contexts need review |
| 1.3.6 (Level 2), SSRF restrictions | `outbound.test.mjs`: exact hosts, protocol/port rules, IP checks, pinned lookup and redirect rejection; `verify.test.mjs`: source/discovery rejection preserves expected state | Partial: path scope relies on reviewed listing URLs and the fixed search endpoint; network restrictions and live checks remain open |
| 12.3.1 (Level 2), encrypted service connections | `outbound.test.mjs`: request URL requires HTTPS with no plaintext fallback | Partial: verified for the updater helper; other project connections require review |
| 12.3.2 (Level 2), TLS client certificate validation | `outbound.test.mjs`: original hostname retained and certificate validation enabled in transport options | Partial: real invalid/untrusted certificate rejection is not exercised by the mocked transport |

Requirement descriptions are summarized from the version-pinned [ASVS encoding chapter](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x10-V1-Encoding-and-Sanitization.md) and [secure communication chapter](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x21-V12-Secure-Communication.md). Request deadlines and byte limits are additional updater threat controls, not evidence that every ASVS availability requirement is covered.

## Recording a verification

For each applicable ASVS requirement, record the following with the change or assessment. Use specific requirement IDs from version 5.0.0; the area names above are a navigation aid, not a substitute for those IDs.

| Field | What to record |
| --- | --- |
| Requirement | ASVS version, requirement ID and the behavior being checked |
| Scope | Public site, updater, local server, deployment or external integration |
| Status | Verified, open, or not applicable with a reviewed reason |
| Evidence | Test file and test name, or dated manual steps and observed results |
| Environment | Commit, browser or production URL, and relevant configuration |
| Follow-up | Remaining action and an owner when assigned |

Do not include API keys, tokens or other secrets in evidence. Recheck affected requirements when the implementation or deployment changes. New accounts, APIs and integrations require another scope review.

## OWASP references

- [ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0): the version used for our verification target.
- [Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/): methods for testing web applications.
- [XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html): handling untrusted content in different output contexts.
- [SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html): restricting outbound request destinations.
- [HTTP security headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html): browser protections configured by the host.
