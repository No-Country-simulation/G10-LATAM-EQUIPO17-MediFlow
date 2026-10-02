import os

from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph

from src.schemas.documento import SolicitudTriaje, RespuestaTriaje
from src.schemas.agent_schemas import StatusTriaje
from src.services.agent import (
    extraer_texto_multiformato,
    extraer_datos_triaje,
    enrutar_triaje,
    get_es_texto,
)

_graph_instance: CompiledStateGraph | None = None


def create_graph() -> CompiledStateGraph:
    workflow = StateGraph(StatusTriaje)

    workflow.add_node("nodo_extrator_multiformato", extraer_texto_multiformato)
    workflow.add_node("nodo_extrator_triaje", extraer_datos_triaje)
    workflow.add_node("nodo_enrutador_triaje", enrutar_triaje)

    workflow.add_conditional_edges(
        START,
        get_es_texto,
        {True: "nodo_extrator_triaje", False: "nodo_extrator_multiformato"},
    )
    workflow.add_edge("nodo_extrator_multiformato", "nodo_extrator_triaje")
    workflow.add_edge("nodo_extrator_triaje", "nodo_enrutador_triaje")
    workflow.add_edge("nodo_enrutador_triaje", END)

    return workflow.compile()


def get_graph() -> CompiledStateGraph:
    global _graph_instance
    if _graph_instance is None:
        _graph_instance = create_graph()
    return _graph_instance


async def procesar_solicitud_triaje(
    solicitud: SolicitudTriaje,
    es_texto: bool,
    archivo_bytes: bytes | None = None,
    nombre_archivo: str | None = None,
) -> RespuestaTriaje:
    graph = get_graph()

    respuesta = await graph.ainvoke({
        "solicitud": solicitud,
        "archivo_bytes": archivo_bytes,
        "nombre_archivo": nombre_archivo,
        "es_texto": es_texto,
    })

    return RespuestaTriaje(
        documento_id=respuesta["solicitud"].documento_id,
        clasificacion=respuesta["clasificacion"],
        datos_extraidos=respuesta["datos_extraidos"],
        decision_enrutamiento=respuesta["decision_enrutamiento"],
        almacenamiento_oci=respuesta["almacenamiento_oci"],
    )


def generar_visualizacion(graph: CompiledStateGraph):
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        assets_dir = os.path.join(base_dir, "assets")
        os.makedirs(assets_dir, exist_ok=True)

        ruta = os.path.join(assets_dir, "grafo_flujo.png")
        png_data = graph.get_graph().draw_mermaid_png()
        with open(ruta, "wb") as f:
            f.write(png_data)
    except Exception:
        pass
