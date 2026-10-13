#!/usr/bin/env python3
import os,socket,subprocess
from pathlib import Path
DOMAIN='uat.levantsdairy.co.uk'
SITE=Path('/etc/nginx/sites-available')/DOMAIN
LINK=Path('/etc/nginx/sites-enabled')/DOMAIN
WEBROOT=Path('/var/lib/levants-uat-acme')
if os.geteuid()!=0:raise SystemExit('Run as root')
if SITE.exists() or LINK.exists() or LINK.is_symlink():raise SystemExit('UAT storefront site already exists')
if not Path('/srv/levants-uat-storefront/current/index.html').is_file():raise SystemExit('Deploy verified UAT storefront first')
# Query the authoritative DNS directly: recursive resolvers may cache NXDOMAIN
# from before the user created this record. ACME still performs its own check.
addresses=set(subprocess.check_output(['dig','+short','@dns1.registrar-servers.com',DOMAIN,'A'],text=True).split())
ipv6=subprocess.check_output(['dig','+short','@dns1.registrar-servers.com',DOMAIN,'AAAA'],text=True).strip()
if addresses!={'87.106.76.170'} or ipv6:raise SystemExit('Authoritative UAT DNS must point only to this VPS')
WEBROOT.mkdir(mode=0o755,exist_ok=True)
challenge='server { listen 80; server_name '+DOMAIN+'; location /.well-known/acme-challenge/ { root '+str(WEBROOT)+'; } location / { return 403; } }\n'
def run(*args):subprocess.run(args,check=True)
SITE.write_text(challenge);LINK.symlink_to(SITE)
try:run('nginx','-t')
except Exception:LINK.unlink();SITE.unlink();raise
run('systemctl','reload','nginx')
try:
 run('certbot','certonly','--config','/dev/null','--webroot','-w',str(WEBROOT),'-d',DOMAIN,'--cert-name',DOMAIN,'--non-interactive','--no-directory-hooks','--server','https://acme-v02.api.letsencrypt.org/directory')
 SITE.write_text(Path(__file__).with_name('nginx-https.conf').read_text())
 run('nginx','-t');run('systemctl','reload','nginx')
except Exception:
 SITE.write_text(challenge);run('nginx','-t');run('systemctl','reload','nginx');raise
hook=Path('/etc/letsencrypt/renewal-hooks/deploy/levants-uat-storefront-reload')
with hook.open('x') as out:out.write('#!/bin/sh\nset -eu\nif [ "${RENEWED_LINEAGE:-}" = "/etc/letsencrypt/live/'+DOMAIN+'" ]; then\n /usr/sbin/nginx -t\n /usr/bin/systemctl reload nginx\nfi\n')
os.chmod(hook,0o755)
print('UAT storefront HTTPS enabled')
