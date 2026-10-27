import re
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator
from enum import Enum


class Rol(str, Enum):
    PACIENTE = "paciente"
    MEDICO = "medico"
    ADMIN = "admin"


def _validar_fortaleza_password(v: str) -> str:
    if not re.search(r"[A-Z]", v):
        raise ValueError("Debe contener al menos una letra mayuscula")
    if not re.search(r"[a-z]", v):
        raise ValueError("Debe contener al menos una letra minuscula")
    if not re.search(r"\d", v):
        raise ValueError("Debe contener al menos un numero")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-]", v):
        raise ValueError("Debe contener al menos un caracter especial")
    return v


class RegistroRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validar_fortaleza(cls, v: str) -> str:
        return _validar_fortaleza_password(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class CambioRolRequest(BaseModel):
    rol: Rol


class CambioPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str = Field(..., min_length=8, max_length=128)

    @field_validator("password_nueva")
    @classmethod
    def validar_fortaleza(cls, v: str) -> str:
        return _validar_fortaleza_password(v)


class CambioEstadoRequest(BaseModel):
    activo: bool


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
