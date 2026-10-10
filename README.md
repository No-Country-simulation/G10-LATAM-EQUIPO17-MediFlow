# G10-LATAM-EQUIPO17-MediFlow

# MediFlow - Agente Autónomo  para Triaje, Extracción y Enrutamiento de  Documentos Clínicos

## Descripción del Proyecto

MediFlow es una solución de software inteligente diseñada para automatizar el procesamiento de documentos clínicos y administrativos en el sector salud. Implementa un **agente inteligente y autónomo** capaz de recibir documentos en múltiples formatos (PDFs digitalizados, imágenes de estudios/recetas o texto plano), clasificarlos automáticamente, extraer entidades y datos clínicos esenciales con alta precisión y enrutarlos a su destino correspondiente sin intervención manual en los casos estándar.

### **MediFlow Resuelve Desafíos Complejos como:**

* Visión multimodal.
* Extracción estructurada de datos clínicos.
* Lógica de decisión condicional y manejo de casos ambiguos o urgentes (como datos ilegibles,
  prescripciones de alto riesgo o solicitudes de urgencia).

## Arquitectura

El sistema se implementará bajo una Arquitectura RESTful, dividiendo la solución en dos entidades completamente independientes: Cliente (Frontend) y Servidor (Backend). Esta separación garantiza que cada módulo pueda evolucionar, mantenerse y escalar de forma autónoma según las exigencias del entorno.

### **Principios Clave de la Arquitectura:**

* **Especialización del Cliente (Frontend):** Permite construir interfaces de usuario avanzadas, reactivas y amigables, enfocadas en ofrecer la mejor experiencia posible al personal médico y de auditoría.

* **Especialización del Servidor (Backend):** Concentra la lógica de negocio, la orquestación del agente inteligente de IA y la integración con servicios en la nube, exponiendo sus capacidades mediante recursos y endpoints estandarizados.

* **Escalabilidad Independiente:** Al estar desacoplados, es posible escalar el servidor sin afectar el cliente o viceversa.

## Frontend

### Tecnologías

<table>
  <thead>
    <tr>
      <th>Tecnología</th>
      <th>Descripción</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>React 19</strong></td>
      <td>Biblioteca principal utilizada para construir la interfaz de usuario.</td>
    </tr>
    <tr>
      <td><strong>Vite 8</strong></td>
      <td>Herramienta utilizada para el desarrollo y compilación del proyecto frontend.</td>
    </tr>
    <tr>
      <td><strong>JavaScript y JSX</strong></td>
      <td>Lenguaje y sintaxis utilizados para desarrollar los componentes de la aplicación.</td>
    </tr>
    <tr>
      <td><strong>React DOM</strong></td>
      <td>Permite integrar React con el DOM del navegador para renderizar la interfaz.</td>
    </tr>
    <tr>
      <td><strong>Oxlint</strong></td>
      <td>Herramienta de análisis estático utilizada para revisar la calidad y consistencia del código.</td>
    </tr>
  </tbody>
</table>

### Estructura de Carpetas

```text
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

## Backend

### Tecnologías

<table>
  <thead>
    <tr>
      <th>Categoría</th>
      <th>Tecnología</th>
      <th>Descripción</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="6" align="center"><strong>Servidor y configuraciones</strong></td>
      <td><strong>Python</strong></td>
      <td>Lenguaje principal utilizado para desarrollar el backend y la lógica de la aplicación.</td>
    </tr>
    <tr>
      <td><strong>FastAPI</strong></td>
      <td>Framework utilizado para crear la API REST del backend de forma rápida y eficiente.</td>
    </tr>
    <tr>
      <td><strong>Uvicorn</strong></td>
      <td>Servidor ASGI utilizado para ejecutar la aplicación FastAPI.</td>
    </tr>
    <tr>
      <td><strong>Pydantic</strong></td>
      <td>Librería utilizada para validar, estructurar y manejar los datos de la aplicación.</td>
    </tr>
    <tr>
      <td><strong>Pydantic Settings</strong></td>
      <td>Permite gestionar la configuración de la aplicación y las variables de entorno.</td>
    </tr>
    <tr>
      <td><strong>Python Multipart</strong></td>
      <td>Permite recibir y procesar archivos enviados mediante formularios HTTP.</td>
    </tr>
    <tr>
      <td rowspan="2" align="center"><strong>Seguridad y autenticación</strong></td>
      <td><strong>PyJWT</strong></td>
      <td>Implementa JSON Web Tokens (JWT) para la autenticación y autorización de usuarios.</td>
    </tr>
    <tr>
      <td><strong>pwdlib + Argon2</strong></td>
      <td>Se utiliza para proteger las contraseñas mediante hashing seguro con el algoritmo Argon2.</td>
    </tr>
    <tr>
      <td rowspan="3" align="center"><strong>Base de datos</strong></td>
      <td><strong>SQLAlchemy 2.0 (async)</strong></td>
      <td>ORM asíncrono para modelado de entidades y consultas a la base de datos.</td>
    </tr>
    <tr>
      <td><strong>aiosqlite</strong></td>
      <td>Driver asíncrono de SQLite para desarrollo local.</td>
    </tr>
    <tr>
      <td><strong>asyncpg</strong></td>
      <td>Driver asíncrono de PostgreSQL para entornos de producción.</td>
    </tr>
    <tr>
      <td rowspan="7" align="center"><strong>Inteligencia Artificial</strong></td>
      <td><strong>LangChain</strong></td>
      <td>Framework para desarrollar aplicaciones basadas en modelos de lenguaje e integrar herramientas y datos externos.</td>
    </tr>
    <tr>
      <td><strong>LangChain Core</strong></td>
      <td>Proporciona los componentes fundamentales para construir aplicaciones con modelos de lenguaje.</td>
    </tr>
    <tr>
      <td><strong>LangChain Community</strong></td>
      <td>Incluye integraciones con diferentes herramientas, servicios y fuentes de datos.</td>
    </tr>
    <tr>
      <td><strong>LangChain Google GenAI</strong></td>
      <td>Permite integrar modelos de inteligencia artificial de Google Gemini mediante LangChain.</td>
    </tr>
    <tr>
      <td><strong>LangChain Groq</strong></td>
      <td>Permite utilizar modelos de lenguaje ejecutados mediante la infraestructura de Groq.</td>
    </tr>
    <tr>
      <td><strong>LangGraph</strong></td>
      <td>Framework para crear agentes y flujos de trabajo de IA mediante estructuras basadas en grafos.</td>
    </tr>
    <tr>
      <td><strong>Graphviz</strong></td>
      <td>Permite generar y visualizar gráficamente los flujos y estructuras de grafos.</td>
    </tr>
    <tr>
      <td rowspan="2" align="center"><strong>Procesamiento de archivos</strong></td>
      <td><strong>PyMuPDF</strong></td>
      <td>Librería utilizada para leer, extraer texto y procesar documentos PDF.</td>
    </tr>
    <tr>
      <td><strong>Pillow</strong></td>
      <td>Librería utilizada para abrir, manipular y procesar imágenes en diferentes formatos.</td>
    </tr>
    <tr>
      <td align="center"><strong>Cloud</strong></td>
      <td><strong>OCI (Oracle Cloud Infrastructure)</strong></td>
      <td>SDK de Oracle Cloud utilizado para interactuar con servicios de almacenamiento de objetos.</td>
    </tr>
  </tbody>
</table>

### Flujo de Triaje

El pipeline de procesamiento sigue un flujo secuencial orquestado por LangGraph:

```
Documento (PDF/imagen/texto)
        │
        ▼
  Clasificación ──► Tipo de documento + Especialidad + Nivel de prioridad
        │
        ▼
  Extracción ──► Datos del paciente, médico, diagnóstico, CIE-10, medicamentos
        │
        ▼
  Enrutamiento ──► Destino (Cola de emergencia, Farmacia, Auditoría, etc.)
        │
        ▼
  Almacenamiento ──► OCI Object Storage (documento original + resultado JSON)
        │
        ▼
  Registro ──► Base de datos (RegistroTriaje vinculado al usuario)
```

Los documentos con score de confianza bajo el umbral configurado (default: 0.75) son derivados automáticamente a auditoría humana.

### Endpoints de la API

La documentación interactiva (Swagger UI) está disponible en `/docs` cuando el servidor está en ejecución.

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `POST` | `/auth/registro` | Registrar nuevo usuario | Público |
| `POST` | `/auth/login` | Iniciar sesión | Público |
| `POST` | `/auth/refresh` | Renovar tokens | Autenticado |
| `POST` | `/auth/logout` | Cerrar sesión (revoca refresh token) | Autenticado |
| `GET` | `/auth/me` | Perfil del usuario autenticado | Autenticado |
| `GET` | `/auth/usuarios` | Listar todos los usuarios | Admin |
| `PATCH` | `/auth/usuarios/{id}/rol` | Cambiar rol de un usuario | Admin |
| `POST` | `/triaje/` | Procesar triaje de texto | Paciente, Médico, Admin |
| `POST` | `/triaje/archivo` | Procesar triaje desde archivo (PDF, PNG, JPG) | Paciente, Médico, Admin |
| `GET` | `/triaje/registros` | Consultar registros de triaje del usuario | Autenticado |
| `GET` | `/storage/health` | Verificar conexión con OCI | Admin |
| `GET` | `/storage/documentos` | Listar documentos por estado | Médico, Admin |
| `GET` | `/storage/documentos/{bucket}/{ruta}` | Obtener metadata de un documento | Médico, Admin |

### Seguridad

El backend implementa múltiples capas de seguridad orientadas a proteger datos clínicos sensibles:

- **Autenticación JWT** con access token (30 min) y refresh token (7 días), con revocación activa en logout.
- **Hashing de contraseñas** con Argon2, resistente a ataques de fuerza bruta y rainbow tables.
- **Control de acceso por roles** (PACIENTE, MEDICO, ADMIN) aplicado a nivel de endpoint.
- **Rate limiting** por endpoint (SlowAPI) para mitigar abuso y ataques de denegación de servicio.
- **Security headers** en todas las respuestas: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy` y `Strict-Transport-Security` (HSTS) en producción.
- **Validación de entrada** con Pydantic en todos los schemas de request, incluyendo regex y límites de largo.
- **Path traversal protection** en endpoints de storage (rechazo de `..` y rutas absolutas).
- **Validaciones de producción** al inicio del servidor: rechazo de JWT secret por defecto, largo mínimo de 32 caracteres, y prohibición de CORS wildcard (`*`).

### Variables de Entorno

Copiar `backend/.env.example` a `backend/.env` y configurar:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a la base de datos | `sqlite+aiosqlite:///./mediflow.db` |
| `JWT_SECRET_KEY` | Clave secreta para firmar tokens JWT (mín. 32 chars en prod) | `mediflow-dev-secret-cambiar-en-prod` |
| `ALLOWED_ORIGINS` | Orígenes permitidos para CORS, separados por coma | `*` |
| `LLM_API_KEY` | API key de Google Gemini | — |
| `API_KEY_GROQ` | API key de Groq (modelo de visión) | — |
| `OCI_NAMESPACE` | Namespace de OCI Object Storage | — |
| `OCI_COMPARTMENT_ID` | Compartment ID de OCI | — |
| `OCI_REGION` | Región de OCI | `sa-saopaulo-1` |
| `UMBRAL_CONFIANZA_MINIMO` | Score mínimo para aprobar triaje sin auditoría | `0.75` |

### Instalación y Ejecución

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Linux/Mac
pip install -r requirements.txt
cp .env.example .env        # Configurar las variables
uvicorn src.main:app --reload
```

El servidor estará disponible en `http://localhost:8000` y la documentación Swagger en `http://localhost:8000/docs`.

### Estructura de Carpetas

```text
backend/
├── src/
│   ├── core/           # Configuración, base de datos, rate limiting, excepciones
│   ├── models/         # Modelos SQLAlchemy (Usuario, TokenRevocado, RegistroTriaje)
│   ├── repository/     # Patrón Repository para acceso a datos
│   ├── routers/        # Endpoints de la API (auth, triaje, storage)
│   ├── schemas/        # Schemas Pydantic de request/response
│   ├── security/       # JWT, hashing, middleware de autenticación
│   ├── services/       # Lógica de negocio, agente LangGraph, cliente OCI
│   └── main.py         # Punto de entrada de la aplicación
├── requirements.txt
└── .env.example
```

