from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from .models import TokenData, UserRole

# ---------------------------------------------------------------------------
# Config — swap these out for env vars / settings object in production
# ---------------------------------------------------------------------------
SECRET_KEY = "4af844ac7135a4dab81c66a1bc6fbcf53bb05dd8f99db07cd8799c8751d24ad9"          # openssl rand -hex 32
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


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
            return None                       # refuse refresh tokens on access endpoints
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
