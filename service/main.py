from fastapi import FastAPI
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests

load_dotenv()
CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "🔐 GitHub OAuth Backend is running."}

@app.get("/login")
def login():
    redirect_uri = "http://127.0.0.1:8000/callback"
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=notifications"
    )
    return RedirectResponse(github_auth_url)

@app.get("/callback")
def callback(code: str):
    token_url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
    }

    try:
        res = requests.post(token_url, headers=headers, data=payload)
        res.raise_for_status()
        token_data = res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return JSONResponse(content={"error": "Token not received"}, status_code=400)

        return JSONResponse(content={"token": access_token}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
