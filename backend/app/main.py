import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import campaigns, leads

app = FastAPI(title="AutoPitch API")

default_origins = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [
    origin.strip()
    for origin in os.environ.get("FRONTEND_URL", default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router)
app.include_router(leads.router)


@app.get("/health")
def health():
    return {"status": "ok"}
