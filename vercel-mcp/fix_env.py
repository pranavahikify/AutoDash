import httpx
import os
from dotenv import load_dotenv

load_dotenv('vercel-mcp/.env')
vercel_token = os.getenv('VERCEL_TOKEN')

env_vars = {
    "VITE_SUPABASE_URL": "https://lkmvvtfdfdjvtiivmfgu.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrbXZ2dGZkZmRqdnRpaXZtZmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzI0MzMsImV4cCI6MjA5MzA0ODQzM30.qFUxPVrbYV7eEXPqaZqc24vr_Jbi2AHztPuCmPWfpRc"
}

project_id = "prj_vUpKXhjg7zC1N4EFZToYn6BQ1aGw"
base_url = "https://api.vercel.com"
headers = {"Authorization": f"Bearer {vercel_token}"}

def set_env(key, value):
    print(f"Setting {key}...")
    data = {
        "key": key,
        "value": value,
        "type": "plain",
        "target": ["production", "preview", "development"]
    }
    r = httpx.post(f"{base_url}/v10/projects/{project_id}/env", headers=headers, json=data)
    if r.status_code in [200, 201]:
        print(f"Success: Set {key}")
    else:
        print(f"Error setting {key}: {r.status_code} - {r.text}")

for k, v in env_vars.items():
    set_env(k, v)

print("Done!")
