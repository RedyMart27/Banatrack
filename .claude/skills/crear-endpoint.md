# Cómo Crear Endpoints - BanaTrack

## Estructura estándar de un endpoint FastAPI

```python
from fastapi import APIRouter, HTTPException
from app.repositories.nombre_repository import NombreRepository
from app.services.nombre_service import NombreService

router = APIRouter(prefix="/nombre", tags=["nombre"])

@router.get("/")
async def obtener_todos():
    """Descripción de qué hace este endpoint."""
    try:
        resultado = NombreRepository.obtener_todos()
        return {"data": resultado, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Reglas
- Siempre usar try/except
- Respuesta siempre con "data" y "status"
- Documentar con docstring en español
- La lógica va en services, no aquí
- El acceso a BD va en repositories, no aquí

## Prefijos de rutas
- `/lotes` → gestión de lotes
- `/embolse` → registros de embolse
- `/cosecha` → registros de cosecha
- `/historial` → consultas históricas
- `/calendario` → info del calendario bananero