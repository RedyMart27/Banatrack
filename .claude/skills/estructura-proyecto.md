# Estructura del Proyecto BanaTrack

## Stack tecnológico
- **Backend**: Python con FastAPI
- **Base de datos**: SQLite (archivo local, funciona offline)
- **Frontend**: HTML, CSS, JavaScript vanilla (PWA)
- **Contenedor**: Docker
- **Control de versiones**: Git + GitHub

## Arquitectura: MVC + Repository Pattern
- **Models**: Clases que representan las tablas de la base de datos
- **Repositories**: Todo el acceso a datos va aquí, nunca directo en las rutas
- **Services**: Lógica de negocio (cálculos de descuento, recobro, calendario)
- **Routes**: Endpoints de la API REST, solo reciben y responden

## Carpetas
- `backend/app/models/` → modelos de base de datos
- `backend/app/repositories/` → acceso a datos
- `backend/app/services/` → lógica de negocio
- `backend/app/routes/` → endpoints API
- `frontend/` → interfaz web PWA

## Convenciones
- Commits en español con prefijo: feat:, fix:, docs:, refactor:
- Nombres de archivos en snake_case
- Clases en PascalCase
- Variables y funciones en snake_case
- Siempre documentar funciones con docstrings en español