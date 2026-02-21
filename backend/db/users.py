"""
db/users.py — All Supabase queries for the users table.
Import these functions and drop them into auth/dependencies.py and auth/router.py.
"""

from typing import Optional

from postgrest.exceptions import APIError

from auth.models import UserInDB
from db.supabase import get_supabase


TABLE = "users"


async def get_user_by_id(user_id: int) -> Optional[UserInDB]:
    try:
        result = (
            get_supabase()
            .table(TABLE)
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return UserInDB(**result.data) if result.data else None
    except APIError:
        return None


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    try:
        result = (
            get_supabase()
            .table(TABLE)
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )
        return UserInDB(**result.data) if result.data else None
    except APIError:
        return None


async def create_user(
    email: str,
    password_hash: str,
    first_name: str,
    last_name: str,
    role: str = "viewer",
) -> UserInDB:
    result = (
        get_supabase()
        .table(TABLE)
        .insert(
            {
                "email": email,
                "password_hash": password_hash,
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
            }
        )
        .execute()
    )
    return UserInDB(**result.data[0])
