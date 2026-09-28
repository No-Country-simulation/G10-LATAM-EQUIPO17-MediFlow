from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from enum import Enum


class Rol(str, Enum):
    PACIENTE = "paciente"
    MEDICO = "medico"
    ADMIN = "admin"


class RegistroRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., max_length=100)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class CambioRolRequest(BaseModel):
    rol: Rol


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
    created_at: datetime | None = None
    last_login: datetime | None = None
