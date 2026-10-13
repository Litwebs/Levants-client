#!/usr/bin/env python3
import os,re,subprocess
match=re.fullmatch(r'deploy ([0-9a-f]{40})',os.environ.get('SSH_ORIGINAL_COMMAND',''))
if not match:raise SystemExit('Only an exact UAT storefront deployment is permitted')
raise SystemExit(subprocess.call(['sudo','-n','/usr/local/sbin/levants-uat-storefront-deploy',match.group(1)]))
