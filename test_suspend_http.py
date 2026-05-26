import asyncio
import httpx
from dotenv import load_dotenv
load_dotenv("C:\\Users\\ojhav\\OneDrive\\Desktop\\Swigato\\backend\\.env")

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
        
        if res.status_code == 200:
            data = res.json()
            items = data.get("items", [])
            
            # Find an APPROVED restaurant
            r_id = None
            for r in items:
                if r["approval_status"] == "APPROVED":
                    r_id = r["id"]
                    break
            
            if not r_id:
                print("No approved restaurants found")
                return
                
            res_patch = await client.patch(f"http://127.0.0.1:8000/api/v1/admin/restaurants/{r_id}/suspend", headers=headers)
            print("PATCH /suspend status:", res_patch.status_code)
            print("PATCH /suspend body:", res_patch.text)

if __name__ == "__main__":
    asyncio.run(main())
