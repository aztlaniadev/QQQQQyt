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

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    pc_points: int = 0  # Pontos de Classificação (reputação)
    pcon_points: int = 0  # Pontos de Conquista (moeda)
    rank: UserRank = UserRank.INICIANTE
    is_admin: bool = False  # Flag para administrador
    created_at: datetime = Field(default_factory=datetime.utcnow)
    bio: str = ""
    location: str = ""

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    bio: Optional[str] = ""
    location: Optional[str] = ""

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
    created_at: datetime

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    tags: List[str] = []
    author_id: str
    author_username: str
    upvotes: int = 0
    downvotes: int = 0
    answers_count: int = 0
    views: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class QuestionCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class Answer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    question_id: str
    author_id: str
    author_username: str
    upvotes: int = 0
    downvotes: int = 0
    is_accepted: bool = False
    is_validated: bool = False  # Validado por administrador
    validated_by: Optional[str] = None  # ID do admin que validou
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnswerCreate(BaseModel):
    content: str
    question_id: str

class Vote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    target_id: str  # question_id or answer_id
    target_type: str  # "question" or "answer"
    vote_type: str  # "upvote" or "downvote"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoteRequest(BaseModel):
    target_id: str
    target_type: str  # "question" or "answer"
    vote_type: str  # "upvote" or "downvote"

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

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Nome de usuário já existe")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        bio=user_data.bio or "",
        location=user_data.location or "",
        pcon_points=50  # Welcome bonus
    )
    
    await db.users.insert_one(user.dict())
    
    # Create JWT token
    token = create_jwt_token(user.id)
    
    return {
        "token": token,
        "user": UserResponse(**user.dict())
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_jwt_token(user["id"])
    
    return {
        "token": token,
        "user": UserResponse(**user)
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# Question Routes
@api_router.post("/questions", response_model=Question)
async def create_question(question_data: QuestionCreate, current_user: dict = Depends(get_current_user)):
    question = Question(
        title=question_data.title,
        content=question_data.content,
        tags=question_data.tags,
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.questions.insert_one(question.dict())
    
    # Award PCon points for creating question
    await update_user_points(current_user["id"], pcon_delta=5)
    
    return question

@api_router.get("/questions", response_model=List[Question])
async def get_questions(skip: int = 0, limit: int = 20):
    questions = await db.questions.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Question(**q) for q in questions]

@api_router.get("/questions/{question_id}", response_model=Question)
async def get_question(question_id: str):
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    # Increment views
    await db.questions.update_one(
        {"id": question_id},
        {"$inc": {"views": 1}}
    )
    question["views"] += 1
    
    return Question(**question)

# Answer Routes
@api_router.post("/answers", response_model=Answer)
async def create_answer(answer_data: AnswerCreate, current_user: dict = Depends(get_current_user)):
    # Check if question exists
    question = await db.questions.find_one({"id": answer_data.question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    answer = Answer(
        content=answer_data.content,
        question_id=answer_data.question_id,
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.answers.insert_one(answer.dict())
    
    # Update question answer count
    await db.questions.update_one(
        {"id": answer_data.question_id},
        {"$inc": {"answers_count": 1}}
    )
    
    # NÃO CONCEDER PONTOS AUTOMATICAMENTE - apenas após validação por admin
    
    return answer

@api_router.get("/questions/{question_id}/answers", response_model=List[Answer])
async def get_answers(question_id: str):
    answers = await db.answers.find({"question_id": question_id}).sort("created_at", 1).to_list(1000)
    return [Answer(**a) for a in answers]

@api_router.post("/answers/{answer_id}/accept")
async def accept_answer(answer_id: str, current_user: dict = Depends(get_current_user)):
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    
    # Check if user owns the question
    question = await db.questions.find_one({"id": answer["question_id"]})
    if question["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Apenas o autor da pergunta pode aceitar respostas")
    
    # Unaccept other answers for this question
    await db.answers.update_many(
        {"question_id": answer["question_id"]},
        {"$set": {"is_accepted": False}}
    )
    
    # Accept this answer
    await db.answers.update_one(
        {"id": answer_id},
        {"$set": {"is_accepted": True}}
    )
    
    # Award PC points to answer author
    await update_user_points(answer["author_id"], pc_delta=15, pcon_delta=25)
    
    return {"message": "Resposta aceita com sucesso"}

# Voting Routes
@api_router.post("/vote")
async def vote(vote_data: VoteRequest, current_user: dict = Depends(get_current_user)):
    # Check if user already voted
    existing_vote = await db.votes.find_one({
        "user_id": current_user["id"],
        "target_id": vote_data.target_id,
        "target_type": vote_data.target_type
    })
    
    if existing_vote:
        # Remove existing vote
        await db.votes.delete_one({"id": existing_vote["id"]})
        
        # Update vote counts
        field = "upvotes" if existing_vote["vote_type"] == "upvote" else "downvotes"
        collection = db.questions if vote_data.target_type == "question" else db.answers
        await collection.update_one(
            {"id": vote_data.target_id},
            {"$inc": {field: -1}}
        )
        
        # If same vote type, just remove (toggle off)
        if existing_vote["vote_type"] == vote_data.vote_type:
            return {"message": "Voto removido"}
    
    # Add new vote
    vote = Vote(
        user_id=current_user["id"],
        target_id=vote_data.target_id,
        target_type=vote_data.target_type,
        vote_type=vote_data.vote_type
    )
    
    await db.votes.insert_one(vote.dict())
    
    # Update vote counts
    field = "upvotes" if vote_data.vote_type == "upvote" else "downvotes"
    collection = db.questions if vote_data.target_type == "question" else db.answers
    await collection.update_one(
        {"id": vote_data.target_id},
        {"$inc": {field: 1}}
    )
    
    # Award/deduct points
    target = await collection.find_one({"id": vote_data.target_id})
    if target and target["author_id"] != current_user["id"]:  # Can't vote on own content
        if vote_data.vote_type == "upvote":
            await update_user_points(target["author_id"], pc_delta=2, pcon_delta=1)
        else:
            await update_user_points(target["author_id"], pc_delta=-1)
    
    return {"message": f"{vote_data.vote_type.capitalize()} registrado"}

@api_router.get("/users/{user_id}/votes/{target_id}")
async def get_user_vote(user_id: str, target_id: str):
    vote = await db.votes.find_one({"user_id": user_id, "target_id": target_id})
    return {"vote_type": vote["vote_type"] if vote else None}

# Admin Routes
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
    
    # Update answer as validated
    await db.answers.update_one(
        {"id": answer_id},
        {"$set": {
            "is_validated": True,
            "validated_by": current_user["id"],
            "validated_at": datetime.utcnow()
        }}
    )
    
    # Award points to answer author ONLY after validation
    await update_user_points(answer["author_id"], pc_delta=5, pcon_delta=10)
    
    return {"message": "Resposta validada com sucesso. Pontos concedidos ao autor."}

@api_router.post("/admin/answers/{answer_id}/reject")
async def reject_answer(answer_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    
    # Delete rejected answer
    await db.answers.delete_one({"id": answer_id})
    
    # Update question answer count
    await db.questions.update_one(
        {"id": answer["question_id"]},
        {"$inc": {"answers_count": -1}}
    )
    
    return {"message": "Resposta rejeitada e removida"}

@api_router.post("/admin/users/{user_id}/make-admin")
async def make_user_admin(user_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_admin": True}}
    )
    
    return {"message": "Usuário promovido a administrador"}

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
    
    return {
        "user": UserResponse(**user),
        "questions_count": questions_count,
        "answers_count": answers_count,
        "accepted_answers": accepted_answers,
        "validated_answers": validated_answers
    }

# Health check
@api_router.get("/")
async def root():
    return {"message": "Acode Lab API - Sistema Q&A"}

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