"""Exact-plan branch cleanup. Archive unmerged heads before lease-protected deletion."""
import json, os, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

ALLOWED = {'Litwebs/Levants-server', 'Litwebs/Levants-client'}
RESERVED = {'main', 'master', 'uat', 'gh-pages', 'production'}


def decision(branch, expected, open_heads, preserved):
    if branch is None:
        return 'retain', 'already_absent'
    name = branch['name']
    if name.lower() in RESERVED or name in preserved or branch.get('protected'):
        return 'retain', 'protected_or_preserved'
    if name in open_heads:
        return 'retain', 'open_pull_request'
    if branch['commit']['sha'] != expected:
        return 'retain', 'head_changed'
    return 'delete', 'verified_expected_head'


def archive_name(name, sha):
    return 'archive/branch-cleanup-20261025/' + name.replace('/', '--') + '-' + sha[:8]


class GitHub:
    def __init__(self, repo, token):
        if repo not in ALLOWED or not token:
            raise RuntimeError('repository_or_auth_guard')
        self.repo, self.token = repo, token

    def request(self, path, method='GET', data=None, missing=False):
        url = 'https://api.github.com/repos/' + self.repo + '/' + path
        request = urllib.request.Request(url, data=None if data is None else json.dumps(data).encode(), method=method,
            headers={'Authorization': 'Bearer ' + self.token, 'Accept': 'application/vnd.github+json',
                     'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', 'Cache-Control': 'no-cache'})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read()
                return json.loads(body) if body else None
        except urllib.error.HTTPError as error:
            if missing and error.code == 404:
                return None
            raise RuntimeError('github_' + str(error.code) + '_' + method) from None

    def pages(self, path):
        rows = []
        for page in range(1, 20):
            batch = self.request(path + ('&' if '?' in path else '?') + 'per_page=100&page=' + str(page))
            rows.extend(batch)
            if len(batch) < 100:
                return rows
        raise RuntimeError('pagination_guard')

    def branch(self, name):
        return self.request('branches/' + urllib.parse.quote(name, safe=''), missing=True)

    def open_heads(self):
        return {p['head']['ref'] for p in self.pages('pulls?state=open')
                if (p['head'].get('repo') or {}).get('full_name') == self.repo}

    def archive(self, name, sha):
        tag = archive_name(name, sha)
        path = 'git/ref/tags/' + urllib.parse.quote(tag, safe='')
        existing = self.request(path, missing=True)
        if existing is None:
            self.request('git/refs', 'POST', {'ref': 'refs/tags/' + tag, 'sha': sha})
            existing = self.request(path)
        if existing['object']['sha'] != sha:
            raise RuntimeError('archive_reference_guard')
        return tag

    def lease_delete(self, name, sha):
        ref = 'refs/heads/' + name
        result = subprocess.run(['git', 'push', 'origin', ':' + ref, '--force-with-lease=' + ref + ':' + sha],
                                capture_output=True, text=True, timeout=60)
        if result.returncode:
            raise RuntimeError('lease_delete_rejected_' + name)
        for _ in range(3):
            if self.branch(name) is None:
                return
            time.sleep(0.5)
        raise RuntimeError('deletion_verification_guard_' + name)


def main(plan_path):
    plan = json.loads(Path(plan_path).read_text())
    repo = os.environ.get('GITHUB_REPOSITORY')
    if repo != plan['repository']:
        raise RuntimeError('repository_identity_guard')
    api = GitHub(repo, os.environ.get('GH_TOKEN'))
    remote = subprocess.check_output(['git', 'remote', 'get-url', 'origin'], text=True).strip()
    if remote not in {'https://github.com/' + repo, 'https://github.com/' + repo + '.git'}:
        raise RuntimeError('git_remote_guard')
    current_uat = api.branch('uat')
    if current_uat['commit']['sha'] != plan['expected_uat']:
        raise RuntimeError('uat_changed_guard')
    preserved = set(plan['preserve'])
    open_heads = api.open_heads()
    candidates = list(plan['branches'])
    own = os.environ.get('GITHUB_REF_NAME', '')
    own_sha = os.environ.get('GITHUB_SHA', '')
    if own != 'maintenance/branch-cleanup-20261025' or not re.fullmatch('[0-9a-f]{40}', own_sha):
        raise RuntimeError('maintenance_identity_guard')
    candidates.append({'name': own, 'sha': own_sha})  # Self deletion is always last and archived.
    if len({row['name'] for row in candidates}) != len(candidates):
        raise RuntimeError('duplicate_plan_guard')
    prepared = []
    retained = []
    for row in candidates:
        name, sha = row['name'], row['sha']
        if not re.fullmatch('[0-9a-f]{40}', sha):
            raise RuntimeError('commit_identity_guard')
        action, reason = decision(api.branch(name), sha, open_heads, preserved)
        if action == 'retain':
            retained.append({'branch': name, 'reason': reason})
            continue
        compare = api.request('compare/' + sha + '...' + plan['expected_uat'], missing=True)
        ancestor = bool(compare and compare['merge_base_commit']['sha'] == sha)
        prepared.append({**row, 'archive': not ancestor or name == own})
    deleted, archives = [], []
    def checkpoint():
        Path('branch-cleanup-report.json').write_text(json.dumps({'completed': False, 'repository': repo, 'deleted': deleted, 'archives': archives, 'retained': retained}, indent=2) + '\n')
    checkpoint()
    for row in prepared:
        name, sha = row['name'], row['sha']
        action, reason = decision(api.branch(name), sha, api.open_heads(), preserved)
        if action != 'delete':
            retained.append({'branch': name, 'reason': reason})
            continue
        if row['archive']:
            archives.append({'branch': name, 'tag': api.archive(name, sha), 'sha': sha})
            checkpoint()
        api.lease_delete(name, sha)
        deleted.append(name)
        checkpoint()
    remaining = api.pages('branches')
    names = {row['name'] for row in remaining}
    if not {'main', 'uat'}.issubset(names) or any(name in names for name in deleted):
        raise RuntimeError('final_inventory_guard')
    report = {'completed': True, 'repository': repo, 'deleted': deleted, 'archives': archives,
              'retained': retained, 'remaining': sorted(names), 'uatUnchanged': api.branch('uat')['commit']['sha'] == plan['expected_uat']}
    Path('branch-cleanup-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except Exception as error:
        print(json.dumps({'completed': False, 'error': type(error).__name__, 'reason': str(error)[:200]}))
        raise SystemExit(1)
