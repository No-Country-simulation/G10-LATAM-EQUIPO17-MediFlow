from pydantic import BaseModel, Field
from enum import Enum


class Rol(str, Enum):
    PACIENTE = "paciente"
    MEDICO = "medico"
    ADMIN = "admin"


class RegistroRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    rol: Rol = Rol.PACIENTE


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    rol: Rol
    exp: int


class UsuarioResponse(BaseModel):
    id: str
    nombre: str
    email: str
    rol: Rol
    activo: bool = True
