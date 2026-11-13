#!/usr/bin/env bash
# Run on the owner's Mac after reviewing this script. It never enables billing.
set -euo pipefail
cd "$(dirname "$0")/.."
ASOBEAT_PROJECT="${1:-asobeat-bagless-ranking}"
ASOBEAT_LOCATION="${2:-asia-northeast1}"
ASOBEAT_TMP="$(mktemp -d)"
trap 'rm -rf "$ASOBEAT_TMP"' EXIT
fb(){ npx -y firebase-tools@latest "$@"; }
fb login
fb projects:list --json > "$ASOBEAT_TMP/projects.json"
if ! node -e 'const j=require(process.argv[1]);process.exit((j.result||[]).some(p=>p.projectId===process.argv[2])?0:1)' "$ASOBEAT_TMP/projects.json" "$ASOBEAT_PROJECT"; then
  fb projects:create "$ASOBEAT_PROJECT" --display-name "ASOBEAT Bagless Ranking"
else
  node -e 'const j=require(process.argv[1]);const p=j.result.find(x=>x.projectId===process.argv[2]);if(p.displayName!=="ASOBEAT Bagless Ranking")throw Error("Use a dedicated new project ID; other game projects will not be modified")' "$ASOBEAT_TMP/projects.json" "$ASOBEAT_PROJECT"
fi
fb apps:list WEB --project "$ASOBEAT_PROJECT" --json > "$ASOBEAT_TMP/apps.json"
ASOBEAT_APP_ID="$(node -e 'const j=require(process.argv[1]);console.log(j.result?.[0]?.appId||"")' "$ASOBEAT_TMP/apps.json")"
if [ -z "$ASOBEAT_APP_ID" ]; then
  fb apps:create WEB "ASOBEAT Bagless Ranking Web" --project "$ASOBEAT_PROJECT"
  fb apps:list WEB --project "$ASOBEAT_PROJECT" --json > "$ASOBEAT_TMP/apps.json"
  ASOBEAT_APP_ID="$(node -e 'const j=require(process.argv[1]);console.log(j.result?.[0]?.appId||"")' "$ASOBEAT_TMP/apps.json")"
fi
# The CLI enables Firestore API and creates (default) from this explicit config.
# Do not rely on its implicit nam5 location or enable paid backups/PITR.
node - "$ASOBEAT_TMP/firebase.json" "$ASOBEAT_LOCATION" <<'JS'
const fs=require('fs'),path=require('path'),config=JSON.parse(fs.readFileSync('firebase.json','utf8'));
config.firestore={...config.firestore,database:'(default)',edition:'standard',location:process.argv[3],rules:path.resolve('firestore.rules'),indexes:path.resolve('firestore.indexes.json')};
fs.writeFileSync(process.argv[2],JSON.stringify(config,null,2));
JS
fb deploy --only auth,firestore:rules,firestore:indexes --project "$ASOBEAT_PROJECT" --config "$ASOBEAT_TMP/firebase.json"
fb firestore:databases:get '(default)' --project "$ASOBEAT_PROJECT" --json > "$ASOBEAT_TMP/database.json"
node -e 'const d=require(process.argv[1]).result;if(d?.databaseEdition!=="STANDARD")throw Error("Expected Standard edition; do not activate this config")' "$ASOBEAT_TMP/database.json"
fb apps:sdkconfig WEB "$ASOBEAT_APP_ID" --project "$ASOBEAT_PROJECT" --json > "$ASOBEAT_TMP/sdk.json"
node - "$ASOBEAT_TMP/sdk.json" <<'JS'
const fs=require('fs'),j=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const c=j.result?.sdkConfig;if(!c?.apiKey||!c?.projectId||!c?.appId)throw Error('Firebase Web config is missing');
const config={apiKey:c.apiKey,authDomain:c.authDomain,projectId:c.projectId,appId:c.appId};
if(!config.authDomain)config.authDomain=c.projectId+'.firebaseapp.com';
const text='// Public Firebase Web settings; no admin credentials.\nwindow.BagRankingConfig = Object.freeze('+JSON.stringify(config,null,2)+');\n';
fs.writeFileSync('js/ranking-config.js',text);
console.log('\nSETUP COMPLETE — public Web config follows (not a login token):\n'+text);
console.log('Send the above config to update GitHub Pages. Do not send credentials or service-account keys.');
JS
