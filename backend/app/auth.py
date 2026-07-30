import os

import requests
from fastapi import Header, HTTPException


def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_anon_key = os.environ["SUPABASE_ANON_KEY"]

    resp = requests.get(
        f"{supabase_url}/auth/v1/user",
        headers={"apikey": supabase_anon_key, "Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return resp.json()
