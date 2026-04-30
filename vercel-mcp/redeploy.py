import httpx
import os
from dotenv import load_dotenv

load_dotenv('vercel-mcp/.env')
vercel_token = os.getenv('VERCEL_TOKEN')
project_id = "prj_vUpKXhjg7zC1N4EFZToYn6BQ1aGw"
headers = {"Authorization": f"Bearer {vercel_token}"}

# Trigger a deployment for the 'main' branch
print("Triggering redeploy...")
data = {
    "name": "auto-dash-redeploy",
    "gitSource": {
        "type": "github",
        "repoId": "974052309", # I need the repoId. Let's find it or just use the deployment URL.
        "ref": "main"
    }
}
# Actually, it's easier to just POST to /v13/deployments with the project name
r = httpx.post(f"https://api.vercel.com/v13/deployments", headers=headers, json={
    "name": "auto_dash",
    "project": project_id
})

if r.status_code == 200:
    deployment = r.json()
    print(f"Success: Deployment started at {deployment.get('url')}")
else:
    print(f"Error triggering deployment: {r.status_code} - {r.text}")
