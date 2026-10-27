from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")


class RespuestaPaginada(BaseModel, Generic[T]):
    items: list[T]
    total: int
    offset: int
    limit: int
