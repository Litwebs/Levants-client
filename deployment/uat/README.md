# Isolated UAT storefront

Production remains on GitHub Pages. Only `uat` deploys here:
- Site: https://uat.levantsdairy.co.uk
- API: https://uat-api.levantsdairy.co.uk/api
- Files: /srv/levants-uat-storefront/releases/<commit>, current symlink
- Dedicated forced-command SSH identity: levants-uat-storefront-deploy

GitHub environment `uat`: allow deployment branch `uat` only. Add secret
`UAT_STOREFRONT_SSH_KEY` (dedicated private key), and variables `UAT_HOST`
(87.106.76.170), `UAT_PORT` (22), `UAT_KNOWN_HOSTS` (verified host key entries).
Never place API/provider secret keys in VITE variables. Stripe's sandbox
publishable key comes from the UAT backend and is checked before Stripe loads.

CI verifies configuration and the built artifact, packages checksums, deploys
only static files into an immutable release, then checks the live release SHA.
UAT omits the production Pages CNAME, blocks indexing, displays a UAT banner
and does not query production's external website-status service.

First server setup: run provision.py with the dedicated public key. Deploy a
verified archive, then run enable-https.py after DNS propagation. These scripts
create only the UAT site's configuration and account. Nginx configuration is
validated before a graceful reload; production's site files are not edited.

Backend mapping requires CLIENT_FRONT_URL_PROD and CUSTOMER_PORTAL_URL_PROD
both set to https://uat.levantsdairy.co.uk in UAT's protected configuration.
FRONTEND_URL_PROD remains the UAT admin origin. Backend UAT safety rules must
support this mapping before changing the configuration. Never copy production
customer data. Test using synthetic accounts and Stripe sandbox cards.

When the storefront changes, update the backend's deployment/uat/portal.json
SHA to this storefront commit and pass its browser suite before promoting the
paired backend/frontend changes. This workflow does not deploy production.
