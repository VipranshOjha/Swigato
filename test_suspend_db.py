import asyncio
from app.database import init_db, _async_session_factory
from app.services.restaurant_service import RestaurantService
import uuid

async def main():
    init_db()
    async with _async_session_factory() as db:
        service = RestaurantService(db)
        
        # Get all admin restaurants
        restaurants = await service.repo.get_all_admin(limit=10)
        
        r_id = None
        for r in restaurants:
            if r.approval_status.value == "APPROVED":
                r_id = r.id
                break
                
        if not r_id:
            print("No approved restaurants found")
            return
            
        print(f"Suspending restaurant: {r_id}")
        
        try:
            res = await service.suspend_restaurant(r_id)
            print("Successfully suspended:", res.approval_status)
        except Exception as e:
            print("Exception occurred:", type(e))
            import traceback
            traceback.print_exc()
            
        await db.commit()

if __name__ == "__main__":
    asyncio.run(main())
