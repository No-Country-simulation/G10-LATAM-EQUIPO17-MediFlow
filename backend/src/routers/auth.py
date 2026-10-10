from fastapi import APIRouter, Request, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.auth_service import AuthService
from src.repository.user_repository import UserRepository
from src.repository.token_revocado_repository import TokenRevocadoRepository

from src.core.database import get_db
from src.core.rate_limit import limiter
from src.security import (
    obtener_usuario_actual,
    requiere_rol,
    LoginRequest,
    RegistroRequest,
    RefreshRequest,
    LogoutRequest,
    CambioRolRequest,
    TokenResponse,
    TokenPayload,
    UsuarioResponse,
    Rol,
)


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    user_repo = UserRepository(db)
    token_revocado_repo = TokenRevocadoRepository(db)
    return AuthService(user_repo, token_revocado_repo)


router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post(
    "/registro",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    description="Crea una cuenta con rol PACIENTE por defecto y retorna los tokens de acceso.",
    responses={
        201: {"description": "Usuario creado exitosamente"},
        400: {"description": "Email ya registrado o datos invalidos"},
        429: {"description": "Limite de solicitudes excedido (3/min)"},
    },
)
@limiter.limit("3/minute")
async def registrar_usuario(request: Request, datos: RegistroRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.registrar_usuario(datos)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesion",
    description="Autentica al usuario con email y password, retorna access y refresh token.",
    responses={
        200: {"description": "Login exitoso"},
        401: {"description": "Credenciales invalidas"},
        429: {"description": "Limite de solicitudes excedido (5/min)"},
    },
)
@limiter.limit("5/minute")
async def login(request: Request, datos: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.login(datos)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renovar tokens",
    description="Genera un nuevo par de tokens a partir de un refresh token valido.",
    responses={
        200: {"description": "Tokens renovados"},
        401: {"description": "Refresh token invalido, expirado o revocado"},
        429: {"description": "Limite de solicitudes excedido (10/min)"},
    },
)
@limiter.limit("10/minute")
async def refresh_token(request: Request, datos: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.refresh_token(datos)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Cerrar sesion",
    description="Revoca el refresh token para invalidar la sesion activa.",
    responses={
        200: {"description": "Sesion cerrada correctamente"},
        401: {"description": "Token invalido"},
    },
)
async def logout(datos: LogoutRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.logout(datos)


@router.get(
    "/me",
    response_model=UsuarioResponse,
    summary="Perfil del usuario autenticado",
    description="Retorna los datos del usuario asociado al access token actual.",
    responses={
        200: {"description": "Datos del usuario"},
        401: {"description": "Token invalido o expirado"},
    },
)
async def perfil_actual(
    usuario: TokenPayload = Depends(obtener_usuario_actual),
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.obtener_usuario(usuario.sub)


@router.get(
    "/usuarios",
    response_model=list[UsuarioResponse],
    summary="Listar todos los usuarios",
    description="Retorna la lista completa de usuarios registrados. Solo accesible para ADMIN.",
    responses={
        200: {"description": "Lista de usuarios"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — solo ADMIN"},
        429: {"description": "Limite de solicitudes excedido (10/min)"},
    },
)
@limiter.limit("10/minute")
async def listar_usuarios(
    request: Request,
    usuario: TokenPayload = Depends(requiere_rol(Rol.ADMIN)),
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.listar_usuarios()


@router.patch(
    "/usuarios/{usuario_id}/rol",
    response_model=UsuarioResponse,
    summary="Cambiar rol de un usuario",
    description="Permite a un ADMIN cambiar el rol de cualquier usuario del sistema.",
    responses={
        200: {"description": "Rol actualizado"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — solo ADMIN"},
        404: {"description": "Usuario no encontrado"},
        429: {"description": "Limite de solicitudes excedido (5/min)"},
    },
)
@limiter.limit("5/minute")
async def cambiar_rol(
    request: Request,
    usuario_id: str,
    datos: CambioRolRequest,
    admin: TokenPayload = Depends(requiere_rol(Rol.ADMIN)),
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.cambiar_rol(usuario_id, admin.sub, datos)
