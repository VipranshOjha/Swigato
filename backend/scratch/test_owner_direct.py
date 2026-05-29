import asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# directly query DB to find a placed order
async def get_placed_order():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/swigato")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT id, restaurant_id FROM orders WHERE status='placed' LIMIT 1"))
        row = result.fetchone()
        if not row:
            return None, None
            
        order_id = row[0]
        restaurant_id = row[1]
        
        result2 = await session.execute(text("SELECT owner_id FROM restaurants WHERE id=:rid"), {"rid": restaurant_id})
        owner_id = result2.fetchone()[0]
        
        result3 = await session.execute(text("SELECT email FROM users WHERE id=:oid"), {"oid": owner_id})
        email = result3.fetchone()[0]
        
        return order_id, email

async def test_owner():
    order_id, email = await get_placed_order()
    if not order_id:
        print("No placed orders found in DB")
        return
        
    print(f"Found placed order: {order_id}, owner: {email}")
    
    API_URL = 'http://localhost:8000/api/v1'
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(f'{API_URL}/auth/login', json={'email': email, 'password': 'password'})
        token = res.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        
        res = await client.patch(f'{API_URL}/owner/orders/{order_id}/accept', headers=headers)
        print(f"Accept Response: {res.status_code}")
        print(res.text)

asyncio.run(test_owner())
