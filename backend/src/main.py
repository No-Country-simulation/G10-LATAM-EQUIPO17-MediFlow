from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import triaje_router, storage_router

app = FastAPI(
    title="MediFlow API",
    description="Agente autónomo para triaje, extracción y enrutamiento de documentos clínicos.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(triaje_router)
app.include_router(storage_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "MediFlow",
        "version": "0.1.0",
        "docs": "/docs",
    }
