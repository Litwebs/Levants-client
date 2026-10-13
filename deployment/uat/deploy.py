#!/usr/bin/env python3
"""Bounded static UAT deployments only; cannot write backend or production."""
import fcntl,hashlib,json,os,re,sys,tarfile,tempfile
from pathlib import Path
BASE=Path('/srv/levants-uat-storefront')
if os.geteuid()!=0 or len(sys.argv)!=2 or not re.fullmatch('[0-9a-f]{40}',sys.argv[1]):raise SystemExit('Expected exact UAT storefront SHA')
sha=sys.argv[1]
lock=open('/run/lock/levants-uat-storefront.lock','w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
with tempfile.TemporaryDirectory(prefix='receive-',dir=BASE) as tmp:
 work=Path(tmp);archive=work/'upload.tar.gz';size=0
 with archive.open('wb') as out:
  while True:
   data=sys.stdin.buffer.read(1024*1024)
   if not data:break
   size+=len(data)
   if size>80*1024*1024:raise SystemExit('Archive too large')
   out.write(data)
 source=work/'site';source.mkdir();seen=set();expanded=0
 with tarfile.open(archive,'r:gz') as bundle:
  members=bundle.getmembers()
  if len(members)>5000:raise SystemExit('Too many files')
  for member in members:
   path=Path(member.name)
   if path.is_absolute() or '..' in path.parts or not path.parts or member.name in seen or not member.isfile():raise SystemExit('Unsafe archive entry')
   if any(part.startswith('.') or part in ['CNAME','node_modules'] for part in path.parts):raise SystemExit('Unsupported file')
   seen.add(member.name);expanded+=member.size
   if expanded>160*1024*1024:raise SystemExit('Expanded archive too large')
   target=source/path;target.parent.mkdir(parents=True,exist_ok=True)
   with bundle.extractfile(member) as stream,target.open('xb') as output:
    while True:
     chunk=stream.read(1024*1024)
     if not chunk:break
     output.write(chunk)
 manifest=json.loads((source/'release.json').read_text())
 if any(manifest.get(k)!=v for k,v in {'sha':sha,'environment':'uat','host':'uat.levantsdairy.co.uk','api':'https://uat-api.levantsdairy.co.uk/api'}.items()):raise SystemExit('Wrong UAT release manifest')
 checksums={str(p.relative_to(source)):hashlib.sha256(p.read_bytes()).hexdigest() for p in source.rglob('*') if p.is_file() and p!=source/'release.json'}
 if checksums!=manifest['files'] or 'index.html' not in checksums:raise SystemExit('Artifact checksum mismatch')
 for p in source.rglob('*'):
  if p.is_file() and p.suffix in ['.js','.html','.json','.txt']:
   content=p.read_text()
   if re.search(r'https://api\.levantsdairy\.co\.uk|https://admin\.litwebs\.co\.uk/api/websites/status|sk_(?:live|test)_|whsec_',content):raise SystemExit('Production endpoint or secret in UAT artifact')
 destination=BASE/'releases'/sha
 if destination.exists():
  if (BASE/'current').resolve()==destination and (destination/'release.json').read_text()==(source/'release.json').read_text():
   print('UAT storefront already current: '+sha);raise SystemExit(0)
  raise SystemExit('Immutable release already exists')
 for p in source.rglob('*'):os.chmod(p,0o755 if p.is_dir() else 0o644)
 os.chmod(source,0o755);os.rename(source,destination)
 link=BASE/'current.next'
 if link.is_symlink():link.unlink()
 link.symlink_to('releases/'+sha);os.replace(link,BASE/'current')
 print('UAT storefront deployed: '+sha)
