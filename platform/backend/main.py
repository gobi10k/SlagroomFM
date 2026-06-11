from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .database import init_db
from .routes import auth, library, uploads, gigs, profiles

app = FastAPI(title="SlagroomFM Platform API", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(auth.router,     prefix="/auth",    tags=["auth"])
app.include_router(library.router,  prefix="/library", tags=["library"])
app.include_router(uploads.router,  prefix="/uploads", tags=["uploads"])
app.include_router(gigs.router,     prefix="/gigs",    tags=["gigs"])
app.include_router(profiles.router, prefix="/profiles",tags=["profiles"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
