from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import campaigns, leads

app = FastAPI(title="AutoPitch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router)
app.include_router(leads.router)


@app.get("/health")
def health():
    return {"status": "ok"}
