import asyncio
import httpx
import random

API_URL = 'http://localhost:8000/api/v1'

async def test_owner():
    email = f'cust{random.randint(100,999)}@test.com'
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Register Customer
        res = await client.post(f'{API_URL}/auth/register', json={'name': 'Cust', 'email': email, 'password': 'password', 'phone': f'99999{random.randint(10000,99999)}', 'roles': ['customer']})
        cust_token = res.json().get('access_token')
        cust_headers = {'Authorization': f'Bearer {cust_token}'}
        
        # Add Address
        res = await client.post(f'{API_URL}/users/addresses', json={'street': '123', 'city': 'c', 'state': 's', 'zip_code': '12345', 'is_default': True, 'address_type': 'home'}, headers=cust_headers)
        address_id = res.json().get('id') if res.status_code == 201 else (await client.get(f'{API_URL}/users/addresses', headers=cust_headers)).json()[0]['id']
        
        # Add item to cart
        res = await client.get(f'{API_URL}/restaurants')
        rest_id = res.json()['items'][0]['id']
        res = await client.get(f'{API_URL}/restaurants/{rest_id}/menu')
        item_id = res.json()[0]['items'][0]['id']
        
        await client.post(f'{API_URL}/cart/items', json={'menu_item_id': item_id, 'quantity': 1}, headers=cust_headers)
        
        # Create Order
        res = await client.post(f'{API_URL}/orders', json={'delivery_address_id': address_id, 'payment_method': 'CARD'}, headers=cust_headers)
        order_id = res.json()['id']
        
        # Initialize & Sim Webhook
        res = await client.post(f'{API_URL}/payments/orders/{order_id}/initialize', json={'gateway': 'stripe'}, headers=cust_headers)
        await client.post(f'{API_URL}/payments/webhooks/stripe', json={'provider_payment_id': res.json()['provider_payment_id'], 'status': 'captured', 'method': 'CARD', 'type': 'payment.captured'})
        
        print(f'Order ID: {order_id}')
        
        # Now login as owner
        res = await client.post(f'{API_URL}/auth/login', json={'email': 'owner@test.com', 'password': 'password'})
        owner_token = res.json().get('access_token')
        owner_headers = {'Authorization': f'Bearer {owner_token}'}
        
        # Accept order
        res = await client.patch(f'{API_URL}/owner/orders/{order_id}/accept', headers=owner_headers)
        print(f'Accept Response: {res.status_code} {res.text}')

asyncio.run(test_owner())
