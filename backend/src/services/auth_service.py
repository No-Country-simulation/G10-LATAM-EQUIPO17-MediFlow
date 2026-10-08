from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException, status
from src.models.token_revocado import TokenRevocado
from src.models.usuario import Usuario
from src.repository.token_revocado_repository import TokenRevocadoRepository
from src.repository.user_repository import UserRepository
from src.security import (
    crear_access_token,
    crear_refresh_token,
    hashear_password,
    verificar_password,
    verificar_token,
)
from src.security.schemas import (
    CambioRolRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegistroRequest,
    Rol,
    TokenResponse,
    UsuarioResponse,
)

import logging

logger = logging.getLogger("mediflow.agent")

class AuthService:
    def __init__(self, user_repository: UserRepository, token_revocado_repository: TokenRevocadoRepository):
        self.user_repository = user_repository
        self.token_revocado_repository = token_revocado_repository


    async def registrar_usuario(self, registro_request: RegistroRequest) -> TokenResponse:
        existe = await self.user_repository.find_user_by_email(registro_request.email)
        if existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un usuario con ese email",
            )

        usuario = Usuario(
            nombre=registro_request.nombre,
            email=registro_request.email,
            password_hash=hashear_password(registro_request.password),
            rol=Rol.PACIENTE,
        )
        try: 
            usuario = await self.user_repository.create_user(usuario)

        except IntegrityError as e:

            logger.error(f"Error al registrar usuario: {e}")
 
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Uno de los datos ingresados ya se encuentra registrado y debe ser único.",
            )
        except SQLAlchemyError:
        
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al registrar el usuario.",
            )

        token_data = {"sub": usuario.id, "rol": usuario.rol.value}
        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )


    async def login(self, login_request: LoginRequest) -> TokenResponse:
        usuario = await self.user_repository.find_user_by_email(login_request.email)
        if not usuario or not verificar_password(login_request.password, usuario.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )

        if not usuario.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo",
            )

        fecha_actual = datetime.now(timezone.utc)
        usuario = await self.user_repository.update_last_login(usuario, fecha_actual)

        token_data = {"sub": usuario.id, "rol": usuario.rol.value}
        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )


    async def refresh_token(self, refresh_request: RefreshRequest) -> TokenResponse:

        payload = verificar_token(refresh_request.refresh_token) 

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalido o expirado",
        )

        jti = payload.get("jti")
        if jti:
            token_revocado = await self.token_revocado_repository.find_by_jti(jti)
            if token_revocado:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token ya fue utilizado",
                )

        try:
            usuario = await self.user_repository.find_user_by_id(payload.get("sub"))
        except IntegrityError as e:
            logger.error(f"Error de integridad al obtener usuario: {e}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Uno de los datos ingresados ya se encuentra registrado y debe ser único.",
            )
        except SQLAlchemyError as e:
            logger.error(f"Error de SQLAlchemy al obtener usuario: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al registrar el usuario.",
            )
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        await self.token_revocado_repository.create(TokenRevocado(
            jti=jti,    
            expira_en=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        ))

        token_data = {"sub": usuario.id, "rol": usuario.rol.value}
        return TokenResponse(
            access_token=crear_access_token(token_data),
            refresh_token=crear_refresh_token(token_data),
        )


    async def logout(self, logout_request: LogoutRequest)-> dict:
        payload = verificar_token(logout_request.refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token invalido",
            )

        jti = payload.get("jti")
        if jti:
            existe = await self.token_revocado_repository.find_by_jti(jti)
            if not existe:
                await self.token_revocado_repository.create(TokenRevocado(
                    jti=jti,
                    expira_en=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
                ))

        return {"detail": "Sesion cerrada"}

    async def obtener_usuario(self, usuario_id: str) -> UsuarioResponse:
        usuario = await self.user_repository.find_user_by_id(usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return UsuarioResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            rol=usuario.rol,
            activo=usuario.activo,
            created_at=usuario.created_at,
            last_login=usuario.last_login,
        )

    
    async def listar_usuarios(self) -> list[UsuarioResponse]:
        usuarios = await self.user_repository.list_users()
        return [
            UsuarioResponse(
                id=usuario.id,
                nombre=usuario.nombre,
                email=usuario.email,
                rol=usuario.rol,
                activo=usuario.activo,
                created_at=usuario.created_at,
                last_login=usuario.last_login,
            )
            for usuario in usuarios
        ]  


    async def cambiar_rol(self, usuario_id: str, admin_id: str, cambio_rol_request: CambioRolRequest) -> UsuarioResponse:

        if usuario_id == admin_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes cambiar tu propio rol.",
            )
        
        usuario = await self.user_repository.find_user_by_id(usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        usuario = await self.user_repository.update_rol(usuario, cambio_rol_request.rol)
        return UsuarioResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            rol=usuario.rol,
            activo=usuario.activo,
            last_login=usuario.last_login,
        )