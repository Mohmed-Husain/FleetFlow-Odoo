from enum import Enum
from pydantic import BaseModel, EmailStr
from typing import Optional


# --- Enums ---

class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    dispatcher = "dispatcher"
    driver = "driver"
    viewer = "viewer"


# --- DB Row Representation ---

class UserInDB(BaseModel):
    id: int
    email: EmailStr
    password_hash: str
    role: UserRole
    first_name: str
    last_name: str


# --- Request / Response Schemas ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.viewer


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded JWT payload."""
    sub: str           # user id (as string)
    email: str
    role: UserRole
    exp: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    refresh_token: str
