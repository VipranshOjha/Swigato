import asyncio
from typing import Any
import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.security import decode_access_token
from app.core.exceptions import TokenExpiredError, TokenInvalidError
from app.realtime.websocket_manager import manager
from app.realtime.schemas import WsPingMessage, WsPongMessage, WsSubscribeMessage
from app.database import _async_session_factory
from app.repositories.restaurant_repo import RestaurantRepository
import uuid

logger = structlog.get_logger(__name__)

router = APIRouter()

async def connection_pruner():
    """Background task to continually prune stale connections."""
    while True:
        await asyncio.sleep(30)
        await manager.prune_stale_connections(timeout_seconds=60)

@router.on_event("startup")
async def start_pruner():
    asyncio.create_task(connection_pruner())

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    subprotocols = websocket.scope.get("subprotocols", [])
    if not subprotocols:
        await websocket.close(code=1008, reason="Missing token in subprotocols")
        return

    token = subprotocols[0]
    
    try:
        payload = decode_access_token(token)
    except (TokenExpiredError, TokenInvalidError):
        # We can accept with a subprotocol just to close it cleanly
        await websocket.accept(subprotocol=token)
        await websocket.close(code=1008, reason="Invalid or expired token")
        return
        
    user_id = str(payload.get("sub"))
    roles = payload.get("roles", [])

    await websocket.accept(subprotocol=token)

    metadata = await manager.connect(websocket, user_id, roles)
    
    # Auto-subscribe owner to their restaurants (Tenant Isolation)
    if "restaurant_owner" in roles:
        async with _async_session_factory() as db:
            restaurant_repo = RestaurantRepository(db)
            restaurants = await restaurant_repo.get_by_owner(uuid.UUID(user_id))
            for r in restaurants:
                await manager.subscribe(metadata.connection_id, f"restaurant:{r.id}")
                
    # Auto-subscribe delivery partners to their own profile topic
    if "delivery_partner" in roles:
        async with _async_session_factory() as db:
            from app.repositories.delivery_repo import DeliveryPartnerRepository
            partner_repo = DeliveryPartnerRepository(db)
            profile = await partner_repo.get_by_user_id(int(user_id))
            if profile:
                await manager.subscribe(metadata.connection_id, f"delivery_partner:{profile.id}")
                
    # Auto-subscribe customers to their own user topic
    if "customer" in roles or "user" in roles:
        await manager.subscribe(metadata.connection_id, f"customer:{user_id}")
        
    # Auto-subscribe admins to the global firehose
    if "admin" in roles:
        await manager.subscribe(metadata.connection_id, "admin:system")
    
    try:
        while True:
            data = await websocket.receive_json()
            await manager.update_last_seen(metadata.connection_id)
            
            msg_type = data.get("type")
            
            if msg_type == "PING":
                pong = WsPongMessage().model_dump_json()
                await websocket.send_text(pong)
            
            elif msg_type == "PONG":
                pass
                
            elif msg_type == "SUBSCRIBE":
                topic = data.get("payload", {}).get("topic")
                if topic:
                    # Tenant Isolation: Clients cannot arbitrarily subscribe to protected topics
                    if topic.startswith("restaurant:") or topic.startswith("delivery_partner:") or topic.startswith("customer:") or topic.startswith("admin:"):
                        logger.warning("realtime.unauthorized_subscribe", connection_id=metadata.connection_id, topic=topic)
                        continue
                    await manager.subscribe(metadata.connection_id, topic)

            elif msg_type == "UNSUBSCRIBE":
                topic = data.get("payload", {}).get("topic")
                if topic:
                    await manager.unsubscribe(metadata.connection_id, topic)

    except WebSocketDisconnect:
        manager.disconnect(metadata.connection_id)
    except Exception as e:
        logger.error("realtime.websocket_error", connection_id=metadata.connection_id, error=str(e))
        manager.disconnect(metadata.connection_id)
