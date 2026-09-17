# AGENTS.md

Monorepo with two independent apps: `backend/` (FastAPI + LangGraph agent) and `frontend/` (React 19 + Vite). Current branch is `develop`; default remote branch is `main`. No CI, no root-level task runner.

## Backend (`backend/`)

- FastAPI; install deps with `pip install -r requirements.txt` (no lockfile, versions are minimums).
- Run from `backend/`: `uvicorn src.main:app --reload`. Imports are absolute `src.*`, so do NOT run uvicorn from the repo root.
- Config is pydantic-settings reading `.env` (case-insensitive). Copy `.env.example` -> `.env`. `oci_namespace` and `oci_compartment_id` are required with no defaults; storage/health requests fail without a filled `.env`.
- Interactive API docs at `/docs`.
- `POST /triaje/` and `POST /triaje/archivo` are stubs returning 501: the LangGraph agent pipeline is the main unimplemented piece.
- OCI Object Storage is implemented in `src/services/oci_storage.py`. Buckets are chosen by document state via `Settings.get_bucket_por_estado` (`recibido` / `procesado` / `auditoria_humana`). A triage result with `score_confianza < UMBRAL_CONFIANZA_MINIMO` (default 0.75) routes to the auditoría bucket.
- Custom errors live in `src/core/exceptions.py` (Spanish class/message naming); follow that convention.
- No tests or linter configured. Sanity check with `python -c "import src.main"` from `backend/`.

## Frontend (`frontend/`)

- React 19 + Vite 8, plain JS/JSX. It is NOT TypeScript: `main.jsx`/`App.jsx`, despite `@types/*` devDeps and the README referring to `main.tsx`. Do not add `.tsx` without adding TS config.
- `npm install`, then `npm run dev` / `npm run build` / `npm run lint` / `npm run preview`. `lint` is `oxlint` via `.oxlintrc.json`, not ESLint. No test runner is configured.
- No path aliases in `vite.config.js`; use relative imports unless you add aliases yourself.
- Intended structure (currently empty scaffolding, see `frontend/README.md`): `src/modules/<modulo>/{components,pages,services,types}` and `src/shared/{ui,hooks,utils,api,assets}`.

## Estrucutra del Frontend
 ```
 src/
├── app/
├── modules/
│   └── <modulo>/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── types/
├── shared/
│   ├── ui/
│   ├── hooks/
│   ├── utils/
│   ├── api/
│   └── assets/
└── main.tsx 
```
### Reglas de trabajo 
Antes de crear, modificar o mover cualquier archivo, componente, servicio, tipo, utilidad o recurso, se debe revisar la estructura actual del proyecto y determinar correctamente dónde debe ubicarse. El proyecto sigue una organización basada en Screaming Architecture, por lo tanto la lógica y los elementos específicos de una funcionalidad deben permanecer dentro de su módulo correspondiente.

2.  Antes de crear un archivo nuevo, se debe determinar:

Qué responsabilidad tendrá.
A qué módulo pertenece.
Si es exclusivo de un módulo o reutilizable.
Si ya existe una solución equivalente en el proyecto.
Si realmente es necesario crear un archivo nuevo.

No se deben crear carpetas, componentes, hooks, servicios, tipos o utilidades innecesarios.

3. Componentes específicos de un módulo

Si un componente pertenece exclusivamente a una funcionalidad determinada, debe ubicarse dentro de:

modules/<modulo>/components/

Ejemplo:

modules/document-ingestion/components/DocumentUploader.tsx

No se debe mover un componente a shared/ui únicamente porque pueda parecer reutilizable.

Un componente debe considerarse compartido solamente cuando realmente sea utilizado o diseñado para ser utilizado por múltiples módulos.

4. Componentes compartidos

Los componentes visuales reutilizables por distintos módulos deben ubicarse en:

shared/ui/

Ejemplos:

Button
Modal
Input
Card
Badge
Table
Spinner

Antes de crear un nuevo componente compartido, se debe comprobar que no exista uno equivalente.

5. Pages

Las páginas o vistas principales de una funcionalidad deben permanecer dentro de su módulo:

modules/<modulo>/pages/

Las páginas no deben contener lógica innecesariamente compleja.

Cuando la lógica crezca, se debe evaluar correctamente si debe extraerse a servicios, hooks u otras estructuras del módulo.

6. Services

Los servicios específicos de una funcionalidad deben ubicarse dentro de:

modules/<modulo>/services/

Por ejemplo, las funciones relacionadas con la carga de documentos clínicos deben pertenecer al módulo correspondiente y no colocarse en archivos globales sin necesidad.

La configuración general para comunicarse con el backend debe permanecer en:

shared/api/

Los servicios de cada módulo pueden utilizar esta configuración común.

7. Types

Los tipos e interfaces exclusivos de una funcionalidad deben ubicarse en:

modules/<modulo>/types/

No crear tipos globales si solamente son utilizados por un módulo.

Si un tipo empieza a ser realmente utilizado por diferentes módulos, se debe informar antes de reorganizarlo.

8. Hooks

No se debe crear una carpeta hooks/ dentro de todos los módulos por defecto.

Se debe crear:

modules/<modulo>/hooks/

solamente cuando aparezca una necesidad real de extraer lógica React específica del módulo.

Por ejemplo:

lógica con useState,
useEffect,
useMemo,
useCallback,
llamadas y estados reutilizados entre componentes,
lógica de comportamiento que esté haciendo crecer demasiado un componente.

Si un hook es genérico y puede utilizarse en diferentes módulos, debe ubicarse en:

shared/hooks/
9. Assets

Los recursos generales utilizados por diferentes partes de la aplicación deben almacenarse en:

shared/assets/

Por ejemplo:

logotipo,
íconos generales,
imágenes globales,
ilustraciones comunes,
videos compartidos.

Si una imagen, video, icono o recurso pertenece exclusivamente a un módulo, se debe crear:

modules/<modulo>/assets/

y almacenar el recurso dentro de ese módulo.

Regla principal

Antes de realizar cualquier cambio, aplicar siempre la siguiente lógica:

¿Qué se solicita?
        ↓
¿Qué módulo es responsable?
        ↓
¿Ya existe algo reutilizable?
        ↓
¿El recurso es específico o compartido?
        ↓
¿Cuál es el mínimo cambio necesario?
        ↓
Implementar únicamente ese cambio.

El asistente debe actuar como colaborador del proyecto, no como responsable de redefinirlo por iniciativa propia.

Si encuentra oportunidades de mejora fuera del alcance solicitado, debe señalarlas como recomendaciones, pero no implementarlas automáticamente.