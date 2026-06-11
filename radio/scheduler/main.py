from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .database import init_db
from .routes import slots, schedule, now, player, admin

app = FastAPI(title="SlagroomFM Radio Scheduler", root_path="/radio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(slots.router,    prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(now.router,      prefix="/api")
app.include_router(player.router,   prefix="/api")
app.include_router(admin.router,    prefix="/api")

# Serve the radio SPA at /radio (everything not under /api)
app.mount("/", StaticFiles(directory="/srv/app/radio/scheduler/static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8002, reload=False)
