from langchain_core.prompts import ChatPromptTemplate

system_prompt_vision = ChatPromptTemplate.from_messages([
        (
            "system",
            """
            Eres un agente especializado en analizar imágenes.

            Analiza todas las imágenes proporcionadas y extrae únicamente
            el contenido que contienen.

            Si existe texto, transcríbelo.
            Si existen tablas, listas o formularios, conserva su información.
            No inventes información.
            No agregues contexto, explicaciones, metadatos ni información
            que no esté presente en las imágenes.

            Devuelve únicamente el contenido de las imágenes.
            """
        ),
    (
        "human",
        [
            {"type": "text", "text": "Transcribe todo el texto de esta imagen."},
            {
                "type": "image_url",
                "image_url": {"url": "data:image/jpeg;base64,{imagen}"},
            }
        ]
    )
])


system_prompt_extrator = ChatPromptTemplate.from_template("""
    Eres un asistente médico experto en triaje clínico.
    Analiza el contenido del siguiente documento y extrae la información estructurada requerida.

    Canal de origen: {canal_origen}
    Tipo de archivo: {tipo_archivo}

    Contenido del documento:
    {documento_texto}
    """)

