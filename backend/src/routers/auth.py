from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.rate_limit import limiter
from src.models.usuario import Usuario
from src.models.token_revocado import TokenRevocado
from src.security import (
    crear_access_token,
    crear_refresh_token,
    verificar_token,
    hashear_password,
    verificar_password,
    obtener_usuario_actual,
    LoginRequest,
    RegistroRequest,
    RefreshRequest,
    LogoutRequest,
    TokenResponse,
    TokenPayload,
    UsuarioResponse,
    Rol,
)

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post("/registro", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def registrar_usuario(request: Request, datos: RegistroRequest, db: AsyncSession = Depends(get_db)):
    existe = await db.execute(select(Usuario).where(Usuario.email == datos.email))
    if existe.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese email",
        )

    usuario = Usuario(
        nombre=datos.nombre,
        email=datos.email,
        password_hash=hashear_password(datos.password),
        rol=Rol.PACIENTE,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)

    token_data = {"sub": usuario.id, "rol": usuario.rol.value}
    return TokenResponse(
        access_token=crear_access_token(token_data),
        refresh_token=crear_refresh_token(token_data),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, datos: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.email == datos.email))
    usuario = result.scalar_one_or_none()

    if not usuario or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )

    usuario.last_login = datetime.now(timezone.utc)
    await db.commit()

    token_data = {"sub": usuario.id, "rol": usuario.rol.value}
    return TokenResponse(
        access_token=crear_access_token(token_data),
        refresh_token=crear_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_token(request: Request, datos: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = verificar_token(datos.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalido o expirado",
        )

    jti = payload.get("jti")
    if jti:
        revocado = await db.get(TokenRevocado, jti)
        if revocado:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token ya fue utilizado",
            )

    usuario = await db.get(Usuario, payload["sub"])

    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario no encontrado o desactivado",
        )

    if jti:
        db.add(TokenRevocado(
            jti=jti,
            expira_en=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        ))
        await db.commit()

    token_data = {"sub": usuario.id, "rol": usuario.rol.value}
    return TokenResponse(
        access_token=crear_access_token(token_data),
        refresh_token=crear_refresh_token(token_data),
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(datos: LogoutRequest, db: AsyncSession = Depends(get_db)):
    payload = verificar_token(datos.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalido",
        )

    jti = payload.get("jti")
    if jti:
        existe = await db.get(TokenRevocado, jti)
        if not existe:
            db.add(TokenRevocado(
                jti=jti,
                expira_en=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
            ))
            await db.commit()

    return {"detail": "Sesion cerrada"}


@router.get("/me", response_model=UsuarioResponse)
async def perfil_actual(
    usuario: TokenPayload = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(get_db),
):
    datos = await db.get(Usuario, usuario.sub)

    if not datos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return UsuarioResponse(
        id=datos.id,
        nombre=datos.nombre,
        email=datos.email,
        rol=Rol.PACIENTE,
        activo=datos.activo,
        created_at=datos.created_at,
        last_login=datos.last_login,
    )
