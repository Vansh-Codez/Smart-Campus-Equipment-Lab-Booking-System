import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional, Union, Any
import jwt
from app.config import settings

# Argon2 or PBKDF2 fallback
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    _ph = PasswordHasher()

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        if hashed_password.startswith("$argon2"):
            try:
                return _ph.verify(hashed_password, plain_password)
            except VerifyMismatchError:
                return False
        # Fallback to pbkdf2 format if needed
        parts = hashed_password.split("$")
        if len(parts) == 3 and parts[0] == "pbkdf2":
            salt = bytes.fromhex(parts[1])
            key = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt, 100000)
            return key.hex() == parts[2]
        return False

    def get_password_hash(password: str) -> str:
        return _ph.hash(password)

except ImportError:
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        parts = hashed_password.split("$")
        if len(parts) == 3 and parts[0] == "pbkdf2":
            salt = bytes.fromhex(parts[1])
            key = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt, 100000)
            return key.hex() == parts[2]
        return False

    def get_password_hash(password: str) -> str:
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
        return f"pbkdf2${salt.hex()}${key.hex()}"


def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
