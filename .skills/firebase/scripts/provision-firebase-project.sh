#!/bin/bash
PROJECT_ID=""
DISPLAY_NAME=""
TARGET_ENV=".env.local"
TARGET_MD="firebase.md"
REGION="us-central1"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -ProjectId|-p) PROJECT_ID="$2"; shift ;;
        -DisplayName|-n) DISPLAY_NAME="$2"; shift ;;
        -TargetEnvFile|-e) TARGET_ENV="$2"; shift ;;
        -TargetMdFile|-m) TARGET_MD="$2"; shift ;;
        -Region|-r) REGION="$2"; shift ;;
    esac
    shift
done

if [ -z "$PROJECT_ID" ]; then
    FOLDER_NAME=$(basename "$PWD" | tr "[:upper:]" "[:lower:]" | sed -E "s/[^a-z0-9]/-/g" | sed -E "s/-+/-/g" | sed -E "s/^-+|-+$//g")
    if [ ${#FOLDER_NAME} -lt 6 ]; then
        FOLDER_NAME="${FOLDER_NAME}-app"
    fi
    PROJECT_ID="${FOLDER_NAME:0:30}"
    PROJECT_ID=$(echo "$PROJECT_ID" | sed -E "s/-+$//g")
fi

PROJECT_ID=$(echo "$PROJECT_ID" | tr "[:upper:]" "[:lower:]" | xargs)

if ! echo "$PROJECT_ID" | grep -Eq "^[a-z][a-z0-9-]{4,28}[a-z0-9]$"; then
    echo "{\"status\":\"error\",\"message\":\"Invalid Project ID format. Must be 6-30 chars, lowercase letters, numbers, or hyphens, starting with a letter and not ending with a hyphen.\"}"
    exit 1
fi

DISPLAY_NAME="${DISPLAY_NAME:-$PROJECT_ID}"

PROJECTS_RAW=$(npx -y firebase-tools@latest projects:list --json 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "{\"status\":\"auth_required\",\"message\":\"Firebase CLI is not authenticated. Please run npx -y firebase-tools@latest login and re-run.\"}"
    exit 1
fi

EXISTS=$(echo "$PROJECTS_RAW" | grep -F "\"$PROJECT_ID\"")
if [ -z "$EXISTS" ]; then
    echo "Creating new Firebase project '$PROJECT_ID'..."
    CREATE_OUT=$(npx -y firebase-tools@latest projects:create "$PROJECT_ID" --display-name "$DISPLAY_NAME" 2>&1)
    if [ $? -ne 0 ]; then
        DEBUG_DETAILS=""
        if [ -f "firebase-debug.log" ]; then
            if grep -q "field \[project_id\] has issue" "firebase-debug.log"; then
                DEBUG_DETAILS=$(grep -oE "field \[project_id\] has issue \[[^]]+\]" "firebase-debug.log" | head -n 1)
            elif grep -q "HTTP Error:" "firebase-debug.log"; then
                DEBUG_DETAILS=$(grep -oE "HTTP Error: [0-9]+, .*" "firebase-debug.log" | head -n 1)
            fi
            rm -f "firebase-debug.log"
        fi

        if echo "$CREATE_OUT $DEBUG_DETAILS" | grep -Ei "already exists|conflict|409" > /dev/null; then
            echo "{\"status\":\"conflict\",\"project_id\":\"$PROJECT_ID\",\"message\":\"Project ID '$PROJECT_ID' is already taken globally on Google Cloud. Because this ID maps directly to your hosting URL (https://$PROJECT_ID.web.app), please select a clean semantic variation or enter a custom alternative.\",\"clean_suggestions\":[\"$PROJECT_ID-app\",\"$PROJECT_ID-web\",\"$PROJECT_ID-hub\",\"$PROJECT_ID-dev\"],\"hosting_preview\":{\"proposed\":\"https://$PROJECT_ID.web.app\",\"alternatives\":[\"https://$PROJECT_ID-app.web.app\",\"https://$PROJECT_ID-web.web.app\",\"https://$PROJECT_ID-hub.web.app\",\"https://$PROJECT_ID-dev.web.app\"]}}"
            exit 1
        elif [ -n "$DEBUG_DETAILS" ]; then
            CLEAN_ERR=$(echo "$DEBUG_DETAILS" | tr -d '"\n\r')
            echo "{\"status\":\"error\",\"message\":\"Failed to create project: $CLEAN_ERR\"}"
            exit 1
        else
            CLEAN_ERR=$(echo "$CREATE_OUT" | tr -d '"\n\r')
            echo "{\"status\":\"error\",\"message\":\"Failed to create project: $CLEAN_ERR\"}"
            exit 1
        fi
    fi
fi

APPS_RAW=$(npx -y firebase-tools@latest apps:list WEB --project "$PROJECT_ID" --json 2>/dev/null)
HAS_APP=$(echo "$APPS_RAW" | grep -F "\"appId\"")
if [ -z "$HAS_APP" ]; then
    echo "Registering Web App '$DISPLAY_NAME Web'..."
    npx -y firebase-tools@latest apps:create WEB "$DISPLAY_NAME Web" --project "$PROJECT_ID" > /dev/null 2>&1
    sleep 2
fi

SDK_RAW=$(npx -y firebase-tools@latest apps:sdkconfig WEB --project "$PROJECT_ID" 2>/dev/null)

python3 -c "
import re, os

raw = '''$SDK_RAW'''
project_id = '$PROJECT_ID'
target_env = '$TARGET_ENV'
target_md = '$TARGET_MD'
region = '$REGION'

def get_match(pat, default=''):
    m = re.search(pat, raw)
    return m.group(1) if m else default

api_key = get_match(r'apiKey:s*["']([^"']+)["']')
auth_domain = get_match(r'authDomain:s*["']([^"']+)["']', f'{project_id}.firebaseapp.com')
storage_bucket = get_match(r'storageBucket:s*["']([^"']+)["']', f'{project_id}.appspot.com')
msg_id = get_match(r'messagingSenderId:s*["']([^"']+)["']')
app_id = get_match(r'appId:s*["']([^"']+)["']')
measurement_id = get_match(r'measurementId:s*["']([^"']+)["']')

env_keys = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': api_key,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': auth_domain,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': project_id,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': storage_bucket,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': msg_id,
    'NEXT_PUBLIC_FIREBASE_APP_ID': app_id,
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': measurement_id
}

env_content = ''
if os.path.exists(target_env):
    with open(target_env, 'r', encoding='utf-8') as f:
        env_content = f.read()

for k, v in env_keys.items():
    if v:
        if re.search(rf'^{k}=.*$', env_content, flags=re.MULTILINE):
            env_content = re.sub(rf'^{k}=.*$', f'{k}={v}', env_content, flags=re.MULTILINE)
        else:
            env_content = env_content.rstrip() + f'\n{k}={v}\n'

with open(target_env, 'w', encoding='utf-8') as f:
    f.write(env_content.strip() + '\n')

with open('.firebaserc', 'w', encoding='utf-8') as f:
    f.write('{\n  \"projects\": {\n    \"default\": \"' + project_id + '\"\n  }\n}\n')

if os.path.exists(target_md):
    with open(target_md, 'r', encoding='utf-8') as f:
        md = f.read()
    md = re.sub(r'^* **Project ID:**.*$', f'* **Project ID:** {project_id}', md, flags=re.MULTILINE)
    md = re.sub(r'^* **Hosting Site ID:**.*$', f'* **Hosting Site ID:** {project_id}', md, flags=re.MULTILINE)
    md = re.sub(r'^* **Default Hosting URL:**.*$', f'* **Default Hosting URL:** https://{project_id}.web.app', md, flags=re.MULTILINE)
    md = re.sub(r'^* **Secondary Hosting URL:**.*$', f'* **Secondary Hosting URL:** https://{project_id}.firebaseapp.com', md, flags=re.MULTILINE)
    md = re.sub(r'^* **Region:**.*$', f'* **Region:** {region}', md, flags=re.MULTILINE)
    with open(target_md, 'w', encoding='utf-8') as f:
        f.write(md)

if not os.path.exists('firebase.json'):
    with open('firebase.json', 'w', encoding='utf-8') as f:
        f.write('{\n  \"hosting\": {\n    \"public\": \"out\",\n    \"ignore\": [\"firebase.json\", \"**/.*\", \"**/node_modules/**\"],\n    \"rewrites\": [{\"source\": \"**\", \"destination\": \"/index.html\"}]\n  }\n}\n')
"

echo "{\"status\":\"success\",\"project_id\":\"$PROJECT_ID\",\"hosting_url_primary\":\"https://$PROJECT_ID.web.app\",\"hosting_url_secondary\":\"https://$PROJECT_ID.firebaseapp.com\",\"target_env\":\"$TARGET_ENV\",\"target_md\":\"$TARGET_MD\"}"
