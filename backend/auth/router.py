"""
router.py — /auth endpoints: register, login, refresh, me.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from .dependencies import get_current_user
from db.users import get_user_by_email as _get_user_by_email, get_user_by_id as _get_user_from_db, create_user
from .jwt import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from .models import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserInDB,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    """
    Create a new user account.

    TODO: Replace the stubs below with real Supabase inserts, e.g.:
        existing = supabase.table("users").select("id").eq("email", body.email).execute()
        if existing.data:
            raise HTTPException(409, "Email already registered.")
        result = supabase.table("users").insert({...}).execute()
        return UserResponse(**result.data[0])
    """
    existing = await _get_user_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )

    new_user = await create_user(
        email=body.email,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role=body.role,
    )
    return UserResponse(**new_user.model_dump())


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Exchange email + password for access & refresh tokens."""
    user = await _get_user_by_email(body.email)

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(
        access_token=create_access_token(user.id, user.email, user.role),
        refresh_token=create_refresh_token(user.id),
    )


# ---------------------------------------------------------------------------
# POST /auth/refresh
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    """
    Issue a new access token using a valid refresh token.
    Implements refresh-token rotation: returns a new refresh token too.
    """
    user_id_str = decode_refresh_token(body.refresh_token)
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user = await _get_user_from_db(int(user_id_str))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )

    return TokenResponse(
        access_token=create_access_token(user.id, user.email, user.role),
        refresh_token=create_refresh_token(user.id),     # rotated
    )


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
async def me(current_user: UserInDB = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
    )
