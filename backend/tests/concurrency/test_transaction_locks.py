import asyncio
import pytest
from app.constants import OrderStatus
from app.services.order_service import OrderService
from app.services.delivery_service import DeliveryService
from app.schemas.order import OrderCreate

pytestmark = pytest.mark.concurrency

@pytest.mark.asyncio
async def test_double_checkout(db_session, session_factory, create_customer, create_owner_and_restaurant, build_cart_with_items):
    # Setup base data in the main db_session
    customer = await create_customer()
    owner, restaurant = await create_owner_and_restaurant()
    cart, menu_item, address = await build_cart_with_items(customer, restaurant)
    
    # Commit the transaction so concurrent sessions can see the data
    await db_session.commit()
    
    async def attempt_checkout():
        async with session_factory() as session:
            service = OrderService(session)
            try:
                # We need to wrap in transaction manually
                async with session.begin():
                    order = await service.create_order(customer.id, OrderCreate(delivery_address_id=address.id, notes=""))
                    return True, order
            except Exception as e:
                return False, e

    # Spawn 3 concurrent requests
    results = await asyncio.gather(
        attempt_checkout(),
        attempt_checkout(),
        attempt_checkout()
    )
    
    successes = [r for r, e in results if r]
    failures = [e for r, e in results if not r]
    
    # Exactly 1 success, 2 failures
    assert len(successes) == 1
    assert len(failures) == 2

@pytest.mark.asyncio
async def test_accept_vs_cancel(db_session, session_factory, create_pending_order):
    customer, owner, restaurant, order_id = await create_pending_order()
    await db_session.commit()
    
    async def attempt_accept():
        async with session_factory() as session:
            service = OrderService(session)
            try:
                async with session.begin():
                    await service.owner_accept_order(owner.id, order_id)
                    return "ACCEPTED"
            except Exception as e:
                return e

    async def attempt_cancel():
        async with session_factory() as session:
            service = OrderService(session)
            try:
                async with session.begin():
                    await service.cancel_order(customer.id, order_id)
                    return "CANCELLED"
            except Exception as e:
                return e

    # Spawn them concurrently
    results = await asyncio.gather(attempt_accept(), attempt_cancel())
    
    successes = [r for r in results if isinstance(r, str)]
    failures = [r for r in results if isinstance(r, Exception)]
    
    # Assert exactly 1 success and 1 failure (serialization works, one transitions, other raises Exception)
    assert len(successes) == 1
    assert len(failures) == 1
    
    # Check final state in DB
    async with session_factory() as session:
        from app.repositories.order_repo import OrderRepository
        repo = OrderRepository(session)
        order = await repo.get_by_id(order_id)
        
        # The final state must match the one that succeeded
        assert order.status == successes[0]

@pytest.mark.asyncio
async def test_double_assignment(db_session, session_factory, create_pending_order, create_delivery_partner):
    # Setup 3 dummy orders ready for pickup
    orders = []
    for _ in range(3):
        customer, owner, restaurant, order_id = await create_pending_order()
        service = OrderService(db_session)
        await service.owner_update_status(owner.id, order_id, OrderStatus.READY_FOR_PICKUP)
        orders.append(order_id)
        
    # Setup 3 riders
    await create_delivery_partner(email="rider1@test.com")
    await create_delivery_partner(email="rider2@test.com")
    await create_delivery_partner(email="rider3@test.com")
    
    await db_session.commit()
    
    async def attempt_assign(order_id):
        async with session_factory() as session:
            service = DeliveryService(session)
            try:
                async with session.begin():
                    # This relies on the skip_locked query
                    return await service.auto_assign_order(order_id)
            except Exception as e:
                return e

    # Assign concurrently
    results = await asyncio.gather(
        attempt_assign(orders[0]),
        attempt_assign(orders[1]),
        attempt_assign(orders[2])
    )
    
    # Ensure they all successfully got a unique rider
    async with session_factory() as session:
        from app.repositories.order_repo import OrderRepository
        repo = OrderRepository(session)
        
        assigned_riders = set()
        for oid in orders:
            order = await repo.get_by_id(oid)
            assert order.assigned_delivery_partner_id is not None
            assigned_riders.add(order.assigned_delivery_partner_id)
            
        # 3 unique riders assigned! No double assignment.
        assert len(assigned_riders) == 3

@pytest.mark.asyncio
async def test_same_transition_contention(db_session, session_factory, create_pending_order):
    customer, owner, restaurant, order_id = await create_pending_order()
    await db_session.commit()
    
    async def attempt_accept():
        async with session_factory() as session:
            service = OrderService(session)
            try:
                async with session.begin():
                    await service.owner_accept_order(owner.id, order_id)
                    return True
            except Exception as e:
                return False

    # 10 concurrent requests to accept the SAME order
    tasks = [attempt_accept() for _ in range(10)]
    results = await asyncio.gather(*tasks)
    
    successes = [r for r in results if r is True]
    failures = [r for r in results if r is False]
    
    # Only 1 request should successfully transition from PENDING to ACCEPTED
    # The others will read ACCEPTED (after lock releases) and fail
    assert len(successes) == 1
    assert len(failures) == 9
