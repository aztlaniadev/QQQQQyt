from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import json
from bson import json_util

from server import get_current_user, db

store_router = APIRouter(prefix="/api/store", tags=["store"])

# Modelos Pydantic
class StoreItemCreate(BaseModel):
    name: str
    description: str
    price: int  # Preço em PCons
    item_type: str  # badge, theme, feature, customization
    rarity: str  # common, rare, epic, legendary
    image_url: Optional[str] = None
    effects: Optional[dict] = None
    requirements: Optional[dict] = None

class StoreItemResponse(BaseModel):
    id: str
    name: str
    description: str
    price: int
    item_type: str
    rarity: str
    image_url: Optional[str] = None
    effects: Optional[dict] = None
    requirements: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

class PurchaseRequest(BaseModel):
    quantity: int = 1

class PurchaseResponse(BaseModel):
    id: str
    user_id: str
    item_id: str
    quantity: int
    total_cost: int
    purchased_at: datetime
    item: StoreItemResponse

class InventoryItem(BaseModel):
    id: str
    item_id: str
    quantity: int
    acquired_at: datetime
    item: StoreItemResponse

# Endpoints
@store_router.get("/items", response_model=List[StoreItemResponse])
async def get_store_items(
    item_type: Optional[str] = None,
    rarity: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    skip: int = 0,
    limit: int = 50
):
    """Listar itens da loja com filtros opcionais"""
    try:
        query = {}
        
        if item_type:
            query["item_type"] = item_type
        if rarity:
            query["rarity"] = rarity
        if min_price is not None:
            query["price"] = {"$gte": min_price}
        if max_price is not None:
            if "price" in query:
                query["price"]["$lte"] = max_price
            else:
                query["price"] = {"$lte": max_price}
        
        items = await db.store_items.find(query).skip(skip).limit(limit).to_list(limit)
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(items))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar itens da loja: {str(e)}"
        )

@store_router.get("/items/{item_id}", response_model=StoreItemResponse)
async def get_store_item(item_id: str):
    """Obter detalhes de um item específico"""
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do item inválido"
            )
        
        item = await db.store_items.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item não encontrado"
            )
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(item))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar item: {str(e)}"
        )

@store_router.post("/items/{item_id}/purchase", response_model=PurchaseResponse)
async def purchase_item(
    item_id: str,
    purchase_data: PurchaseRequest,
    current_user: dict = Depends(get_current_user)
):
    """Comprar um item da loja"""
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do item inválido"
            )
        
        # Verificar se o item existe
        item = await db.store_items.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item não encontrado"
            )
        
        # Verificar se o usuário tem PCons suficientes
        total_cost = item["price"] * purchase_data.quantity
        if current_user["pcons"] < total_cost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PCons insuficientes para esta compra"
            )
        
        # Verificar requisitos do item
        if item.get("requirements"):
            requirements = item["requirements"]
            
            # Verificar rank mínimo
            if "min_rank" in requirements:
                user_rank = current_user.get("rank", "bronze")
                rank_order = ["bronze", "silver", "gold", "platinum", "diamond"]
                user_rank_index = rank_order.index(user_rank)
                min_rank_index = rank_order.index(requirements["min_rank"])
                
                if user_rank_index < min_rank_index:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Rank mínimo necessário: {requirements['min_rank']}"
                    )
            
            # Verificar se já possui o item (para itens únicos)
            if requirements.get("unique", False):
                existing_item = await db.user_inventory.find_one({
                    "user_id": current_user["_id"],
                    "item_id": ObjectId(item_id)
                })
                if existing_item:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Você já possui este item único"
                    )
        
        # Processar a compra
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                # Deduzir PCons do usuário
                await db.users.update_one(
                    {"_id": current_user["_id"]},
                    {"$inc": {"pcons": -total_cost}},
                    session=session
                )
                
                # Adicionar item ao inventário
                inventory_data = {
                    "user_id": current_user["_id"],
                    "item_id": ObjectId(item_id),
                    "quantity": purchase_data.quantity,
                    "acquired_at": datetime.utcnow()
                }
                
                # Verificar se já existe no inventário
                existing_inventory = await db.user_inventory.find_one({
                    "user_id": current_user["_id"],
                    "item_id": ObjectId(item_id)
                })
                
                if existing_inventory:
                    # Atualizar quantidade
                    await db.user_inventory.update_one(
                        {"_id": existing_inventory["_id"]},
                        {"$inc": {"quantity": purchase_data.quantity}},
                        session=session
                    )
                    inventory_id = existing_inventory["_id"]
                else:
                    # Criar novo item no inventário
                    result = await db.user_inventory.insert_one(inventory_data, session=session)
                    inventory_id = result.inserted_id
                
                # Registrar a compra
                purchase_data = {
                    "user_id": current_user["_id"],
                    "item_id": ObjectId(item_id),
                    "quantity": purchase_data.quantity,
                    "total_cost": total_cost,
                    "purchased_at": datetime.utcnow()
                }
                
                purchase_result = await db.purchases.insert_one(purchase_data, session=session)
                
                # Aplicar efeitos do item se houver
                if item.get("effects"):
                    await apply_item_effects(current_user["_id"], item["effects"], session)
                
                await session.commit_transaction()
        
        # Buscar dados completos para resposta
        purchase = await db.purchases.find_one({"_id": purchase_result.inserted_id})
        purchase["item"] = item
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(purchase))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar compra: {str(e)}"
        )

@store_router.get("/inventory", response_model=List[InventoryItem])
async def get_user_inventory(current_user: dict = Depends(get_current_user)):
    """Obter inventário do usuário"""
    try:
        # Buscar itens do inventário com detalhes dos itens
        pipeline = [
            {"$match": {"user_id": current_user["_id"]}},
            {
                "$lookup": {
                    "from": "store_items",
                    "localField": "item_id",
                    "foreignField": "_id",
                    "as": "item"
                }
            },
            {"$unwind": "$item"},
            {"$sort": {"acquired_at": -1}}
        ]
        
        inventory = await db.user_inventory.aggregate(pipeline).to_list(1000)
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(inventory))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar inventário: {str(e)}"
        )

@store_router.get("/purchases", response_model=List[PurchaseResponse])
async def get_purchase_history(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    """Obter histórico de compras do usuário"""
    try:
        # Buscar compras com detalhes dos itens
        pipeline = [
            {"$match": {"user_id": current_user["_id"]}},
            {
                "$lookup": {
                    "from": "store_items",
                    "localField": "item_id",
                    "foreignField": "_id",
                    "as": "item"
                }
            },
            {"$unwind": "$item"},
            {"$sort": {"purchased_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        purchases = await db.purchases.aggregate(pipeline).to_list(limit)
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(purchases))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar histórico de compras: {str(e)}"
        )

@store_router.get("/balance")
async def get_user_balance(current_user: dict = Depends(get_current_user)):
    """Obter saldo de PCons do usuário"""
    try:
        user = await db.users.find_one({"_id": current_user["_id"]})
        return {"pcons": user.get("pcons", 0)}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar saldo: {str(e)}"
        )

# Função auxiliar para aplicar efeitos dos itens
async def apply_item_effects(user_id: ObjectId, effects: dict, session):
    """Aplicar efeitos de um item comprado"""
    try:
        updates = {}
        
        # Aplicar badges
        if "badges" in effects:
            updates["$addToSet"] = {"badges": {"$each": effects["badges"]}}
        
        # Aplicar temas
        if "themes" in effects:
            updates["$addToSet"] = {"themes": {"$each": effects["themes"]}}
        
        # Aplicar recursos especiais
        if "features" in effects:
            updates["$addToSet"] = {"special_features": {"$each": effects["features"]}}
        
        # Aplicar customizações
        if "customizations" in effects:
            updates["$addToSet"] = {"customizations": {"$each": effects["customizations"]}}
        
        if updates:
            await db.users.update_one(
                {"_id": user_id},
                updates,
                session=session
            )
            
    except Exception as e:
        print(f"Erro ao aplicar efeitos do item: {str(e)}")

# Endpoints de Admin (apenas para administradores)
@store_router.post("/admin/seed")
async def seed_store_items(current_user: dict = Depends(get_current_user)):
    """Popular a loja com itens padrão (apenas admin)"""
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        # Verificar se já existem itens
        existing_count = await db.store_items.count_documents({})
        if existing_count > 0:
            return {"message": "Loja já possui itens", "count": existing_count}
        
        # Itens padrão da loja
        default_items = [
            {
                "name": "Badge Iniciante",
                "description": "Badge especial para novos membros da comunidade",
                "price": 100,
                "item_type": "badge",
                "rarity": "common",
                "image_url": "/badges/beginner.png",
                "effects": {
                    "badges": ["beginner_badge"]
                },
                "requirements": {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "name": "Tema Escuro Premium",
                "description": "Tema escuro personalizado para a interface",
                "price": 250,
                "item_type": "theme",
                "rarity": "rare",
                "image_url": "/themes/dark_premium.png",
                "effects": {
                    "themes": ["dark_premium"]
                },
                "requirements": {"min_rank": "silver"},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "name": "Recurso de Upload Avançado",
                "description": "Permite upload de arquivos maiores e mais tipos",
                "price": 500,
                "item_type": "feature",
                "rarity": "epic",
                "image_url": "/features/advanced_upload.png",
                "effects": {
                    "features": ["advanced_upload"]
                },
                "requirements": {"min_rank": "gold"},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "name": "Avatar Personalizado",
                "description": "Avatar único e personalizado para seu perfil",
                "price": 1000,
                "item_type": "customization",
                "rarity": "legendary",
                "image_url": "/customizations/unique_avatar.png",
                "effects": {
                    "customizations": ["unique_avatar"]
                },
                "requirements": {"min_rank": "platinum", "unique": True},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        result = await db.store_items.insert_many(default_items)
        
        return {
            "message": "Loja populada com sucesso",
            "items_created": len(result.inserted_ids)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao popular loja: {str(e)}"
        )

@store_router.post("/admin/items")
async def create_store_item(
    item_data: StoreItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """Criar novo item na loja (apenas admin)"""
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        item_dict = item_data.dict()
        item_dict["created_at"] = datetime.utcnow()
        item_dict["updated_at"] = datetime.utcnow()
        
        result = await db.store_items.insert_one(item_dict)
        
        # Buscar o item criado
        created_item = await db.store_items.find_one({"_id": result.inserted_id})
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(created_item))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar item: {str(e)}"
        )

@store_router.put("/admin/items/{item_id}")
async def update_store_item(
    item_id: str,
    item_data: StoreItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """Atualizar item da loja (apenas admin)"""
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        if not ObjectId.is_valid(item_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do item inválido"
            )
        
        update_data = item_data.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.store_items.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item não encontrado"
            )
        
        # Buscar o item atualizado
        updated_item = await db.store_items.find_one({"_id": ObjectId(item_id)})
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(updated_item))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar item: {str(e)}"
        )

@store_router.delete("/admin/items/{item_id}")
async def delete_store_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Excluir item da loja (apenas admin)"""
    try:
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        if not ObjectId.is_valid(item_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do item inválido"
            )
        
        # Verificar se há usuários com este item no inventário
        inventory_count = await db.user_inventory.count_documents({"item_id": ObjectId(item_id)})
        if inventory_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível excluir item que já foi comprado por usuários"
            )
        
        result = await db.store_items.delete_one({"_id": ObjectId(item_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item não encontrado"
            )
        
        return {"message": "Item excluído com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir item: {str(e)}"
        )
