from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routes import lotes, embolse, cosecha, dashboard

# Crea las tablas en la base de datos si no existen
models.Lote.metadata.create_all(bind=engine)

app = FastAPI(
    title="BanaTrack API",
    description="Sistema de gestión de cosecha bananera",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lotes.router)
app.include_router(embolse.router)
app.include_router(cosecha.router)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    """Endpoint raíz para verificar que el servidor está corriendo."""
    return {"mensaje": "BanaTrack API funcionando", "status": "ok"}