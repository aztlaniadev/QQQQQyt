from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = "acode-lab-secret-key-2025"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="Acode Lab API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class UserRank(str, Enum):
    INICIANTE = "Iniciante"
    COLABORADOR = "Colaborador"
    ESPECIALISTA = "Especialista"
    MESTRE = "Mestre"
    GURU = "Guru"

class SubscriptionPlan(str, Enum):
    BASIC = "Basic"
    PRO = "Pro"
    ENTERPRISE = "Enterprise"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    pc_points: int = 0
    pcon_points: int = 0
    rank: UserRank = UserRank.INICIANTE
    is_admin: bool = False
    is_company: bool = False
    is_bot: bool = False
    is_banned: bool = False
    is_muted: bool = False
    is_silenced: bool = False
    ban_reason: str = ""
    ban_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    bio: str = ""
    location: str = ""
    website: str = ""
    github: str = ""
    linkedin: str = ""
    skills: List[str] = []
    experience: str = ""
    portfolio_projects: List[dict] = []
    following: List[str] = []
    followers: List[str] = []
    achievements: List[str] = []

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    description: str = ""
    website: str = ""
    location: str = ""
    size: str = ""
    subscription_plan: SubscriptionPlan = SubscriptionPlan.BASIC
    subscription_expires: Optional[datetime] = None
    is_banned: bool = False
    ban_reason: str = ""
    ban_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    bio: Optional[str] = ""
    location: Optional[str] = ""

class CompanyCreate(BaseModel):
    name: str
    email: str
    password: str
    description: Optional[str] = ""
    website: Optional[str] = ""
    location: Optional[str] = ""
    size: Optional[str] = ""

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    pc_points: int
    pcon_points: int
    rank: UserRank
    bio: str
    location: str
    website: str
    github: str
    linkedin: str
    skills: List[str]
    experience: str
    portfolio_projects: List[dict]
    following: List[str]
    followers: List[str]
    achievements: List[str]
    is_admin: bool = False
    is_company: bool = False
    created_at: datetime

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    code: str = ""
    tags: List[str] = []
    author_id: str
    author_username: str
    upvotes: int = 0
    downvotes: int = 0
    answers_count: int = 0
    views: int = 0
    is_featured: bool = False
    featured_until: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class QuestionCreate(BaseModel):
    title: str
    content: str
    code: Optional[str] = ""
    tags: List[str] = []

class Answer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    code: str = ""
    question_id: str
    author_id: str
    author_username: str
    upvotes: int = 0
    downvotes: int = 0
    is_accepted: bool = False
    is_validated: bool = False
    validated_by: Optional[str] = None
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnswerCreate(BaseModel):
    content: str
    code: Optional[str] = ""
    question_id: str

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    target_id: str  # question_id or answer_id
    target_type: str  # "question" or "answer"
    author_id: str
    author_username: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommentCreate(BaseModel):
    content: str
    target_id: str
    target_type: str

class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    excerpt: str = ""
    tags: List[str] = []
    author_id: str
    author_username: str
    published: bool = False
    upvotes: int = 0
    downvotes: int = 0
    views: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ArticleCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = ""
    tags: List[str] = []
    published: bool = False

class Post(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    author_id: str
    author_username: str
    post_type: str = "text"  # text, project, achievement
    metadata: dict = {}
    likes: int = 0
    comments_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PostCreate(BaseModel):
    content: str
    post_type: str = "text"
    metadata: dict = {}

class Vote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    target_id: str
    target_type: str
    vote_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoteRequest(BaseModel):
    target_id: str
    target_type: str
    vote_type: str

class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    requirements: str
    salary_range: str = ""
    location: str = ""
    remote: bool = False
    company_id: str
    company_name: str
    tags: List[str] = []
    applications_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))

class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str
    salary_range: Optional[str] = ""
    location: Optional[str] = ""
    remote: bool = False
    tags: List[str] = []

# New Admin Models
class BotUserCreate(BaseModel):
    username: str
    email: str
    pc_points: int = 100
    pcon_points: int = 50
    rank: UserRank = UserRank.COLABORADOR
    bio: str = ""
    location: str = ""
    skills: List[str] = []

class UserModeration(BaseModel):
    user_id: str
    action: str  # ban, unban, mute, unmute, silence, unsilence
    reason: str = ""
    expires: Optional[datetime] = None

class PointsUpdate(BaseModel):
    user_id: str
    pc_points: Optional[int] = None
    pcon_points: Optional[int] = None
    
class CompanyModeration(BaseModel):
    company_id: str
    action: str  # ban, unban
    reason: str = ""
    expires: Optional[datetime] = None

class StoreItem(BaseModel):
    id: str
    name: str
    description: str
    cost_pcon: int
    category: str
    metadata: dict = {}

class Purchase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    item_id: str
    item_name: str
    cost_pcon: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Store items definition
STORE_ITEMS = [
    StoreItem(id="feature_question", name="Destacar Pergunta", description="Destaque sua pergunta por 7 dias", cost_pcon=50, category="features"),
    StoreItem(id="custom_badge", name="Badge Personalizado", description="Crie um badge único para seu perfil", cost_pcon=100, category="cosmetic"),
    StoreItem(id="premium_content", name="Conteúdo Premium", description="Acesso a artigos exclusivos por 30 dias", cost_pcon=200, category="premium"),
    StoreItem(id="direct_messages", name="Mensagens Ilimitadas", description="Envie mensagens diretas ilimitadas por 30 dias", cost_pcon=150, category="features"),
    StoreItem(id="profile_theme", name="Tema de Perfil", description="Personalize as cores do seu perfil", cost_pcon=75, category="cosmetic"),
]

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            user = await db.companies.find_one({"id": user_id})
            if user:
                user["is_company"] = True
        
        if user is None:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def calculate_rank(pc_points: int) -> UserRank:
    if pc_points >= 5000:
        return UserRank.GURU
    elif pc_points >= 2000:
        return UserRank.MESTRE
    elif pc_points >= 500:
        return UserRank.ESPECIALISTA
    elif pc_points >= 100:
        return UserRank.COLABORADOR
    else:
        return UserRank.INICIANTE

async def update_user_points(user_id: str, pc_delta: int = 0, pcon_delta: int = 0):
    user = await db.users.find_one({"id": user_id})
    if user:
        new_pc = max(0, user["pc_points"] + pc_delta)
        new_pcon = max(0, user["pcon_points"] + pcon_delta)
        new_rank = calculate_rank(new_pc)
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "pc_points": new_pc,
                "pcon_points": new_pcon,
                "rank": new_rank.value
            }}
        )

async def add_achievement(user_id: str, achievement: str):
    await db.users.update_one(
        {"id": user_id},
        {"$addToSet": {"achievements": achievement}}
    )

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Nome de usuário já existe")
    
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        bio=user_data.bio or "",
        location=user_data.location or "",
        pcon_points=50
    )
    
    await db.users.insert_one(user.dict())
    await add_achievement(user.id, "first_join")
    
    token = create_jwt_token(user.id)
    return {"token": token, "user": UserResponse(**user.dict())}

@api_router.post("/auth/register-company")
async def register_company(company_data: CompanyCreate):
    existing_company = await db.companies.find_one({"email": company_data.email})
    if existing_company:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    company = Company(
        name=company_data.name,
        email=company_data.email,
        password_hash=hash_password(company_data.password),
        description=company_data.description or "",
        website=company_data.website or "",
        location=company_data.location or "",
        size=company_data.size or ""
    )
    
    await db.companies.insert_one(company.dict())
    
    token = create_jwt_token(company.id)
    return {"token": token, "company": company.dict()}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        # Try company login
        company = await db.companies.find_one({"email": login_data.email})
        if not company or not verify_password(login_data.password, company["password_hash"]):
            raise HTTPException(status_code=401, detail="Email ou senha incorretos")
        
        token = create_jwt_token(company["id"])
        company["is_company"] = True
        return {"token": token, "user": company}
    
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_jwt_token(user["id"])
    return {"token": token, "user": UserResponse(**user)}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        return current_user
    return UserResponse(**current_user)

# User Profile Routes
@api_router.put("/users/profile")
async def update_profile(profile_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Apenas usuários podem atualizar perfil")
    
    allowed_fields = ["bio", "location", "website", "github", "linkedin", "skills", "experience", "portfolio_projects"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    return {"message": "Perfil atualizado com sucesso"}

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Empresas não podem seguir usuários")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Não é possível seguir a si mesmo")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Add to following list
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$addToSet": {"following": user_id}}
    )
    
    # Add to followers list
    await db.users.update_one(
        {"id": user_id},
        {"$addToSet": {"followers": current_user["id"]}}
    )
    
    return {"message": "Usuário seguido com sucesso"}

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Empresas não podem seguir usuários")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$pull": {"following": user_id}}
    )
    
    await db.users.update_one(
        {"id": user_id},
        {"$pull": {"followers": current_user["id"]}}
    )
    
    return {"message": "Deixou de seguir o usuário"}

# Question Routes
@api_router.post("/questions", response_model=Question)
async def create_question(question_data: QuestionCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Empresas não podem fazer perguntas")
    
    question = Question(
        title=question_data.title,
        content=question_data.content,
        code=question_data.code or "",
        tags=question_data.tags,
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.questions.insert_one(question.dict())
    await update_user_points(current_user["id"], pcon_delta=5)
    
    # Check for first question achievement
    user_questions = await db.questions.count_documents({"author_id": current_user["id"]})
    if user_questions == 1:
        await add_achievement(current_user["id"], "first_question")
    
    return question

@api_router.get("/questions", response_model=List[Question])
async def get_questions(skip: int = 0, limit: int = 20, featured: bool = False):
    query = {}
    if featured:
        query["is_featured"] = True
        query["featured_until"] = {"$gt": datetime.utcnow()}
    
    questions = await db.questions.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Question(**q) for q in questions]

@api_router.get("/questions/{question_id}", response_model=Question)
async def get_question(question_id: str):
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    await db.questions.update_one(
        {"id": question_id},
        {"$inc": {"views": 1}}
    )
    question["views"] += 1
    
    return Question(**question)

# Answer Routes
@api_router.post("/answers", response_model=Answer)
async def create_answer(answer_data: AnswerCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Empresas não podem responder perguntas")
    
    question = await db.questions.find_one({"id": answer_data.question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    answer = Answer(
        content=answer_data.content,
        code=answer_data.code or "",
        question_id=answer_data.question_id,
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.answers.insert_one(answer.dict())
    
    await db.questions.update_one(
        {"id": answer_data.question_id},
        {"$inc": {"answers_count": 1}}
    )
    
    # Check for first answer achievement
    user_answers = await db.answers.count_documents({"author_id": current_user["id"]})
    if user_answers == 1:
        await add_achievement(current_user["id"], "first_answer")
    
    return answer

@api_router.get("/questions/{question_id}/answers", response_model=List[Answer])
async def get_answers(question_id: str):
    answers = await db.answers.find({"question_id": question_id}).sort("created_at", 1).to_list(1000)
    return [Answer(**a) for a in answers]

@api_router.post("/answers/{answer_id}/accept")
async def accept_answer(answer_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Empresas não podem aceitar respostas")
    
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    
    question = await db.questions.find_one({"id": answer["question_id"]})
    if question["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Apenas o autor da pergunta pode aceitar respostas")
    
    if not answer["is_validated"]:
        raise HTTPException(status_code=400, detail="Apenas respostas validadas podem ser aceitas")
    
    await db.answers.update_many(
        {"question_id": answer["question_id"]},
        {"$set": {"is_accepted": False}}
    )
    
    await db.answers.update_one(
        {"id": answer_id},
        {"$set": {"is_accepted": True}}
    )
    
    await update_user_points(answer["author_id"], pc_delta=15, pcon_delta=25)
    await add_achievement(answer["author_id"], "first_accepted_answer")
    
    return {"message": "Resposta aceita com sucesso"}

# Comment Routes
@api_router.post("/comments", response_model=Comment)
async def create_comment(comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        username = current_user["name"]
    else:
        username = current_user["username"]
    
    comment = Comment(
        content=comment_data.content,
        target_id=comment_data.target_id,
        target_type=comment_data.target_type,
        author_id=current_user["id"],
        author_username=username
    )
    
    await db.comments.insert_one(comment.dict())
    return comment

@api_router.get("/comments/{target_type}/{target_id}")
async def get_comments(target_type: str, target_id: str):
    comments = await db.comments.find({
        "target_type": target_type,
        "target_id": target_id
    }).sort("created_at", 1).to_list(1000)
    return [Comment(**c) for c in comments]

# Article Routes
@api_router.post("/articles", response_model=Article)
async def create_article(article_data: ArticleCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Empresas não podem escrever artigos")
    
    # Only Mestre and Guru can write articles
    if current_user["rank"] not in ["Mestre", "Guru"]:
        raise HTTPException(status_code=403, detail="Apenas usuários Mestre ou Guru podem escrever artigos")
    
    article = Article(
        title=article_data.title,
        content=article_data.content,
        excerpt=article_data.excerpt or article_data.content[:200] + "...",
        tags=article_data.tags,
        author_id=current_user["id"],
        author_username=current_user["username"],
        published=article_data.published
    )
    
    await db.articles.insert_one(article.dict())
    
    if article_data.published:
        await update_user_points(current_user["id"], pcon_delta=50)
    
    return article

@api_router.get("/articles")
async def get_articles(skip: int = 0, limit: int = 20, published_only: bool = True):
    query = {"published": True} if published_only else {}
    articles = await db.articles.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Article(**a) for a in articles]

@api_router.get("/articles/{article_id}")
async def get_article(article_id: str):
    article = await db.articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    await db.articles.update_one(
        {"id": article_id},
        {"$inc": {"views": 1}}
    )
    article["views"] += 1
    
    return Article(**article)

# Social Feed Routes
@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        username = current_user["name"]
    else:
        username = current_user["username"]
    
    post = Post(
        content=post_data.content,
        author_id=current_user["id"],
        author_username=username,
        post_type=post_data.post_type,
        metadata=post_data.metadata
    )
    
    await db.posts.insert_one(post.dict())
    return post

@api_router.get("/feed")
async def get_feed(current_user: dict = Depends(get_current_user), skip: int = 0, limit: int = 20):
    if current_user.get("is_company"):
        # Companies see all posts
        posts = await db.posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    else:
        # Users see posts from followed users
        following = current_user.get("following", [])
        following.append(current_user["id"])  # Include own posts
        
        posts = await db.posts.find({
            "author_id": {"$in": following}
        }).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [Post(**p) for p in posts]

# Store Routes
@api_router.get("/store")
async def get_store_items():
    return STORE_ITEMS

@api_router.post("/store/purchase/{item_id}")
async def purchase_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Empresas não podem comprar itens")
    
    item = next((item for item in STORE_ITEMS if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    if current_user["pcon_points"] < item.cost_pcon:
        raise HTTPException(status_code=400, detail="PCon insuficientes")
    
    # Deduct points
    await update_user_points(current_user["id"], pcon_delta=-item.cost_pcon)
    
    # Record purchase
    purchase = Purchase(
        user_id=current_user["id"],
        item_id=item.id,
        item_name=item.name,
        cost_pcon=item.cost_pcon
    )
    
    await db.purchases.insert_one(purchase.dict())
    
    # Apply item effects
    if item_id == "feature_question":
        # This would be handled when creating a question
        pass
    elif item_id == "custom_badge":
        await add_achievement(current_user["id"], "custom_badge_owner")
    
    return {"message": f"Item '{item.name}' comprado com sucesso!"}

# Job Routes (B2B)
@api_router.post("/jobs", response_model=Job)
async def create_job(job_data: JobCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Apenas empresas podem publicar vagas")
    
    job = Job(
        title=job_data.title,
        description=job_data.description,
        requirements=job_data.requirements,
        salary_range=job_data.salary_range or "",
        location=job_data.location or "",
        remote=job_data.remote,
        company_id=current_user["id"],
        company_name=current_user["name"],
        tags=job_data.tags
    )
    
    await db.jobs.insert_one(job.dict())
    return job

@api_router.get("/jobs")
async def get_jobs(skip: int = 0, limit: int = 20, remote: Optional[bool] = None):
    query = {}
    if remote is not None:
        query["remote"] = remote
    
    jobs = await db.jobs.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Job(**j) for j in jobs]

@api_router.get("/talent-search")
async def search_talent(
    current_user: dict = Depends(get_current_user),
    rank: Optional[str] = None,
    skills: Optional[str] = None,
    location: Optional[str] = None,
    min_pc: Optional[int] = None
):
    if not current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Apenas empresas podem buscar talentos")
    
    query = {}
    if rank:
        query["rank"] = rank
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query["skills"] = {"$in": skill_list}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if min_pc:
        query["pc_points"] = {"$gte": min_pc}
    
    users = await db.users.find(query).sort("pc_points", -1).limit(50).to_list(50)
    
    # Return public profile data only
    return [{
        "id": user["id"],
        "username": user["username"],
        "rank": user["rank"],
        "pc_points": user["pc_points"],
        "location": user["location"],
        "skills": user.get("skills", []),
        "bio": user["bio"],
        "achievements": user.get("achievements", [])
    } for user in users]

# Voting Routes
@api_router.post("/vote")
async def vote(vote_data: VoteRequest, current_user: dict = Depends(get_current_user)):
    existing_vote = await db.votes.find_one({
        "user_id": current_user["id"],
        "target_id": vote_data.target_id,
        "target_type": vote_data.target_type
    })
    
    if existing_vote:
        await db.votes.delete_one({"id": existing_vote["id"]})
        
        field = "upvotes" if existing_vote["vote_type"] == "upvote" else "downvotes"
        collection = db.questions if vote_data.target_type == "question" else db.articles if vote_data.target_type == "article" else db.answers
        await collection.update_one(
            {"id": vote_data.target_id},
            {"$inc": {field: -1}}
        )
        
        if existing_vote["vote_type"] == vote_data.vote_type:
            return {"message": "Voto removido"}
    
    vote = Vote(
        user_id=current_user["id"],
        target_id=vote_data.target_id,
        target_type=vote_data.target_type,
        vote_type=vote_data.vote_type
    )
    
    await db.votes.insert_one(vote.dict())
    
    field = "upvotes" if vote_data.vote_type == "upvote" else "downvotes"
    collection = db.questions if vote_data.target_type == "question" else db.articles if vote_data.target_type == "article" else db.answers
    await collection.update_one(
        {"id": vote_data.target_id},
        {"$inc": {field: 1}}
    )
    
    # Award/deduct points for content author
    target = await collection.find_one({"id": vote_data.target_id})
    if target and target["author_id"] != current_user["id"]:
        if vote_data.vote_type == "upvote":
            await update_user_points(target["author_id"], pc_delta=2, pcon_delta=1)
        else:
            await update_user_points(target["author_id"], pc_delta=-1)
    
    return {"message": f"{vote_data.vote_type.capitalize()} registrado"}

@api_router.get("/users/{user_id}/votes/{target_id}")
async def get_user_vote(user_id: str, target_id: str):
    vote = await db.votes.find_one({"user_id": user_id, "target_id": target_id})
    return {"vote_type": vote["vote_type"] if vote else None}

# Enhanced Admin Routes
@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user), skip: int = 0, limit: int = 50):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    users = await db.users.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total_users = await db.users.count_documents({})
    
    return {
        "users": [UserResponse(**user) for user in users],
        "total": total_users,
        "page": skip // limit + 1,
        "total_pages": (total_users + limit - 1) // limit
    }

@api_router.get("/admin/companies")
async def get_all_companies(current_user: dict = Depends(get_current_user), skip: int = 0, limit: int = 50):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    companies = await db.companies.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total_companies = await db.companies.count_documents({})
    
    return {
        "companies": companies,
        "total": total_companies,
        "page": skip // limit + 1,
        "total_pages": (total_companies + limit - 1) // limit
    }

@api_router.post("/admin/create-bot")
async def create_bot_user(bot_data: BotUserCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    # Check if email or username already exists
    existing_user = await db.users.find_one({"$or": [{"email": bot_data.email}, {"username": bot_data.username}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ou username já existe")
    
    # Create bot user
    bot_user = User(
        username=bot_data.username,
        email=bot_data.email,
        password_hash=hash_password("bot_password_" + str(uuid.uuid4())),  # Random password
        pc_points=bot_data.pc_points,
        pcon_points=bot_data.pcon_points,
        rank=bot_data.rank,
        is_bot=True,
        bio=bot_data.bio or f"Bot criado para engajamento - {bot_data.username}",
        location=bot_data.location,
        skills=bot_data.skills,
        achievements=["bot_account"]
    )
    
    await db.users.insert_one(bot_user.dict())
    return {"message": f"Bot {bot_data.username} criado com sucesso!", "bot_id": bot_user.id}

@api_router.post("/admin/moderate-user")
async def moderate_user(moderation: UserModeration, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    user = await db.users.find_one({"id": moderation.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    update_data = {}
    
    if moderation.action == "ban":
        update_data = {
            "is_banned": True,
            "ban_reason": moderation.reason,
            "ban_expires": moderation.expires
        }
    elif moderation.action == "unban":
        update_data = {
            "is_banned": False,
            "ban_reason": "",
            "ban_expires": None
        }
    elif moderation.action == "mute":
        update_data = {
            "is_muted": True,
            "ban_reason": moderation.reason,
            "ban_expires": moderation.expires
        }
    elif moderation.action == "unmute":
        update_data = {
            "is_muted": False
        }
    elif moderation.action == "silence":
        update_data = {
            "is_silenced": True,
            "ban_reason": moderation.reason,
            "ban_expires": moderation.expires
        }
    elif moderation.action == "unsilence":
        update_data = {
            "is_silenced": False
        }
    else:
        raise HTTPException(status_code=400, detail="Ação inválida")
    
    await db.users.update_one({"id": moderation.user_id}, {"$set": update_data})
    
    return {"message": f"Usuário {moderation.action}do com sucesso!"}

@api_router.post("/admin/update-points")
async def update_user_points_admin(points_update: PointsUpdate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    user = await db.users.find_one({"id": points_update.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    update_data = {}
    if points_update.pc_points is not None:
        update_data["pc_points"] = max(0, points_update.pc_points)
        update_data["rank"] = calculate_rank(points_update.pc_points).value
    
    if points_update.pcon_points is not None:
        update_data["pcon_points"] = max(0, points_update.pcon_points)
    
    await db.users.update_one({"id": points_update.user_id}, {"$set": update_data})
    
    return {"message": "Pontos atualizados com sucesso!"}

@api_router.post("/admin/moderate-company")
async def moderate_company(moderation: CompanyModeration, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    company = await db.companies.find_one({"id": moderation.company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    update_data = {}
    
    if moderation.action == "ban":
        update_data = {
            "is_banned": True,
            "ban_reason": moderation.reason,
            "ban_expires": moderation.expires
        }
    elif moderation.action == "unban":
        update_data = {
            "is_banned": False,
            "ban_reason": "",
            "ban_expires": None
        }
    else:
        raise HTTPException(status_code=400, detail="Ação inválida para empresa")
    
    await db.companies.update_one({"id": moderation.company_id}, {"$set": update_data})
    
    return {"message": f"Empresa {moderation.action}ida com sucesso!"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Delete user and all related content
    await db.users.delete_one({"id": user_id})
    await db.questions.delete_many({"author_id": user_id})
    await db.answers.delete_many({"author_id": user_id})
    await db.articles.delete_many({"author_id": user_id})
    await db.posts.delete_many({"author_id": user_id})
    await db.comments.delete_many({"author_id": user_id})
    await db.votes.delete_many({"user_id": user_id})
    
    return {"message": "Usuário e todo seu conteúdo removidos permanentemente"}

@api_router.delete("/admin/companies/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # Delete company and all related content
    await db.companies.delete_one({"id": company_id})
    await db.jobs.delete_many({"company_id": company_id})
    
    return {"message": "Empresa e todo seu conteúdo removidos permanentemente"}

@api_router.get("/admin/advanced-stats")
async def get_advanced_admin_stats(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    # Basic stats
    total_users = await db.users.count_documents({})
    total_companies = await db.companies.count_documents({})
    total_questions = await db.questions.count_documents({})
    total_answers = await db.answers.count_documents({})
    pending_answers = await db.answers.count_documents({"is_validated": False})
    total_articles = await db.articles.count_documents({"published": True})
    
    # Advanced stats
    banned_users = await db.users.count_documents({"is_banned": True})
    muted_users = await db.users.count_documents({"is_muted": True})
    silenced_users = await db.users.count_documents({"is_silenced": True})
    bot_users = await db.users.count_documents({"is_bot": True})
    banned_companies = await db.companies.count_documents({"is_banned": True})
    
    # Activity stats
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    active_today = await db.users.count_documents({"last_active": {"$gte": today}})
    
    # Top users by PC
    top_users = await db.users.find({"is_banned": False}).sort("pc_points", -1).limit(10).to_list(10)
    
    return {
        "basic_stats": {
            "total_users": total_users,
            "total_companies": total_companies,
            "total_questions": total_questions,
            "total_answers": total_answers,
            "pending_answers": pending_answers,
            "total_articles": total_articles
        },
        "moderation_stats": {
            "banned_users": banned_users,
            "muted_users": muted_users,
            "silenced_users": silenced_users,
            "bot_users": bot_users,
            "banned_companies": banned_companies
        },
        "activity_stats": {
            "active_today": active_today
        },
        "top_users": [{
            "id": user["id"],
            "username": user["username"],
            "pc_points": user["pc_points"],
            "rank": user["rank"],
            "is_bot": user.get("is_bot", False)
        } for user in top_users]
    }
@api_router.get("/admin/answers/pending")
async def get_pending_answers(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    answers = await db.answers.find({"is_validated": False}).sort("created_at", 1).to_list(100)
    return [Answer(**answer) for answer in answers]

@api_router.post("/admin/answers/{answer_id}/validate")
async def validate_answer(answer_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    
    if answer["is_validated"]:
        raise HTTPException(status_code=400, detail="Resposta já foi validada")
    
    await db.answers.update_one(
        {"id": answer_id},
        {"$set": {
            "is_validated": True,
            "validated_by": current_user["id"],
            "validated_at": datetime.utcnow()
        }}
    )
    
    await update_user_points(answer["author_id"], pc_delta=5, pcon_delta=10)
    
    return {"message": "Resposta validada com sucesso. Pontos concedidos ao autor."}

@api_router.post("/admin/answers/{answer_id}/reject")
async def reject_answer(answer_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    
    await db.answers.delete_one({"id": answer_id})
    
    await db.questions.update_one(
        {"id": answer["question_id"]},
        {"$inc": {"answers_count": -1}}
    )
    
    return {"message": "Resposta rejeitada e removida"}

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    total_users = await db.users.count_documents({})
    total_companies = await db.companies.count_documents({})
    total_questions = await db.questions.count_documents({})
    total_answers = await db.answers.count_documents({})
    pending_answers = await db.answers.count_documents({"is_validated": False})
    total_articles = await db.articles.count_documents({"published": True})
    
    return {
        "total_users": total_users,
        "total_companies": total_companies,
        "total_questions": total_questions,
        "total_answers": total_answers,
        "pending_answers": pending_answers,
        "total_articles": total_articles
    }

# User Stats
@api_router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    questions_count = await db.questions.count_documents({"author_id": user_id})
    answers_count = await db.answers.count_documents({"author_id": user_id})
    accepted_answers = await db.answers.count_documents({"author_id": user_id, "is_accepted": True})
    validated_answers = await db.answers.count_documents({"author_id": user_id, "is_validated": True})
    articles_count = await db.articles.count_documents({"author_id": user_id, "published": True})
    
    return {
        "user": UserResponse(**user),
        "questions_count": questions_count,
        "answers_count": answers_count,
        "accepted_answers": accepted_answers,
        "validated_answers": validated_answers,
        "articles_count": articles_count
    }

# Leaderboard Routes
@api_router.get("/leaderboard")
async def get_leaderboard(type: str = "pc", limit: int = 50):
    if type == "pc":
        users = await db.users.find().sort("pc_points", -1).limit(limit).to_list(limit)
    elif type == "pcon":
        users = await db.users.find().sort("pcon_points", -1).limit(limit).to_list(limit)
    else:
        raise HTTPException(status_code=400, detail="Tipo inválido. Use 'pc' ou 'pcon'")
    
    return [{
        "id": user["id"],
        "username": user["username"],
        "rank": user["rank"],
        "pc_points": user["pc_points"],
        "pcon_points": user["pcon_points"],
        "achievements": user.get("achievements", [])
    } for user in users]

# Search Routes
@api_router.get("/search")
async def search(q: str, type: str = "all", limit: int = 20):
    results = {"questions": [], "articles": [], "users": []}
    
    if type in ["all", "questions"]:
        questions = await db.questions.find({
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"content": {"$regex": q, "$options": "i"}},
                {"tags": {"$in": [q.lower()]}}
            ]
        }).limit(limit).to_list(limit)
        results["questions"] = [Question(**q) for q in questions]
    
    if type in ["all", "articles"]:
        articles = await db.articles.find({
            "published": True,
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"content": {"$regex": q, "$options": "i"}},
                {"tags": {"$in": [q.lower()]}}
            ]
        }).limit(limit).to_list(limit)
        results["articles"] = [Article(**a) for a in articles]
    
    if type in ["all", "users"]:
        users = await db.users.find({
            "$or": [
                {"username": {"$regex": q, "$options": "i"}},
                {"skills": {"$in": [q.lower()]}}
            ]
        }).limit(limit).to_list(limit)
        results["users"] = [{
            "id": user["id"],
            "username": user["username"],
            "rank": user["rank"],
            "pc_points": user["pc_points"],
            "skills": user.get("skills", [])
        } for user in users]
    
    return results

# Health check
@api_router.get("/")
async def root():
    return {"message": "Acode Lab API - Sistema Q&A Completo"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()