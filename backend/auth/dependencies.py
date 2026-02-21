"""
dependencies.py — FastAPI dependency injection for authentication & RBAC.

Usage in a route:
    from auth.dependencies import get_current_user, require_roles

    @router.get("/vehicles")
    async def list_vehicles(user: UserInDB = Depends(require_roles(UserRole.manager, UserRole.dispatcher))):
        ...
"""

from functools import lru_cache
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .jwt import decode_access_token
from .models import TokenData, UserInDB, UserRole

# ---------------------------------------------------------------------------
# Abstract Supabase layer — replace with your real client calls
# ---------------------------------------------------------------------------

from db.users import get_user_by_id as _get_user_from_db  # noqa: E402
from db.users import get_user_by_email as _get_user_by_email  # noqa: E402


# ---------------------------------------------------------------------------
# Bearer token extractor
# ---------------------------------------------------------------------------

bearer_scheme = HTTPBearer(auto_error=True)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> TokenData:
    token_data = decode_access_token(credentials.credentials)
    if token_data is None:
        raise _CREDENTIALS_EXCEPTION
    return token_data


async def get_current_user(
    token_data: TokenData = Depends(get_current_token),
) -> UserInDB:
    user = await _get_user_from_db(int(token_data.sub))
    if user is None:
        raise _CREDENTIALS_EXCEPTION
    return user


# ---------------------------------------------------------------------------
# RBAC — role-based guard factory
# ---------------------------------------------------------------------------

# Role hierarchy: higher index = more access
_ROLE_HIERARCHY: list[UserRole] = [
    UserRole.viewer,
    UserRole.driver,
    UserRole.dispatcher,
    UserRole.manager,
    UserRole.admin,
]


def _role_rank(role: UserRole) -> int:
    try:
        return _ROLE_HIERARCHY.index(role)
    except ValueError:
        return -1


def require_roles(*allowed_roles: UserRole) -> Callable:
    """
    Dependency factory that enforces role membership.

    Examples
    --------
    # Exact role match — only dispatchers and managers
    Depends(require_roles(UserRole.dispatcher, UserRole.manager))

    # Hierarchy shortcut — manager OR above (admin)
    Depends(require_min_role(UserRole.manager))
    """
    allowed_set = set(allowed_roles)

    async def _guard(user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if user.role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}.",
            )
        return user

    return _guard


def require_min_role(minimum: UserRole) -> Callable:
    """
    Dependency factory that enforces a minimum role rank (hierarchy-aware).
    Any role at or above `minimum` in _ROLE_HIERARCHY is allowed.
    """
    min_rank = _role_rank(minimum)

    async def _guard(user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if _role_rank(user.role) < min_rank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Minimum required role: {minimum.value}.",
            )
        return user

    return _guard


# ---------------------------------------------------------------------------
# Convenience aliases (import these in your routers)
# ---------------------------------------------------------------------------

AdminOnly         = Depends(require_roles(UserRole.admin))
ManagerOrAbove    = Depends(require_min_role(UserRole.manager))
DispatcherOrAbove = Depends(require_min_role(UserRole.dispatcher))
DriverOrAbove     = Depends(require_min_role(UserRole.driver))
AnyAuthenticatedUser = Depends(get_current_user)
