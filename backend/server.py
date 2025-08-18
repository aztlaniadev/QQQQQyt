from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
import uuid
from dotenv import load_dotenv
from enum import Enum

# CONFIGURAÇÃO INICIAL
load_dotenv()
app = FastAPI(title="Acode Lab API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# SEGURANÇA
SECRET_KEY = os.getenv("SECRET_KEY", "acode-lab-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

# MONGODB CONFIGURAÇÃO
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "acode_lab")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# CORS CONFIGURAÇÃO
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ENUMS
class UserRank(str, Enum):
    INICIANTE = "Iniciante"
    APRENDIZ = "Aprendiz"
    CONTRIBUIDOR = "Contribuidor"
    ESPECIALISTA = "Especialista"
    MESTRE = "Mestre"
    GURU = "Guru"

class SubscriptionPlan(str, Enum):
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

# MODELOS PYDANTIC
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    pc_points: int = 0
    pcon_points: int = 100
    rank: UserRank = UserRank.INICIANTE
    is_admin: bool = False
    is_company: bool = False
    is_bot: bool = False
    is_banned: bool = False
    is_muted: bool = False
    is_silenced: bool = False
    ban_reason: Optional[str] = None
    ban_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    bio: Optional[str] = ""
    location: Optional[str] = ""
    website: Optional[str] = ""
    github: Optional[str] = ""
    linkedin: Optional[str] = ""
    skills: List[str] = []
    experience: Optional[str] = ""
    portfolio_projects: List[dict] = []
    following: List[str] = []
    followers: List[str] = []
    achievements: List[str] = []
    theme_color: str = "#D97745"
    banner_image: Optional[str] = ""
    custom_title: Optional[str] = ""
    social_links: Dict[str, str] = {}
    showcase_projects: List[str] = []
    featured_skills: List[str] = []

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
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

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    code: Optional[str] = ""
    tags: List[str] = []
    author_id: str
    author_username: str
    upvotes: int = 0
    downvotes: int = 0
    views: int = 0
    answers_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Answer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    code: Optional[str] = ""
    question_id: str
    author_id: str
    author_username: str
    upvotes: int = 0
    downvotes: int = 0
    is_validated: bool = False
    is_accepted: bool = False
    validated_by: Optional[str] = None
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Vote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    target_id: str
    target_type: str  # "question" or "answer"
    vote_type: str    # "up" or "down"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    excerpt: Optional[str] = ""
    tags: List[str] = []
    author_id: str
    author_username: str
    upvotes: int = 0
    views: int = 0
    published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Post(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    post_type: str = "text"  # text, project, achievement, portfolio
    author_id: str
    author_username: str
    likes: int = 0
    comments_count: int = 0
    metadata: Dict[str, Any] = {}  # For project details, links, etc.
    image_url: Optional[str] = ""
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Like(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_username: str
    target_id: str
    target_type: str  # "post" or "comment"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    post_id: str
    author_id: str
    author_username: str
    likes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PortfolioSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_username: str
    title: str
    description: str
    project_url: str
    image_url: Optional[str] = ""
    technologies: List[str] = []
    votes: int = 0
    week_year: str  # Format: "2025-W01"
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    requirements: List[str] = []
    salary_range: Optional[str] = ""
    location: str
    remote: bool = False
    company_id: str
    company_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

class StoreItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    cost_pcon: int
    category: str = "features"  # features, cosmetic, premium
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# REQUEST/RESPONSE MODELS
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    pc_points: int
    pcon_points: int
    rank: str
    is_admin: bool
    is_company: bool
    is_bot: bool
    is_banned: bool
    is_muted: bool
    created_at: datetime
    bio: Optional[str]
    location: Optional[str]
    skills: List[str]
    achievements: List[str]

class QuestionCreate(BaseModel):
    title: str
    content: str
    code: Optional[str] = ""
    tags: List[str] = []

class AnswerCreate(BaseModel):
    content: str
    code: Optional[str] = ""

class ArticleCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = ""
    tags: List[str] = []
    published: bool = False

class PostCreate(BaseModel):
    content: str
    post_type: str = "text"
    metadata: Dict[str, Any] = {}
    image_url: Optional[str] = ""
    tags: List[str] = []

class CommentCreate(BaseModel):
    content: str

class PortfolioSubmissionCreate(BaseModel):
    title: str
    description: str
    project_url: str
    image_url: Optional[str] = ""
    technologies: List[str] = []

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# UTILITÁRIOS
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def calculate_rank(pc_points: int) -> UserRank:
    if pc_points >= 15000: return UserRank.GURU
    elif pc_points >= 5000: return UserRank.MESTRE
    elif pc_points >= 1500: return UserRank.ESPECIALISTA
    elif pc_points >= 500: return UserRank.CONTRIBUIDOR
    elif pc_points >= 100: return UserRank.APRENDIZ
    else: return UserRank.INICIANTE

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        user = await db.companies.find_one({"id": user_id})
        if user is None:
            raise credentials_exception
        user["is_company"] = True
    
    return user

# AUTHENTICATION ROUTES
@api_router.post("/auth/register", response_model=dict)
async def register_user(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        achievements=["first_join"]
    )
    
    await db.users.insert_one(new_user.dict())
    return {"message": "User created successfully", "user_id": new_user.id}

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Check user
    user = await db.users.find_one({"email": form_data.username})
    if not user:
        user = await db.companies.find_one({"email": form_data.username})
        if user:
            user["is_company"] = True
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last active
    collection = db.companies if user.get("is_company") else db.users
    await collection.update_one(
        {"id": user["id"]},
        {"$set": {"last_active": datetime.utcnow()}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user)
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# QUESTIONS ROUTES
@api_router.post("/questions")
async def create_question(question: QuestionCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Companies cannot create questions")
    
    new_question = Question(
        **question.dict(),
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.questions.insert_one(new_question.dict())
    
    # Award PC points
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"pc_points": 2, "pcon_points": 5}}
    )
    
    return {"message": "Question created successfully", "question_id": new_question.id}

@api_router.get("/questions")
async def get_questions(skip: int = 0, limit: int = 50, search: str = None):
    query = {}
    if search:
        query = {
            "$or": [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search]}},
                {"author_username": {"$regex": search, "$options": "i"}}
            ]
        }
    
    questions = await db.questions.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return questions

@api_router.get("/questions/{question_id}")
async def get_question(question_id: str):
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@api_router.post("/questions/{question_id}/view")
async def increment_question_views(question_id: str):
    await db.questions.update_one(
        {"id": question_id},
        {"$inc": {"views": 1}}
    )
    return {"message": "View recorded"}

@api_router.post("/questions/{question_id}/vote")
async def vote_question(question_id: str, vote_data: dict, current_user: dict = Depends(get_current_user)):
    vote_type = vote_data.get("vote_type")
    
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    existing_vote = await db.votes.find_one({
        "user_id": current_user["id"],
        "target_id": question_id,
        "target_type": "question"
    })
    
    if existing_vote:
        old_type = existing_vote["vote_type"]
        if old_type != vote_type:
            await db.votes.update_one(
                {"id": existing_vote["id"]},
                {"$set": {"vote_type": vote_type}}
            )
            
            if old_type == "up":
                await db.questions.update_one({"id": question_id}, {"$inc": {"upvotes": -1}})
            else:
                await db.questions.update_one({"id": question_id}, {"$inc": {"downvotes": -1}})
                
            if vote_type == "up":
                await db.questions.update_one({"id": question_id}, {"$inc": {"upvotes": 1}})
            else:
                await db.questions.update_one({"id": question_id}, {"$inc": {"downvotes": 1}})
        
        return {"message": "Vote updated"}
    else:
        vote = Vote(
            user_id=current_user["id"],
            target_id=question_id,
            target_type="question",
            vote_type=vote_type
        )
        
        await db.votes.insert_one(vote.dict())
        
        if vote_type == "up":
            await db.questions.update_one({"id": question_id}, {"$inc": {"upvotes": 1}})
        else:
            await db.questions.update_one({"id": question_id}, {"$inc": {"downvotes": 1}})
        
        return {"message": "Vote recorded"}

@api_router.get("/questions/{question_id}/answers")
async def get_question_answers(question_id: str):
    answers = await db.answers.find({"question_id": question_id}).sort("created_at", -1).to_list(100)
    return answers

@api_router.post("/questions/{question_id}/answers")
async def create_answer(question_id: str, answer: AnswerCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Companies cannot answer questions")
    
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    new_answer = Answer(
        **answer.dict(),
        question_id=question_id,
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.answers.insert_one(new_answer.dict())
    
    # Update question answer count
    await db.questions.update_one(
        {"id": question_id},
        {"$inc": {"answers_count": 1}}
    )
    
    return {"message": "Answer submitted! Waiting for admin validation.", "answer_id": new_answer.id}

# ANSWERS ROUTES
@api_router.post("/answers/{answer_id}/vote")
async def vote_answer(answer_id: str, vote_data: dict, current_user: dict = Depends(get_current_user)):
    vote_type = vote_data.get("vote_type")
    
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    existing_vote = await db.votes.find_one({
        "user_id": current_user["id"],
        "target_id": answer_id,
        "target_type": "answer"
    })
    
    if existing_vote:
        old_type = existing_vote["vote_type"]
        if old_type != vote_type:
            await db.votes.update_one(
                {"id": existing_vote["id"]},
                {"$set": {"vote_type": vote_type}}
            )
            
            if old_type == "up":
                await db.answers.update_one({"id": answer_id}, {"$inc": {"upvotes": -1}})
            else:
                await db.answers.update_one({"id": answer_id}, {"$inc": {"downvotes": -1}})
                
            if vote_type == "up":
                await db.answers.update_one({"id": answer_id}, {"$inc": {"upvotes": 1}})
            else:
                await db.answers.update_one({"id": answer_id}, {"$inc": {"downvotes": 1}})
        
        return {"message": "Vote updated"}
    else:
        vote = Vote(
            user_id=current_user["id"],
            target_id=answer_id,
            target_type="answer",
            vote_type=vote_type
        )
        
        await db.votes.insert_one(vote.dict())
        
        if vote_type == "up":
            await db.answers.update_one({"id": answer_id}, {"$inc": {"upvotes": 1}})
        else:
            await db.answers.update_one({"id": answer_id}, {"$inc": {"downvotes": 1}})
        
        return {"message": "Vote recorded"}

# USER ROUTES
@api_router.put("/users/profile")
async def update_profile(profile_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Only users can update profile")
    
    allowed_fields = [
        "bio", "location", "website", "github", "linkedin", "skills", "experience", 
        "portfolio_projects", "theme_color", "banner_image", "custom_title", 
        "social_links", "showcase_projects", "featured_skills"
    ]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}

@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "username": user["username"],
        "rank": user["rank"],
        "pc_points": user["pc_points"],
        "pcon_points": user["pcon_points"],
        "bio": user.get("bio", ""),
        "location": user.get("location", ""),
        "website": user.get("website", ""),
        "github": user.get("github", ""),
        "linkedin": user.get("linkedin", ""),
        "skills": user.get("skills", []),
        "experience": user.get("experience", ""),
        "achievements": user.get("achievements", []),
        "theme_color": user.get("theme_color", "#D97745"),
        "banner_image": user.get("banner_image", ""),
        "custom_title": user.get("custom_title", ""),
        "social_links": user.get("social_links", {}),
        "showcase_projects": user.get("showcase_projects", []),
        "featured_skills": user.get("featured_skills", []),
        "portfolio_projects": user.get("portfolio_projects", []),
        "following": len(user.get("following", [])),
        "followers": len(user.get("followers", [])),
        "created_at": user["created_at"]
    }

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_user_data = await db.users.find_one({"id": current_user["id"]})
    following_list = current_user_data.get("following", [])
    
    if user_id in following_list:
        # Unfollow
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$pull": {"following": user_id}}
        )
        await db.users.update_one(
            {"id": user_id},
            {"$pull": {"followers": current_user["id"]}}
        )
        return {"message": "User unfollowed"}
    else:
        # Follow
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$addToSet": {"following": user_id}}
        )
        await db.users.update_one(
            {"id": user_id},
            {"$addToSet": {"followers": current_user["id"]}}
        )
        return {"message": "User followed successfully"}

# ADMIN ROUTES
@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
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

@api_router.get("/admin/answers/pending")
async def get_pending_answers(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    pending_answers = await db.answers.find({"is_validated": False}).to_list(100)
    return pending_answers

@api_router.post("/admin/answers/{answer_id}/validate")
async def validate_answer(answer_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Validate answer
    await db.answers.update_one(
        {"id": answer_id},
        {"$set": {
            "is_validated": True,
            "validated_by": current_user["id"],
            "validated_at": datetime.utcnow()
        }}
    )
    
    # Award points to answer author
    await db.users.update_one(
        {"id": answer["author_id"]},
        {"$inc": {"pc_points": 10, "pcon_points": 10}}
    )
    
    return {"message": "Answer validated successfully"}

@api_router.post("/admin/answers/{answer_id}/reject")
async def reject_answer(answer_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Remove answer
    await db.answers.delete_one({"id": answer_id})
    
    # Update question answer count
    await db.questions.update_one(
        {"id": answer["question_id"]},
        {"$inc": {"answers_count": -1}}
    )
    
    return {"message": "Answer rejected and removed"}

# Include API router
app.include_router(api_router)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)