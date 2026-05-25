from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="BanaTrack API",
    description="Sistema de gestión de cosecha bananera",
    version="1.0.0"
)

# Permitir que el frontend se conecte al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint raíz para verificar que el servidor está corriendo."""
    return {"mensaje": "BanaTrack API funcionando", "status": "ok"}