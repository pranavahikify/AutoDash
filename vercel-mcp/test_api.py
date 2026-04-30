import httpx
import os
from dotenv import load_dotenv

load_dotenv()
token = os.getenv('VERCEL_TOKEN')

print(f"Token present: {bool(token)}")

try:
    r = httpx.get('https://api.vercel.com/v9/projects', headers={'Authorization': f'Bearer {token}'})
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        projects = r.json().get('projects', [])
        print(f"Projects count: {len(projects)}")
        for p in projects:
            print(f"- {p['name']} ({p['id']})")
    else:
        print(f"Error: {r.text}")
except Exception as e:
    print(f"Connection error: {e}")
