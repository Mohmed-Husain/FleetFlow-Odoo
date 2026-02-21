from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from .models import TokenData, UserRole

# ---------------------------------------------------------------------------
# Config — swap these out for env vars / settings object in production
# ---------------------------------------------------------------------------
SECRET_KEY = "CHANGE_ME_USE_ENV_VAR"          # openssl rand -hex 32
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


# ---------------------------------------------------------------------------
# Password helpers (using bcrypt directly — passlib has conflicts with bcrypt 4.x)
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def _create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: int, email: str, role: UserRole) -> str:
    return _create_token(
        {"sub": str(user_id), "email": email, "role": role},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int) -> str:
    """Refresh token carries only the subject so it can be rotated safely."""
    return _create_token(
        {"sub": str(user_id), "type": "refresh"},
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_access_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            return None
        return TokenData(
            sub=payload["sub"],
            email=payload["email"],
            role=payload["role"],
        )
    except (JWTError, KeyError):
        return None


def decode_refresh_token(token: str) -> Optional[str]:
    """Returns the user_id string on success, None on failure."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload["sub"]
    except JWTError:
        return None
