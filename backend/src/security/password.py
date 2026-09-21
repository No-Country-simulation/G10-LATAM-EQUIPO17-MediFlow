from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

hasher = PasswordHash((Argon2Hasher(),))


def hashear_password(password: str) -> str:
    return hasher.hash(password)


def verificar_password(password: str, password_hash: str) -> bool:
    return hasher.verify(password, password_hash)
