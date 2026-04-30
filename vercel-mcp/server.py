import os
import httpx
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
VERCEL_TOKEN = os.getenv("VERCEL_TOKEN")
TEAM_ID = os.getenv("VERCEL_TEAM_ID")

if not VERCEL_TOKEN:
    print("Warning: VERCEL_TOKEN not found in environment. Tools will fail until set.")

# Initialize FastMCP
mcp = FastMCP("Vercel Management Server")

BASE_URL = "https://api.vercel.com"
HEADERS = {
    "Authorization": f"Bearer {VERCEL_TOKEN}",
    "Content-Type": "application/json"
}

def get_params():
    params = {}
    if TEAM_ID:
        params["teamId"] = TEAM_ID
    return params

@mcp.tool()
async def list_projects(limit: int = 20) -> str:
    """Lists all Vercel projects."""
    async with httpx.AsyncClient() as client:
        params = get_params()
        params["limit"] = limit
        response = await client.get(f"{BASE_URL}/v9/projects", headers=HEADERS, params=params)
        if response.status_code == 200:
            projects = response.json().get("projects", [])
            summary = "\n".join([f"- {p['name']} (ID: {p['id']})" for p in projects])
            return f"Projects found:\n{summary}"
        return f"Error: {response.status_code} - {response.text}"

@mcp.tool()
async def list_deployments(projectId: str, limit: int = 10) -> str:
    """Lists deployments for a specific project."""
    async with httpx.AsyncClient() as client:
        params = get_params()
        params["projectId"] = projectId
        params["limit"] = limit
        response = await client.get(f"{BASE_URL}/v6/deployments", headers=HEADERS, params=params)
        if response.status_code == 200:
            deployments = response.json().get("deployments", [])
            summary = "\n".join([f"- {d['url']} (Status: {d['state']}, Created: {d['createdAt']})" for d in deployments])
            return f"Deployments for {projectId}:\n{summary}"
        return f"Error: {response.status_code} - {response.text}"

@mcp.tool()
async def get_deployment(deploymentId: str) -> str:
    """Retrieves detailed info for a specific deployment."""
    async with httpx.AsyncClient() as client:
        params = get_params()
        response = await client.get(f"{BASE_URL}/v13/deployments/{deploymentId}", headers=HEADERS, params=params)
        if response.status_code == 200:
            return str(response.json())
        return f"Error: {response.status_code} - {response.text}"

@mcp.tool()
async def set_env_variable(projectId: str, key: str, value: str, targets: list = ["production", "preview", "development"]) -> str:
    """Adds or updates an environment variable for a project."""
    async with httpx.AsyncClient() as client:
        params = get_params()
        data = {
            "key": key,
            "value": value,
            "type": "plain",
            "target": targets
        }
        # First check if it exists (optional, but Vercel might have specific logic for updates)
        # For simplicity, we use the 'upsert' style if possible or just create
        response = await client.post(f"{BASE_URL}/v10/projects/{projectId}/env", headers=HEADERS, params=params, json=data)
        if response.status_code == 201:
            return f"Successfully set environment variable '{key}' for project {projectId}."
        return f"Error: {response.status_code} - {response.text}"

if __name__ == "__main__":
    mcp.run()
