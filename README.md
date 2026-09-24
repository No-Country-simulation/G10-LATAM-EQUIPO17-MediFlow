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
  <td>SDK de Oracle Cloud utilizado para interactuar con servicios y recursos de Oracle Cloud.</td>
</tr>

  </tbody>

</table>

  ### Estructura de Carpetas:

```text

backend/
|___src/
|    |___core/
|    |___models
|    |___routers/
|    |___schemas/
|    |___security/
|    |___services/
|    |___main.py
|___requirements.txt
|___.env.example

```

