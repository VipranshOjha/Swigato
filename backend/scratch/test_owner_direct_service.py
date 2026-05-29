import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.services.order_service import OrderService

async def get_placed_order(session):
    result = await session.execute(text("SELECT id, restaurant_id FROM orders WHERE status='placed' LIMIT 1"))
    row = result.fetchone()
    if not row:
        return None, None
        
    order_id = row[0]
    restaurant_id = row[1]
    
    result2 = await session.execute(text("SELECT owner_id FROM restaurants WHERE id=:rid"), {"rid": restaurant_id})
    owner_id = result2.fetchone()[0]
    
    return order_id, owner_id

async def test_owner():
    engine = create_async_engine("postgresql+asyncpg://postgres:mypassword@localhost:5432/swigato")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        order_id, owner_id = await get_placed_order(session)
        if not order_id:
            print("No placed orders found in DB")
            return
            
        print(f"Found placed order: {order_id}, owner: {owner_id}")
        
        service = OrderService(session)
        try:
            res = await service.owner_accept_order(owner_id, order_id)
            print("Success!")
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test_owner())
