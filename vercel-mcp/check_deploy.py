import httpx
import os
from dotenv import load_dotenv

load_dotenv('vercel-mcp/.env')
token = os.getenv('VERCEL_TOKEN')
headers = {"Authorization": f"Bearer {token}"}

def check_latest():
    r = httpx.get('https://api.vercel.com/v6/deployments?projectId=prj_vUpKXhjg7zC1N4EFZToYn6BQ1aGw&limit=1', headers=headers)
    deployment = r.json()['deployments'][0]
    print(f"Deployment UID: {deployment['uid']}")
    print(f"State: {deployment['state']}")
    print(f"URL: {deployment['url']}")

check_latest()
