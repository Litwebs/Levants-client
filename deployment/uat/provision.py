#!/usr/bin/env python3
import os,pwd,subprocess,sys
from pathlib import Path
if os.geteuid()!=0 or len(sys.argv)!=2:raise SystemExit('Run as root with dedicated public key path')
source=Path(__file__).parent
base=Path('/srv/levants-uat-storefront');home=Path('/var/lib/levants-uat-storefront-deploy')
if base.exists() or home.exists():raise SystemExit('Existing storefront infrastructure; refusing overwrite')
key=Path(sys.argv[1]).read_text().strip()
if not key.startswith('ssh-ed25519 ') or '\n' in key:raise SystemExit('Dedicated ed25519 public key required')
subprocess.run(['useradd','--system','--user-group','--no-create-home','--home-dir',str(home),'--shell','/bin/sh','levants-uat-storefront-deploy'],check=True)
base.mkdir(mode=0o755);(base/'releases').mkdir(mode=0o755)
home.mkdir(mode=0o755);(home/'.ssh').mkdir(mode=0o755)
(home/'.ssh/authorized_keys').write_text('restrict,command="/usr/local/sbin/levants-uat-storefront-ssh" '+key+'\n');os.chmod(home/'.ssh/authorized_keys',0o644)
for original,name in [('deploy.py','deploy'),('ssh-entry.py','ssh')]:
 target=Path('/usr/local/sbin/levants-uat-storefront-'+name);target.write_bytes((source/original).read_bytes());os.chmod(target,0o755)
sudoers=Path('/etc/sudoers.d/levants-uat-storefront-deploy');sudoers.write_text('levants-uat-storefront-deploy ALL=(root) NOPASSWD: /usr/local/sbin/levants-uat-storefront-deploy *\n');os.chmod(sudoers,0o440)
subprocess.run(['visudo','-cf',str(sudoers)],check=True)
print('Isolated static UAT deployment provisioned')
