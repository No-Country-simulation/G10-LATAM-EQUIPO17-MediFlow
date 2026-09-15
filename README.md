# G10-LATAM-EQUIPO17-MediFlow

# MediFlow - Agente Autónomo  para Triaje, Extracción y Enrutamiento de  Documentos Clínicos

## Descripción del Proyecto

MediFlow es una solución de software inteligente diseñada para automatizar el procesamiento de documentos clínicos y administrativos en el sector salud. Implementa un **agente inteligente y autónomo** capaz de recibir documentos en múltiples formatos (PDFs digitalizados, imágenes de estudios/recetas o texto plano), clasificarlos automáticamente, extraer entidades y datos clínicos esenciales con alta precisión y enrutarlos a su destino correspondiente sin intervención manual en los casos estándar.

### **MediFlow Resuelve Desafíos Complejos como:**

- Visión multimodal.
- Extracción estructurada de datos clínicos.
- Lógica de decisión condicional y manejo de casos ambiguos o urgentes (como datos ilegibles, 
prescripciones de alto riesgo o solicitudes de urgencia).


## Arquitectura

El sistema se implementará bajo una Arquitectura RESTful, dividiendo la solución en dos entidades completamente independientes: Cliente (Frontend) y Servidor (Backend). Esta separación garantiza que cada módulo pueda evolucionar, mantenerse y escalar de forma autónoma según las exigencias del entorno.

### **Principios Clave de la Arquitectura:** 

- **Especialización del Cliente (Frontend):** Permite construir interfaces de usuario avanzadas, reactivas y amigables, enfocadas en ofrecer la mejor experiencia posible al personal médico y de auditoría.

- **Especialización del Servidor (Backend):** Concentra la lógica de negocio, la orquestación del agente inteligente de IA y la integración con servicios en la nube, exponiendo sus capacidades mediante recursos y endpoints estandarizados.

- **Escalabilidad Independiente:** Al estar desacoplados, es posible escalar el servidor sin afectar el cliente o viceversa.

## Frontend

## Backend

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
