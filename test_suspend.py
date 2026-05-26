import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import httpx
from app.core.security import create_access_token
from app.core.constants import UserRole

async def main():
    token, _ = create_access_token(
        subject=1,
        roles=[UserRole.ADMIN.value],
        extra_claims={
            "is_active": True,
            "is_email_verified": True
        }
    )
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        # Get restaurants to find an ID
        res = await client.get("http://127.0.0.1:8000/api/v1/admin/restaurants/", headers=headers)
        print("GET /admin/restaurants/:", res.status_code)
        
        if res.status_code == 200:
            data = res.json()
            items = data.get("items", [])
            if not items:
                print("No restaurants found")
                return
            
            # Find an APPROVED restaurant
            r_id = None
            for r in items:
                if r["approval_status"] == "APPROVED":
                    r_id = r["id"]
                    break
            
            if not r_id:
                print("No approved restaurants found")
                return
                
            print(f"Attempting to suspend {r_id}")
            res_patch = await client.patch(f"http://127.0.0.1:8000/api/v1/admin/restaurants/{r_id}/suspend", headers=headers)
            print("PATCH /suspend status:", res_patch.status_code)
            print("PATCH /suspend response:", res_patch.text)

if __name__ == "__main__":
    asyncio.run(main())
