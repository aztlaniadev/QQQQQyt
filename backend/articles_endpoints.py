from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from bson import ObjectId
import json
from bson import json_util

from server import get_current_user, db

articles_router = APIRouter(prefix="/api/articles", tags=["articles"])

# Modelos Pydantic
class ArticleCreate(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category: str  # tutorial, news, opinion, review, interview, case_study
    tags: List[str] = []
    cover_image_url: Optional[str] = None
    is_published: bool = False

class ArticleResponse(BaseModel):
    id: str
    title: str
    content: str
    summary: Optional[str] = None
    category: str
    tags: List[str] = []
    cover_image_url: Optional[str] = None
    author_id: str
    author_username: str
    author_rank: Optional[str] = None
    is_published: bool
    views: int
    upvotes: int
    downvotes: int
    comments_count: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image_url: Optional[str] = None
    is_published: Optional[bool] = None

class ArticleVote(BaseModel):
    vote_type: str  # up, down

class ArticleComment(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None

class ArticleCommentResponse(BaseModel):
    id: str
    article_id: str
    author_id: str
    author_username: str
    author_rank: Optional[str] = None
    content: str
    parent_comment_id: Optional[str] = None
    upvotes: int
    downvotes: int
    created_at: datetime
    updated_at: datetime

# Endpoints
@articles_router.get("/", response_model=List[ArticleResponse])
async def get_articles(
    category: Optional[str] = None,
    author_id: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated tags
    search: Optional[str] = None,
    is_published: bool = True,
    sort_by: str = "created_at",  # created_at, updated_at, views, upvotes
    sort_order: str = "desc",  # asc, desc
    skip: int = 0,
    limit: int = 20
):
    """Listar artigos com filtros opcionais"""
    try:
        query = {"is_published": is_published}
        
        if category:
            query["category"] = category
        if author_id:
            if ObjectId.is_valid(author_id):
                query["author_id"] = ObjectId(author_id)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ID do autor inválido"
                )
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}},
                {"summary": {"$regex": search, "$options": "i"}}
            ]
        
        # Definir ordenação
        sort_direction = -1 if sort_order == "desc" else 1
        sort_field = sort_by if sort_by in ["created_at", "updated_at", "views", "upvotes"] else "created_at"
        
        # Buscar artigos com dados do autor
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "author_id",
                    "foreignField": "_id",
                    "as": "author"
                }
            },
            {"$unwind": "$author"},
            {
                "$addFields": {
                    "author_username": "$author.username",
                    "author_rank": "$author.rank"
                }
            },
            {
                "$lookup": {
                    "from": "article_comments",
                    "localField": "_id",
                    "foreignField": "article_id",
                    "as": "comments"
                }
            },
            {
                "$addFields": {
                    "comments_count": {"$size": "$comments"}
                }
            },
            {"$sort": {sort_field: sort_direction}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        articles = await db.articles.aggregate(pipeline).to_list(limit)
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(articles))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar artigos: {str(e)}"
        )

@articles_router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str):
    """Obter detalhes de um artigo específico"""
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do artigo inválido"
            )
        
        # Buscar artigo com dados do autor
        pipeline = [
            {"$match": {"_id": ObjectId(article_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "author_id",
                    "foreignField": "_id",
                    "as": "author"
                }
            },
            {"$unwind": "$author"},
            {
                "$addFields": {
                    "author_username": "$author.username",
                    "author_rank": "$author.rank"
                }
            },
            {
                "$lookup": {
                    "from": "article_comments",
                    "localField": "_id",
                    "foreignField": "article_id",
                    "as": "comments"
                }
            },
            {
                "$addFields": {
                    "comments_count": {"$size": "$comments"}
                }
            }
        ]
        
        articles = await db.articles.aggregate(pipeline).to_list(1)
        if not articles:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        article = articles[0]
        
        # Incrementar visualizações
        await db.articles.update_one(
            {"_id": ObjectId(article_id)},
            {"$inc": {"views": 1}}
        )
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(article))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar artigo: {str(e)}"
        )

@articles_router.post("/", response_model=ArticleResponse)
async def create_article(
    article_data: ArticleCreate,
    current_user: dict = Depends(get_current_user)
):
    """Criar novo artigo"""
    try:
        # Verificar se o usuário tem rank suficiente para publicar
        if article_data.is_published:
            user_rank = current_user.get("rank", "bronze")
            rank_order = ["bronze", "silver", "gold", "platinum", "diamond"]
            user_rank_index = rank_order.index(user_rank)
            
            # Bronze e Silver podem criar rascunhos, Gold+ pode publicar
            if user_rank_index < 2:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Rank Gold ou superior necessário para publicar artigos"
                )
        
        article_dict = article_data.dict()
        article_dict["author_id"] = current_user["_id"]
        article_dict["views"] = 0
        article_dict["upvotes"] = 0
        article_dict["downvotes"] = 0
        article_dict["created_at"] = datetime.utcnow()
        article_dict["updated_at"] = datetime.utcnow()
        
        if article_data.is_published:
            article_dict["published_at"] = datetime.utcnow()
        
        result = await db.articles.insert_one(article_dict)
        
        # Buscar o artigo criado
        created_article = await db.articles.find_one({"_id": result.inserted_id})
        created_article["author_username"] = current_user["username"]
        created_article["author_rank"] = current_user.get("rank")
        created_article["comments_count"] = 0
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(created_article))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar artigo: {str(e)}"
        )

@articles_router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: str,
    article_data: ArticleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Atualizar artigo (apenas autor)"""
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do artigo inválido"
            )
        
        # Verificar se o artigo existe e se pertence ao usuário
        article = await db.articles.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        if article["author_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o autor pode editar este artigo"
            )
        
        # Verificar se está tentando publicar sem rank suficiente
        if article_data.is_published and not article.get("is_published"):
            user_rank = current_user.get("rank", "bronze")
            rank_order = ["bronze", "silver", "gold", "platinum", "diamond"]
            user_rank_index = rank_order.index(user_rank)
            
            if user_rank_index < 2:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Rank Gold ou superior necessário para publicar artigos"
                )
        
        update_data = article_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Se está sendo publicado pela primeira vez, definir published_at
        if update_data.get("is_published") and not article.get("is_published"):
            update_data["published_at"] = datetime.utcnow()
        
        result = await db.articles.update_one(
            {"_id": ObjectId(article_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        # Buscar o artigo atualizado
        updated_article = await db.articles.find_one({"_id": ObjectId(article_id)})
        updated_article["author_username"] = current_user["username"]
        updated_article["author_rank"] = current_user.get("rank")
        
        # Contar comentários
        comments_count = await db.article_comments.count_documents({"article_id": ObjectId(article_id)})
        updated_article["comments_count"] = comments_count
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(updated_article))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar artigo: {str(e)}"
        )

@articles_router.delete("/{article_id}")
async def delete_article(
    article_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Excluir artigo (apenas autor)"""
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do artigo inválido"
            )
        
        # Verificar se o artigo existe e se pertence ao usuário
        article = await db.articles.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        if article["author_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o autor pode excluir este artigo"
            )
        
        # Verificar se há comentários
        comments_count = await db.article_comments.count_documents({"article_id": ObjectId(article_id)})
        if comments_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível excluir artigo que possui comentários"
            )
        
        result = await db.articles.delete_one({"_id": ObjectId(article_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        return {"message": "Artigo excluído com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir artigo: {str(e)}"
        )

@articles_router.post("/{article_id}/upvote")
async def upvote_article(
    article_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Votar positivamente em um artigo"""
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do artigo inválido"
            )
        
        # Verificar se o artigo existe
        article = await db.articles.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        # Verificar se o usuário não está votando no próprio artigo
        if article["author_id"] == current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível votar no próprio artigo"
            )
        
        # Verificar se já votou
        existing_vote = await db.article_votes.find_one({
            "article_id": ObjectId(article_id),
            "user_id": current_user["_id"]
        })
        
        if existing_vote:
            if existing_vote["vote_type"] == "up":
                # Remover voto positivo
                await db.article_votes.delete_one({"_id": existing_vote["_id"]})
                await db.articles.update_one(
                    {"_id": ObjectId(article_id)},
                    {"$inc": {"upvotes": -1}}
                )
                return {"message": "Voto positivo removido", "action": "removed"}
            else:
                # Mudar de negativo para positivo
                await db.article_votes.update_one(
                    {"_id": existing_vote["_id"]},
                    {"$set": {"vote_type": "up", "updated_at": datetime.utcnow()}}
                )
                await db.articles.update_one(
                    {"_id": ObjectId(article_id)},
                    {"$inc": {"upvotes": 1, "downvotes": -1}}
                )
                return {"message": "Voto alterado para positivo", "action": "changed"}
        else:
            # Criar novo voto positivo
            vote_data = {
                "article_id": ObjectId(article_id),
                "user_id": current_user["_id"],
                "vote_type": "up",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.article_votes.insert_one(vote_data)
            await db.articles.update_one(
                {"_id": ObjectId(article_id)},
                {"$inc": {"upvotes": 1}}
            )
            return {"message": "Voto positivo registrado", "action": "added"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao votar no artigo: {str(e)}"
        )

@articles_router.post("/{article_id}/downvote")
async def downvote_article(
    article_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Votar negativamente em um artigo"""
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do artigo inválido"
            )
        
        # Verificar se o artigo existe
        article = await db.articles.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        # Verificar se o usuário não está votando no próprio artigo
        if article["author_id"] == current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível votar no próprio artigo"
            )
        
        # Verificar se já votou
        existing_vote = await db.article_votes.find_one({
            "article_id": ObjectId(article_id),
            "user_id": current_user["_id"]
        })
        
        if existing_vote:
            if existing_vote["vote_type"] == "down":
                # Remover voto negativo
                await db.article_votes.delete_one({"_id": existing_vote["_id"]})
                await db.articles.update_one(
                    {"_id": ObjectId(article_id)},
                    {"$inc": {"downvotes": -1}}
                )
                return {"message": "Voto negativo removido", "action": "removed"}
            else:
                # Mudar de positivo para negativo
                await db.article_votes.update_one(
                    {"_id": existing_vote["_id"]},
                    {"$set": {"vote_type": "down", "updated_at": datetime.utcnow()}}
                )
                await db.articles.update_one(
                    {"_id": ObjectId(article_id)},
                    {"$inc": {"downvotes": 1, "upvotes": -1}}
                )
                return {"message": "Voto alterado para negativo", "action": "changed"}
        else:
            # Criar novo voto negativo
            vote_data = {
                "article_id": ObjectId(article_id),
                "user_id": current_user["_id"],
                "vote_type": "down",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.article_votes.insert_one(vote_data)
            await db.articles.update_one(
                {"_id": ObjectId(article_id)},
                {"$inc": {"downvotes": 1}}
            )
            return {"message": "Voto negativo registrado", "action": "added"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao votar no artigo: {str(e)}"
        )

@articles_router.post("/{article_id}/comments", response_model=ArticleCommentResponse)
async def create_article_comment(
    article_id: str,
    comment_data: ArticleComment,
    current_user: dict = Depends(get_current_user)
):
    """Criar comentário em um artigo"""
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do artigo inválido"
            )
        
        # Verificar se o artigo existe
        article = await db.articles.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artigo não encontrado"
            )
        
        # Verificar comentário pai se fornecido
        if comment_data.parent_comment_id:
            if not ObjectId.is_valid(comment_data.parent_comment_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ID do comentário pai inválido"
                )
            
            parent_comment = await db.article_comments.find_one({
                "_id": ObjectId(comment_data.parent_comment_id)
            })
            if not parent_comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comentário pai não encontrado"
                )
        
        # Criar comentário
        comment_dict = comment_data.dict()
        comment_dict["article_id"] = ObjectId(article_id)
        comment_dict["author_id"] = current_user["_id"]
        comment_dict["upvotes"] = 0
        comment_dict["downvotes"] = 0
        comment_dict["created_at"] = datetime.utcnow()
        comment_dict["updated_at"] = datetime.utcnow()
        
        result = await db.article_comments.insert_one(comment_dict)
        
        # Buscar comentário criado
        created_comment = await db.article_comments.find_one({"_id": result.inserted_id})
        created_comment["author_username"] = current_user["username"]
        created_comment["author_rank"] = current_user.get("rank")
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(created_comment))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar comentário: {str(e)}"
        )

@articles_router.get("/{article_id}/comments", response_model=List[ArticleCommentResponse])
async def get_article_comments(
    article_id: str,
    skip: int = 0,
    limit: int = 50
):
    """Obter comentários de um artigo"""
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do artigo inválido"
            )
        
        # Buscar comentários com dados dos autores
        pipeline = [
            {"$match": {"article_id": ObjectId(article_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "author_id",
                    "foreignField": "_id",
                    "as": "author"
                }
            },
            {"$unwind": "$author"},
            {
                "$addFields": {
                    "author_username": "$author.username",
                    "author_rank": "$author.rank"
                }
            },
            {"$sort": {"created_at": 1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        comments = await db.article_comments.aggregate(pipeline).to_list(limit)
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(comments))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar comentários: {str(e)}"
        )

# Endpoints de estatísticas
@articles_router.get("/stats/overview")
async def get_articles_overview():
    """Obter visão geral das estatísticas dos artigos"""
    try:
        # Total de artigos
        total_articles = await db.articles.count_documents({})
        published_articles = await db.articles.count_documents({"is_published": True})
        draft_articles = await db.articles.count_documents({"is_published": False})
        
        # Total de visualizações
        total_views = await db.articles.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$views"}}}
        ]).to_list(1)
        total_views = total_views[0]["total"] if total_views else 0
        
        # Total de votos
        total_upvotes = await db.articles.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$upvotes"}}}
        ]).to_list(1)
        total_upvotes = total_upvotes[0]["total"] if total_upvotes else 0
        
        total_downvotes = await db.articles.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$downvotes"}}}
        ]).to_list(1)
        total_downvotes = total_downvotes[0]["total"] if total_downvotes else 0
        
        # Total de comentários
        total_comments = await db.article_comments.count_documents({})
        
        # Artigos por categoria
        category_stats = await db.articles.aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(100)
        
        return {
            "total_articles": total_articles,
            "published_articles": published_articles,
            "draft_articles": draft_articles,
            "total_views": total_views,
            "total_upvotes": total_upvotes,
            "total_downvotes": total_downvotes,
            "total_comments": total_comments,
            "articles_by_category": category_stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar estatísticas: {str(e)}"
        )

@articles_router.get("/stats/trending")
async def get_trending_articles(limit: int = 10):
    """Obter artigos em tendência (mais visualizados/votados recentemente)"""
    try:
        # Artigos mais visualizados na última semana
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        
        trending_articles = await db.articles.aggregate([
            {"$match": {"is_published": True, "created_at": {"$gte": one_week_ago}}},
            {
                "$addFields": {
                    "score": {
                        "$add": [
                            "$views",
                            {"$multiply": ["$upvotes", 10]},
                            {"$multiply": ["$downvotes", -5]}
                        ]
                    }
                }
            },
            {"$sort": {"score": -1}},
            {"$limit": limit}
        ]).to_list(limit)
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(trending_articles))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar artigos em tendência: {str(e)}"
        )
