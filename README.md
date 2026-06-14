
# BanaTrack

Sistema de gestión de cosecha bananera diseñado para supervisores de fincas. Permite registrar, monitorear y analizar el ciclo completo de producción —desde el embolse hasta la cosecha— con alertas de recobro en tiempo real y proyección de inventario.

## Problema

En las fincas bananeras, el control de la producción se lleva con registros en papel, hojas de cálculo dispersas o sistemas genéricos que no contemplan la lógica del cultivo: calendarios de color por semana, cálculo de descuento y recobro, y alertas tempranas por bajo rendimiento. Esto genera rezago en la información, errores humanos y decisiones tardías.

BanaTrack resuelve esto con una herramienta vertical, offline-capable y construida específicamente para el negocio bananero.

## Stack Tecnológico

| Capa        | Tecnología                                                                 |
|-------------|----------------------------------------------------------------------------|
| Backend     | Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2                          |
| Base de datos | SQLite                                                                |
| Frontend    | HTML5, CSS3, JavaScript vanilla (ES2024)                                   |
| PWA         | Service Worker + Manifest para uso offline en campo                        |
| Infra       | Docker, Uvicorn                                                            |

## Arquitectura

El backend sigue una arquitectura en capas con **MVC** y **Repository Pattern**, garantizando separación de responsabilidades, testabilidad y mantenibilidad:

```
┌─────────────┐
│   Routes    │  ← Capa de presentación (API REST / Pydantic schemas)
├─────────────┤
│  Services   │  ← Lógica de negocio (reglas de recobro, calendario de color)
├─────────────┤
│ Repositories│  ← Abstracción de acceso a datos (CRUD genérico con SQLAlchemy)
├─────────────┤
│   Models    │  ← Definición del esquema ORM (Lote, Embolse, Cosecha)
└─────────────┘
```

- **Routes**: Define los endpoints REST y utiliza Pydantic para validación de entrada/salida.
- **Services**: Contiene la lógica de negocio (cálculo de color de cinta por semana, descuento, recobro, alertas).
- **Repositories**: Capa de persistencia con un `BaseRepository[T]` genérico que implementa CRUD base.
- **Models**: Modelos SQLAlchemy que reflejan las tablas de la base de datos.

### Patrón Repository Genérico

```python
class BaseRepository(Generic[ModelType]):
    def crear(self, **kwargs) -> ModelType ...
    def obtener_datos(self) -> list[ModelType] ...
    def obtener_por_id(self, id: int) -> ModelType | None ...
    def actualizar(self, id: int, **kwargs) -> ModelType | None ...
    def eliminar(self, id: int) -> bool ...
```

Cada entidad extiende esta base sin repetir código:

```python
class LoteRepository(BaseRepository[Lote]):
    def __init__(self, db: Session):
        super().__init__(db, Lote)
```

## Funcionalidades

- **Gestión de lotes**: Creación y listado de lotes con supervisor asignado.
- **Registro de embolse**: Ingreso de racimos embolsados por lote y fecha. El color de cinta se asigna automáticamente según un calendario semanal predefinido (52 semanas, 8 colores rotativos).
- **Registro de cosecha**: Ingreso de racimos cosechados, con selector de colores disponibles según la ventana de cosecha (semanas 10–12 posteriores al embolse).
- **Dashboard diario**: Resumen del día con color de embolse actual, colores de cosecha disponibles, y detalle por lote.
- **Alertas de recobro**: Detecta lotes con recobro inferior al 85% y los clasifica en *advertencia* o *crítico* (<75%).
- **Inventario proyectado**: Proyección a 4 semanas de los racimos disponibles para cosecha.
- **Edición y eliminación**: CRUD completo con modales para actualizar registros.
- **Interfaz responsive**: Diseño limpio adaptable a dispositivos móviles para uso en campo.

## Estructura del Proyecto

```
banatrack/
├── backend/
│   ├── app/
│   │   ├── main.py                 # Punto de entrada FastAPI
│   │   ├── database.py             # Configuración SQLAlchemy + engine SQLite
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── lote.py             # Modelo Lote
│   │   │   ├── embolse.py          # Modelo Embolse
│   │   │   └── cosecha.py          # Modelo Cosecha
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # BaseRepository genérico
│   │   │   ├── lote.py
│   │   │   ├── embolse.py
│   │   │   └── cosecha.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── lote.py
│   │   │   ├── embolse.py          # Lógica de calendario de color
│   │   │   ├── cosecha.py          # Cálculo de descuento y recobro
│   │   │   └── dashboard.py        # Resúmenes y alertas
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── lotes.py
│   │       ├── embolse.py
│   │       ├── cosecha.py
│   │       └── dashboard.py
│   ├── scripts/
│   │   ├── cargar_lotes.py
│   │   └── corregir_supervisor.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Instalación y Ejecución

### Requisitos

- Python 3.13+
- pip

### Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/banatrack.git
cd banatrack

# Crear y activar entorno virtual
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate       # Linux / macOS

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor se inicia en `http://localhost:8000`. La documentación interactiva de la API está disponible en:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend

Abre `frontend/index.html` en tu navegador. La app consume la API en `http://127.0.0.1:8000`.

## Endpoints de la API

### Lotes

| Método | Ruta              | Descripción                          |
|--------|-------------------|--------------------------------------|
| POST   | `/lotes`          | Crear un nuevo lote                  |
| GET    | `/lotes`          | Listar todos los lotes               |
| GET    | `/lotes/{id}`     | Obtener un lote por ID               |

```bash
curl -X POST http://localhost:8000/lotes \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Lote A-1", "supervisor": "Carlos Pérez"}'
```

### Embolse

| Método | Ruta                | Descripción                           |
|--------|----------------------|---------------------------------------|
| POST   | `/embolse`           | Registrar un embolse                  |
| PUT    | `/embolse/{id}`      | Actualizar un embolse                 |
| DELETE | `/embolse/{id}`      | Eliminar un embolse                   |
| GET    | `/embolse/{lote_id}` | Listar embolses de un lote            |

```bash
curl -X POST http://localhost:8000/embolse \
  -H "Content-Type: application/json" \
  -d '{"lote_id": 1, "fecha": "2026-06-13", "cantidad": 150}'
```

### Cosecha

| Método | Ruta                          | Descripción                               |
|--------|-------------------------------|-------------------------------------------|
| POST   | `/cosecha`                    | Registrar una cosecha                     |
| PUT    | `/cosecha/{id}`               | Actualizar una cosecha                    |
| DELETE | `/cosecha/{id}`               | Eliminar una cosecha                      |
| GET    | `/cosecha/{lote_id}`          | Listar cosechas de un lote                |
| GET    | `/cosecha/colores-disponibles`| Obtener colores válidos para una fecha    |
| GET    | `/cosecha/{lote_id}/descuento`| Calcular descuento del día                |
| GET    | `/cosecha/{lote_id}/recobro`  | Calcular porcentaje de recobro            |

```bash
curl -X POST http://localhost:8000/cosecha \
  -H "Content-Type: application/json" \
  -d '{"lote_id": 1, "fecha": "2026-06-13", "cantidad": 120, "color_cinta": "AZ"}'
```

### Dashboard

| Método | Ruta                  | Descripción                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/dashboard/hoy`      | Resumen del día                          |
| GET    | `/dashboard/inventario`| Proyección de inventario a 4 semanas     |
| GET    | `/dashboard/alertas`  | Alertas de recobro bajo                  |

```bash
curl http://localhost:8000/dashboard/hoy
```

## Capturas de Pantalla

| Vista              | Imagen                              |
|--------------------|-------------------------------------|
| Dashboard - Inicio |  <img width="726" height="966" alt="Screenshot 2026-06-13 183814" src="https://github.com/user-attachments/assets/c9bc2aff-364d-41a7-b9bf-5efe89dc9689" /> |
| Gestión de Lotes   | <img width="1096" height="947" alt="Screenshot 2026-06-13 184008" src="https://github.com/user-attachments/assets/c835f1f2-3cb7-4c1c-abf7-3875598db57a" /> |
| Registro Embolse   | <img width="1187" height="742" alt="Screenshot 2026-06-13 184056" src="https://github.com/user-attachments/assets/ec57dc4e-8db3-4288-b57e-4724b0925f95" /> |
| Registro Cosecha   | <img width="1187" height="742" alt="Screenshot 2026-06-13 184056" src="https://github.com/user-attachments/assets/ec57dc4e-8db3-4288-b57e-4724b0925f95" /> |
| Alertas            | <img width="1146" height="895" alt="Screenshot 2026-06-13 184115" src="https://github.com/user-attachments/assets/fd59488b-aa99-47a3-a35b-7b12face39c5" /> |

## Estado del Proyecto

**v1.0.0** — Funcionalidad core completa para operación en finca.

### Próximas funcionalidades

- Autenticación de usuarios y roles (supervisor, administrador)
- Exportación de reportes en PDF/Excel
- Sincronización offline con IndexedDB
- Notificaciones push para alertas de recobro
- Panel de analytics con gráficos históricos
- Despliegue automatizado con Docker Compose completo

## Autor

**Bleyder** — Estudiante de Ingeniería de Software con enfoque en desarrollo backend. Este proyecto fue construido para resolver un problema real de gestión agrícola, aplicando patrones de diseño como Repository Pattern y MVC, desarrollo de APIs REST con FastAPI, manejo de bases de datos con SQLAlchemy, y arquitectura en capas.

---
