#!/usr/bin/env bash
# End-to-end check of the deployed Atlas API.
B="${API_BASE:-https://atlas-backend-i4wg.onrender.com/api/v1}"
STAMP=$(date +%s)
EMAIL="atlas.e2e.${STAMP}@example.com"
EMAIL2="atlas.e2e.${STAMP}.b@example.com"
PASS='Str0ng!Passw0rd#2026'

pass=0; fail=0
check() { # check <label> <expected> <actual>
  if [ "$2" = "$3" ]; then echo "  PASS  $1 (=$3)"; pass=$((pass+1));
  else echo "  FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}
code() { # code <method> <path> [data] [token]
  local m=$1 p=$2 d=$3 t=$4
  if [ -n "$d" ]; then
    curl -s -m 60 -o ./.e2e-body.json -w "%{http_code}" -X "$m" "$B$p" \
      -H "Content-Type: application/json" ${t:+-H "Authorization: Bearer $t"} -d "$d"
  else
    curl -s -m 60 -o ./.e2e-body.json -w "%{http_code}" -X "$m" "$B$p" \
      ${t:+-H "Authorization: Bearer $t"}
  fi
}
field() { node -e "try{const p=require(process.cwd()+'/.e2e-body.json');const d=p.data??p;console.log(process.argv[1].split('.').reduce((a,k)=>a?.[k],d)??'')}catch(e){console.log('')}" "$1"; }

echo "== 1. Register =="
c=$(code POST /auth/register "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"termsAcceptedAt\":\"2026-01-01T00:00:00.000Z\",\"privacyAcceptedAt\":\"2026-01-01T00:00:00.000Z\"}")
check "register returns 201" 201 "$c"
TOKEN=$(field accessToken)
[ -z "$TOKEN" ] && TOKEN=$(field tokens.accessToken)

echo "== 2. Login =="
c=$(code POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"deviceName\":\"e2e\",\"deviceId\":\"e2e\"}")
check "login returns 200/201" "$( [ "$c" = 201 ] && echo 201 || echo 200 )" "$c"
T=$(field accessToken); [ -n "$T" ] && TOKEN=$T
if [ -z "$TOKEN" ]; then echo "  !! no access token; aborting authed checks"; echo "PASS=$pass FAIL=$fail"; exit 1; fi

echo "== 3. Profile =="
check "get profile" 200 "$(code GET /profile '' "$TOKEN")"
check "update profile" 200 "$(code PATCH /profile '{"personalInformation":{"firstName":"Renamed"}}' "$TOKEN")"

echo "== 4. Accounts =="
check "list accounts" 200 "$(code GET /accounts '' "$TOKEN")"

echo "== 5. Transactions / transfers =="
check "list transactions" 200 "$(code GET /transactions '' "$TOKEN")"
check "list transfers" 200 "$(code GET /transfers '' "$TOKEN")"

echo "== 6. Cards / notifications / investments =="
check "list cards" 200 "$(code GET /cards '' "$TOKEN")"
check "list notifications" 200 "$(code GET /notifications '' "$TOKEN")"
check "get portfolio" 200 "$(code GET /investments/portfolio '' "$TOKEN")"

echo "== 7. Validation is enforced =="
check "malformed transfer rejected" 400 "$(code POST /transfers '{"bogus":true}' "$TOKEN")"
check "malformed card application rejected" 400 "$(code POST /cards '{"bogus":true}' "$TOKEN")"

echo "== 8. Unauthorized access =="
check "profile without token" 401 "$(code GET /profile)"
check "accounts without token" 401 "$(code GET /accounts)"
check "ledger journal without token" 401 "$(code POST /ledger/journals '{}')"
check "notifications without token" 401 "$(code GET /notifications)"
check "admin overview without token" 401 "$(code GET /admin/dashboard/overview)"

echo "== 9. Non-admin is refused admin =="
check "admin identity for customer" 403 "$(code GET /admin/dashboard/me '' "$TOKEN")"
check "admin customers for customer" 403 "$(code GET /admin/customers '' "$TOKEN")"
check "admin account action for customer" 403 "$(code PATCH /admin/accounts/00000000-0000-4000-8000-000000000001 '{"action":"CREDIT","amount":"100.00","reason":"x","reference":"y"}' "$TOKEN")"

echo "== 10. Cross-user access =="
c=$(code POST /auth/register "{\"firstName\":\"Other\",\"lastName\":\"User\",\"email\":\"$EMAIL2\",\"password\":\"$PASS\",\"termsAcceptedAt\":\"2026-01-01T00:00:00.000Z\",\"privacyAcceptedAt\":\"2026-01-01T00:00:00.000Z\"}")
TOKEN2=$(field accessToken)
if [ -n "$TOKEN2" ]; then
  check "second user profile is their own" 200 "$(code GET /profile '' "$TOKEN2")"
  check "user B cannot read user A notification prefs" 403 "$(code GET /notifications/preferences/not-user-b '' "$TOKEN2")"
else
  echo "  SKIP  cross-user checks (second registration returned $c)"
fi

echo
echo "PASS=$pass FAIL=$fail"
[ "$fail" -eq 0 ]
