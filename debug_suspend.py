import asyncio
from app.database import init_db, _async_session_factory
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token
import httpx

async def main():
    init_db()
    async with _async_session_factory() as db:
        # Find admin
        stmt = select(User)
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        admin_user = None
        for u in users:
            if "admin" in u.roles:
                admin_user = u
                break
                
        if not admin_user:
            print("No admin found")
            return
            
        print(f"Found admin: {admin_user.id} ({admin_user.email})")
        
        token, _ = create_access_token(
            subject=admin_user.id,
            roles=admin_user.roles,
            extra_claims={"is_active": admin_user.is_active, "is_email_verified": admin_user.is_email_verified}
        )
        print("Generated Token for Admin")
        
        # Now find an approved restaurant
        from app.models.restaurant import Restaurant, ApprovalStatus
        stmt = select(Restaurant).where(Restaurant.approval_status == ApprovalStatus.APPROVED)
        result = await db.execute(stmt)
        restaurant = result.scalars().first()
        
        if not restaurant:
            print("No approved restaurant found")
            return
            
        r_id = restaurant.id
        print(f"Target restaurant: {r_id}")
        
    # Make HTTP request
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.patch(f"http://127.0.0.1:8000/api/v1/admin/restaurants/{r_id}/suspend", headers=headers)
        print("STATUS:", res.status_code)
        print("RESPONSE:", res.text)
        
        # Also test GET
        res_get = await client.get("http://127.0.0.1:8000/api/v1/admin/restaurants/", headers=headers)
        print("GET STATUS:", res_get.status_code)

if __name__ == "__main__":
    asyncio.run(main())
