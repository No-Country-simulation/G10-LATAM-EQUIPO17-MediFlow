import logging
import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.database import async_session
from src.models.registro_auditoria import RegistroAuditoria

logger = logging.getLogger("mediflow.audit")


class AuditMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        inicio = time.monotonic()

        client_ip = request.client.host if request.client else "unknown"
        metodo = request.method
        path = request.url.path

        usuario_id = None
        rol = None

        response = await call_next(request)

        duracion_ms = round((time.monotonic() - inicio) * 1000, 1)
        status = response.status_code

        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                from src.security.auth import verificar_token
                payload = verificar_token(auth_header[7:])
                if payload:
                    usuario_id = payload.get("sub")
                    rol = payload.get("rol")
            except Exception:
                pass

        nivel = logging.WARNING if status >= 400 else logging.INFO

        logger.log(
            nivel,
            "%s %s %d %sms | ip=%s user=%s rol=%s req=%s",
            metodo,
            path,
            status,
            duracion_ms,
            client_ip,
            usuario_id or "-",
            rol or "-",
            request_id,
        )

        try:
            async with async_session() as db:
                registro = RegistroAuditoria(
                    request_id=request_id,
                    metodo=metodo,
                    path=path,
                    status_code=status,
                    duracion_ms=duracion_ms,
                    ip=client_ip,
                    usuario_id=usuario_id,
                    rol=rol,
                )
                db.add(registro)
                await db.commit()
        except Exception:
            logger.debug("No se pudo persistir registro de auditoria %s", request_id)

        response.headers["X-Request-ID"] = request_id
        return response
