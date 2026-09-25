import uuid
from fastapi import APIRouter, HTTPException, status, Depends

from src.security import (
    crear_access_token,
    crear_refresh_token,
    verificar_token,
    hashear_password,
    verificar_password,
    obtener_usuario_actual,
    LoginRequest,
    RegistroRequest,
    TokenResponse,
    TokenPayload,
    UsuarioResponse,
    Rol,
)

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

# almacen en memoria (reemplazar por DB en produccion)
_usuarios: dict[str, dict] = {}


def _seed_admin():
    admin_id = str(uuid.uuid4())
    _usuarios[admin_id] = {
        "id": admin_id,
        "nombre": "Admin MediFlow",
        "email": "admin@mediflow.local",
        "password_hash": hashear_password("Admin1234!"),
        "rol": Rol.ADMIN,
        "activo": True,
    }


_seed_admin()


def _buscar_por_email(email: str) -> dict | None:
    for u in _usuarios.values():
        if u["email"] == email:
            return u
    return None


@router.post("/registro", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(datos: RegistroRequest):
    if _buscar_por_email(datos.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese email",
        )

    user_id = str(uuid.uuid4())
    _usuarios[user_id] = {
        "id": user_id,
        "nombre": datos.nombre,
        "email": datos.email,
        "password_hash": hashear_password(datos.password),
        "rol": datos.rol,
        "activo": True,
    }

    token_data = {"sub": user_id, "rol": datos.rol.value}
    return TokenResponse(
        access_token=crear_access_token(token_data),
        refresh_token=crear_refresh_token(token_data),
    )


@router.post("/login", response_model=TokenResponse)
async def login(datos: LoginRequest):
    usuario = _buscar_por_email(datos.email)

    if not usuario or not verificar_password(datos.password, usuario["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if not usuario["activo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )

    token_data = {"sub": usuario["id"], "rol": usuario["rol"].value}
    return TokenResponse(
        access_token=crear_access_token(token_data),
        refresh_token=crear_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token: str):
    payload = verificar_token(token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalido o expirado",
        )

    user_id = payload["sub"]
    usuario = _usuarios.get(user_id)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    token_data = {"sub": user_id, "rol": usuario["rol"].value}
    return TokenResponse(
        access_token=crear_access_token(token_data),
        refresh_token=crear_refresh_token(token_data),
    )


@router.get("/me", response_model=UsuarioResponse)
async def perfil_actual(usuario: TokenPayload = Depends(obtener_usuario_actual)):
    datos = _usuarios.get(usuario.sub)

    if not datos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return UsuarioResponse(
        id=datos["id"],
        nombre=datos["nombre"],
        email=datos["email"],
        rol=datos["rol"],
        activo=datos["activo"],
    )
