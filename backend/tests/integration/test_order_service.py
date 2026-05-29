import pytest
from app.constants import OrderStatus
from app.services.order_service import OrderService
from app.services.delivery_service import DeliveryService
from app.core.exceptions import InvalidOrderStateTransitionError, PermissionDeniedError

pytestmark = pytest.mark.integration

@pytest.mark.asyncio
async def test_order_happy_path(
    db_session, 
    create_pending_order, 
    create_delivery_partner,
    mock_event_bus
):
    # Setup
    customer, owner, restaurant, order_id = await create_pending_order()
    rider_user, rider_profile = await create_delivery_partner(is_online=True)
    
    order_service = OrderService(db_session)
    delivery_service = DeliveryService(db_session)
    
    # Verify initial state
    mock_event_bus.published_events.clear()
    
    # 1. Owner accepts
    await order_service.owner_accept_order(owner.id, order_id)
    order = await order_service._get_order(order_id)
    assert order.status == OrderStatus.ACCEPTED.value
    # Verify events
    events = [e["event"].event_type for e in mock_event_bus.published_events]
    assert "ORDER_ACCEPTED" in [e.value for e in events]
    
    # 2. Owner preparing
    await order_service.owner_update_status(owner.id, order_id, OrderStatus.PREPARING)
    order = await order_service._get_order(order_id)
    assert order.status == OrderStatus.PREPARING.value
    
    # 3. Owner ready for pickup (triggers auto-assign)
    await order_service.owner_update_status(owner.id, order_id, OrderStatus.READY_FOR_PICKUP)
    order = await order_service._get_order(order_id)
    assert order.status == OrderStatus.RIDER_ASSIGNED.value
    assert order.assigned_delivery_partner_id == rider_profile.id
    
    # 4. Rider Pickup
    await delivery_service.mark_picked_up(rider_user.id, order_id)
    order = await order_service._get_order(order_id)
    assert order.status == OrderStatus.PICKED_UP.value
    
    # 5. Rider Transit
    await delivery_service.mark_in_transit(rider_user.id, order_id)
    order = await order_service._get_order(order_id)
    assert order.status == OrderStatus.IN_TRANSIT.value
    
    # 6. Rider Delivered
    await delivery_service.mark_delivered(rider_user.id, order_id)
    order = await order_service._get_order(order_id)
    assert order.status == OrderStatus.DELIVERED.value

@pytest.mark.asyncio
async def test_invalid_transitions(db_session, create_pending_order, create_delivery_partner):
    customer, owner, restaurant, order_id = await create_pending_order()
    order_service = OrderService(db_session)
    
    # PENDING -> READY_FOR_PICKUP (invalid)
    with pytest.raises(InvalidOrderStateTransitionError):
        await order_service.owner_update_status(owner.id, order_id, OrderStatus.READY_FOR_PICKUP)
        
    # Cancel order
    await order_service.cancel_order(customer.id, order_id)
    
    # CANCELLED -> PREPARING (invalid)
    with pytest.raises(InvalidOrderStateTransitionError):
        await order_service.owner_update_status(owner.id, order_id, OrderStatus.PREPARING)
        
    # Test REJECTED -> READY_FOR_PICKUP
    _, owner2, _, order_id2 = await create_pending_order()
    await order_service.owner_reject_order(owner2.id, order_id2, "Too busy")
    with pytest.raises(InvalidOrderStateTransitionError):
        await order_service.owner_update_status(owner2.id, order_id2, OrderStatus.READY_FOR_PICKUP)
        
    # Test DELIVERED -> ACCEPTED (or anything else backwards)
    _, owner3, _, order_id3 = await create_pending_order()
    rider_user3, _ = await create_delivery_partner()
    delivery_service = DeliveryService(db_session)
    
    # Fast track to delivered
    await order_service.owner_accept_order(owner3.id, order_id3)
    await order_service.owner_update_status(owner3.id, order_id3, OrderStatus.PREPARING)
    await order_service.owner_update_status(owner3.id, order_id3, OrderStatus.READY_FOR_PICKUP)
    await delivery_service.mark_picked_up(rider_user3.id, order_id3)
    await delivery_service.mark_in_transit(rider_user3.id, order_id3)
    await delivery_service.mark_delivered(rider_user3.id, order_id3)
    
    with pytest.raises(InvalidOrderStateTransitionError):
        await order_service.owner_update_status(owner3.id, order_id3, OrderStatus.ACCEPTED)

@pytest.mark.asyncio
async def test_rbac_permissions(db_session, create_pending_order, create_delivery_partner):
    customer, owner, restaurant, order_id = await create_pending_order()
    rider_user, _ = await create_delivery_partner()
    
    order_service = OrderService(db_session)
    delivery_service = DeliveryService(db_session)
    
    # Customer trying to accept order
    with pytest.raises(PermissionDeniedError):
        await order_service.owner_accept_order(customer.id, order_id)
        
    # Rider trying to accept order (owner action)
    with pytest.raises(PermissionDeniedError):
        await order_service.owner_accept_order(rider_user.id, order_id)
        
    # Owner trying to cancel order (customer action)
    with pytest.raises(PermissionDeniedError):
        await order_service.cancel_order(owner.id, order_id)
        
    # Random owner trying to accept order
    _, random_owner, _, _ = await create_pending_order()
    with pytest.raises(PermissionDeniedError):
        await order_service.owner_accept_order(random_owner.id, order_id)
