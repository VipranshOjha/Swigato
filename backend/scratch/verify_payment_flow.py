import asyncio
import httpx
import random

API_URL = 'http://localhost:8000/api/v1'

async def test_flow():
    email = f'cust{random.randint(100,999)}@test.com'
    print('--- STARTING PAYMENT FLOW VERIFICATION ---')
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Register Customer
        res = await client.post(f'{API_URL}/auth/register', json={'name': 'Cust', 'email': email, 'password': 'password', 'phone': f'99999{random.randint(10000,99999)}', 'roles': ['customer']})
        cust_token = res.json().get('access_token')
        cust_headers = {'Authorization': f'Bearer {cust_token}'}
        
        # Add Address
        res = await client.post(f'{API_URL}/customer/addresses', json={'street': '123', 'city': 'c', 'state': 's', 'zip_code': '12345', 'is_default': True, 'address_type': 'home'}, headers=cust_headers)
        address_id = res.json().get('id')
        if not address_id:
            print("Failed to add address:", res.json())
            return
            
        # Add item to cart
        res = await client.get(f'{API_URL}/restaurants')
        restaurants = res.json().get('items', [])
        rest_id = restaurants[0]['id']
        res = await client.get(f'{API_URL}/restaurants/{rest_id}/menu')
        item_id = res.json()[0]['items'][0]['id']
        
        await client.post(f'{API_URL}/cart/items', json={'menu_item_id': item_id, 'quantity': 1}, headers=cust_headers)
        
        # Create Order
        print('\n=> API Called: POST /api/v1/orders')
        res = await client.post(f'{API_URL}/orders', json={'delivery_address_id': address_id, 'payment_method': 'CARD'}, headers=cust_headers)
        order_id = res.json()['id']
        print(f'Created Order: {order_id} | Status: {res.json()["status"]}')
        
        # Initialize Payment
        print(f'\n=> API Called: POST /api/v1/payments/orders/{order_id}/initialize')
        res = await client.post(f'{API_URL}/payments/orders/{order_id}/initialize', json={'gateway': 'mock'}, headers=cust_headers)
        provider_payment_id = res.json()['provider_payment_id']
        print(f'Initialized Payment. Provider ID: {provider_payment_id}')
        
        print(f'Order Status After Init: {(await client.get(f"{API_URL}/orders/{order_id}", headers=cust_headers)).json()["status"]}')
        
        # Simulate Webhook
        print(f'\n=> API Called: POST /api/v1/payments/webhooks/mock')
        res = await client.post(f'{API_URL}/payments/webhooks/mock', json={'provider_payment_id': provider_payment_id, 'status': 'captured', 'method': 'CARD', 'type': 'payment.captured'})
        print(f'Webhook Result: {res.json()}')
        
        # Final status
        print(f'\n=> API Called: GET /api/v1/orders/{order_id}')
        final_order = (await client.get(f'{API_URL}/orders/{order_id}', headers=cust_headers)).json()
        print(f'Final Order Status: {final_order["status"]}')
        print('\nState Transitions Observed in DB:')
        for h in final_order['status_history']:
            notes = h.get("notes", "")
            old_s = h.get("old_status", "None")
            new_s = h.get("new_status", "None")
            print(f"- {old_s} -> {new_s} | Notes: {notes}")

asyncio.run(test_flow())
