from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def get_rate_limit_key(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from src.security.auth import verificar_token
            payload = verificar_token(auth_header[7:])
            if payload and payload.get("sub"):
                return payload["sub"]
        except Exception:
            pass
    return get_remote_address(request)


limiter = Limiter(key_func=get_rate_limit_key)
