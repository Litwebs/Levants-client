#!/usr/bin/env python3
import hashlib,io,json,subprocess,sys,tarfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
if subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=root,text=True).strip():raise SystemExit('Commit tracked source before packaging')
files=sorted(p for p in (root/'dist').rglob('*') if p.is_file())
if not files or not (root/'dist/index.html').is_file() or (root/'dist/CNAME').exists():raise SystemExit('Verified UAT build required')
manifest={'sha':sha,'environment':'uat','host':'uat.levantsdairy.co.uk','api':'https://uat-api.levantsdairy.co.uk/api','files':{str(p.relative_to(root/'dist')):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
with tarfile.open(sys.argv[1],'w:gz') as archive:
 for p in files:
  if p.is_symlink():raise SystemExit('No symlinks')
  archive.add(p,arcname=str(p.relative_to(root/'dist')),recursive=False)
 data=json.dumps(manifest,sort_keys=True).encode();entry=tarfile.TarInfo('release.json');entry.size=len(data);entry.mode=0o644;archive.addfile(entry,io.BytesIO(data))
print('Packaged UAT storefront '+sha)
