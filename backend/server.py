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
from bson import json_util
import json

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
    
    # Convert to serializable format
    serializable_questions = []
    for question in questions:
        # Remove MongoDB _id and ensure all fields are serializable
        if "_id" in question:
            del question["_id"]
        
        # Convert datetime to string if needed
        if "created_at" in question and hasattr(question["created_at"], "isoformat"):
            question["created_at"] = question["created_at"].isoformat()
        if "updated_at" in question and hasattr(question["updated_at"], "isoformat"):
            question["updated_at"] = question["updated_at"].isoformat()
            
        serializable_questions.append(question)
    
    return serializable_questions

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

# CONNECT ROUTES
@api_router.get("/connect/posts")
async def get_connect_posts(skip: int = 0, limit: int = 20, user_id: str = None):
    query = {}
    if user_id:
        query["author_id"] = user_id
    
    posts = await db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Converter para JSON serializável
    return json.loads(json_util.dumps(posts))

@api_router.post("/connect/posts")
async def create_post(post: PostCreate, current_user: dict = Depends(get_current_user)):
    """Create a new post in Connect"""
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Companies cannot create social posts")
    
    new_post = Post(
        **post.dict(),
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.posts.insert_one(new_post.dict())
    
    # Award PC points for creating posts
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"pc_points": 1, "pcon_points": 2}}
    )
    
    return {"message": "Post created successfully", "post_id": new_post.id}

@api_router.post("/connect/posts/{post_id}/like")
async def toggle_like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle like on a post"""
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = await db.likes.find_one({
        "user_id": current_user["id"],
        "target_id": post_id,
        "target_type": "post"
    })
    
    if existing_like:
        # Unlike
        await db.likes.delete_one({"id": existing_like["id"]})
        await db.posts.update_one({"id": post_id}, {"$inc": {"likes": -1}})
        return {"message": "Post unliked", "liked": False}
    else:
        # Like
        like = Like(
            user_id=current_user["id"],
            user_username=current_user["username"],
            target_id=post_id,
            target_type="post"
        )
        await db.likes.insert_one(like.dict())
        await db.posts.update_one({"id": post_id}, {"$inc": {"likes": 1}})
        
        # Award points to post author
        await db.users.update_one(
            {"id": post["author_id"]},
            {"$inc": {"pc_points": 1}}
        )
        
        return {"message": "Post liked", "liked": True}

@api_router.get("/connect/posts/{post_id}/comments")
async def get_post_comments(post_id: str):
    comments = await db.comments.find({"post_id": post_id}).sort("created_at", 1).to_list(100)
    
    # Converter para JSON serializável
    return json.loads(json_util.dumps(comments))

@api_router.post("/connect/posts/{post_id}/comments")
async def create_comment(post_id: str, comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    """Create a comment on a post"""
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = Comment(
        **comment.dict(),
        post_id=post_id,
        author_id=current_user["id"],
        author_username=current_user["username"]
    )
    
    await db.comments.insert_one(new_comment.dict())
    
    # Update post comment count
    await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    # Award points
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"pc_points": 1}}
    )
    
    return {"message": "Comment created successfully", "comment_id": new_comment.id}

@api_router.post("/connect/comments/{comment_id}/like")
async def toggle_like_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle like on a comment"""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    existing_like = await db.likes.find_one({
        "user_id": current_user["id"],
        "target_id": comment_id,
        "target_type": "comment"
    })
    
    if existing_like:
        # Unlike
        await db.likes.delete_one({"id": existing_like["id"]})
        await db.comments.update_one({"id": comment_id}, {"$inc": {"likes": -1}})
        return {"message": "Comment unliked", "liked": False}
    else:
        # Like
        like = Like(
            user_id=current_user["id"],
            user_username=current_user["username"],
            target_id=comment_id,
            target_type="comment"
        )
        await db.likes.insert_one(like.dict())
        await db.comments.update_one({"id": comment_id}, {"$inc": {"likes": 1}})
        return {"message": "Comment liked", "liked": True}

# PORTFOLIO ROUTES
@api_router.get("/connect/portfolios/featured")
async def get_featured_portfolios():
    import datetime
    current_week = datetime.datetime.now().strftime("%Y-W%U")
    
    portfolios = await db.portfolio_submissions.find({
        "week_year": current_week
    }).sort("votes", -1).limit(10).to_list(10)
    
    # Converter para JSON serializável
    return json.loads(json_util.dumps(portfolios))

@api_router.post("/connect/portfolios/submit")
async def submit_portfolio(portfolio: PortfolioSubmissionCreate, current_user: dict = Depends(get_current_user)):
    """Submit portfolio for weekly feature"""
    if current_user.get("is_company"):
        raise HTTPException(status_code=403, detail="Companies cannot submit portfolios")
    
    import datetime
    current_week = datetime.datetime.now().strftime("%Y-W%U")
    
    # Check if user already submitted this week
    existing = await db.portfolio_submissions.find_one({
        "user_id": current_user["id"],
        "week_year": current_week
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a portfolio this week")
    
    new_submission = PortfolioSubmission(
        **portfolio.dict(),
        user_id=current_user["id"],
        user_username=current_user["username"],
        week_year=current_week
    )
    
    await db.portfolio_submissions.insert_one(new_submission.dict())
    
    # Award points for submission
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"pc_points": 5, "pcon_points": 10}}
    )
    
    return {"message": "Portfolio submitted successfully", "submission_id": new_submission.id}

@api_router.post("/connect/portfolios/{portfolio_id}/vote")
async def vote_portfolio(portfolio_id: str, current_user: dict = Depends(get_current_user)):
    """Vote for a featured portfolio"""
    portfolio = await db.portfolio_submissions.find_one({"id": portfolio_id})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if portfolio["user_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot vote for your own portfolio")
    
    # Check if user already voted for this portfolio
    existing_vote = await db.votes.find_one({
        "user_id": current_user["id"],
        "target_id": portfolio_id,
        "target_type": "portfolio"
    })
    
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted for this portfolio")
    
    # Create vote
    vote = Vote(
        user_id=current_user["id"],
        target_id=portfolio_id,
        target_type="portfolio",
        vote_type="up"
    )
    
    await db.votes.insert_one(vote.dict())
    await db.portfolio_submissions.update_one({"id": portfolio_id}, {"$inc": {"votes": 1}})
    
    # Award points to portfolio owner
    await db.users.update_one(
        {"id": portfolio["user_id"]},
        {"$inc": {"pc_points": 2}}
    )
    
    return {"message": "Vote recorded successfully"}

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

# STORE ENDPOINTS
@api_router.get("/store/items")
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

@api_router.get("/store/items/{item_id}")
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

@api_router.post("/store/items/{item_id}/purchase")
async def purchase_item(
    item_id: str,
    quantity: int = 1,
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
        total_cost = item["price"] * quantity
        if current_user["pcon_points"] < total_cost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PCons insuficientes para esta compra"
            )
        
        # Processar a compra
        async with await client.start_session() as session:
            async with session.start_transaction():
                # Deduzir PCons do usuário
                await db.users.update_one(
                    {"_id": current_user["_id"]},
                    {"$inc": {"pcon_points": -total_cost}},
                    session=session
                )
                
                # Adicionar item ao inventário
                inventory_data = {
                    "user_id": current_user["_id"],
                    "item_id": ObjectId(item_id),
                    "quantity": quantity,
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
                        {"$inc": {"quantity": quantity}},
                        session=session
                    )
                else:
                    # Criar novo item no inventário
                    await db.user_inventory.insert_one(inventory_data, session=session)
                
                # Registrar a compra
                purchase_data = {
                    "user_id": current_user["_id"],
                    "item_id": ObjectId(item_id),
                    "quantity": quantity,
                    "total_cost": total_cost,
                    "purchased_at": datetime.utcnow()
                }
                
                await db.purchases.insert_one(purchase_data, session=session)
                await session.commit_transaction()
        
        return {"message": "Compra realizada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar compra: {str(e)}"
        )

@api_router.get("/store/inventory")
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

@api_router.get("/store/balance")
async def get_user_balance(current_user: dict = Depends(get_current_user)):
    """Obter saldo de PCons do usuário"""
    try:
        user = await db.users.find_one({"_id": current_user["_id"]})
        return {"pcons": user.get("pcon_points", 0)}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar saldo: {str(e)}"
        )

# JOBS ENDPOINTS
@api_router.get("/jobs")
async def get_jobs(
    company_id: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    location: Optional[str] = None,
    remote_work: Optional[bool] = None,
    skills: Optional[str] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 20
):
    """Listar vagas com filtros opcionais"""
    try:
        query = {"is_active": is_active}
        
        if company_id:
            if ObjectId.is_valid(company_id):
                query["company_id"] = ObjectId(company_id)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ID da empresa inválido"
                )
        
        if job_type:
            query["job_type"] = job_type
        if experience_level:
            query["experience_level"] = experience_level
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        if remote_work is not None:
            query["remote_work"] = remote_work
        if skills:
            skill_list = [skill.strip() for skill in skills.split(",")]
            query["skills"] = {"$in": skill_list}
        
        # Buscar vagas com contagem de aplicações
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "job_applications",
                    "localField": "_id",
                    "foreignField": "job_id",
                    "as": "applications"
                }
            },
            {
                "$addFields": {
                    "applications_count": {"$size": "$applications"}
                }
            },
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        jobs = await db.jobs.aggregate(pipeline).to_list(limit)
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(jobs))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar vagas: {str(e)}"
        )

@api_router.post("/jobs")
async def create_job(
    job_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Criar nova vaga (apenas empresas)"""
    try:
        if not current_user.get("is_company"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas empresas podem criar vagas"
            )
        
        job_dict = job_data.copy()
        job_dict["company_id"] = current_user["_id"]
        job_dict["created_at"] = datetime.utcnow()
        job_dict["updated_at"] = datetime.utcnow()
        job_dict["is_active"] = True
        
        result = await db.jobs.insert_one(job_dict)
        
        # Buscar a vaga criada
        created_job = await db.jobs.find_one({"_id": result.inserted_id})
        created_job["applications_count"] = 0
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(created_job))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar vaga: {str(e)}"
        )

@api_router.post("/jobs/{job_id}/apply")
async def apply_to_job(
    job_id: str,
    application_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Candidatar-se a uma vaga"""
    try:
        if current_user.get("is_company"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Empresas não podem se candidatar a vagas"
            )
        
        if not ObjectId.is_valid(job_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da vaga inválido"
            )
        
        # Verificar se a vaga existe e está ativa
        job = await db.jobs.find_one({"_id": ObjectId(job_id), "is_active": True})
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada ou inativa"
            )
        
        # Verificar se já se candidatou
        existing_application = await db.job_applications.find_one({
            "job_id": ObjectId(job_id),
            "user_id": current_user["_id"]
        })
        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você já se candidatou a esta vaga"
            )
        
        # Criar candidatura
        application_dict = application_data.copy()
        application_dict["job_id"] = ObjectId(job_id)
        application_dict["user_id"] = current_user["_id"]
        application_dict["status"] = "pending"
        application_dict["applied_at"] = datetime.utcnow()
        application_dict["updated_at"] = datetime.utcnow()
        
        result = await db.job_applications.insert_one(application_dict)
        
        return {"message": "Candidatura enviada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao candidatar-se: {str(e)}"
        )

# ARTICLES ENDPOINTS
@api_router.get("/articles")
async def get_articles(
    category: Optional[str] = None,
    author_id: Optional[str] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None,
    is_published: bool = True,
    sort_by: str = "created_at",
    sort_order: str = "desc",
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

@api_router.post("/articles")
async def create_article(
    article_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Criar novo artigo"""
    try:
        # Verificar se o usuário tem rank suficiente para publicar
        if article_data.get("is_published", False):
            user_rank = current_user.get("rank", "Iniciante")
            rank_order = ["Iniciante", "Aprendiz", "Contribuidor", "Especialista", "Mestre", "Guru"]
            user_rank_index = rank_order.index(user_rank)
            
            # Iniciante e Aprendiz podem criar rascunhos, Contribuidor+ pode publicar
            if user_rank_index < 2:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Rank Contribuidor ou superior necessário para publicar artigos"
                )
        
        article_dict = article_data.copy()
        article_dict["author_id"] = current_user["_id"]
        article_dict["views"] = 0
        article_dict["upvotes"] = 0
        article_dict["downvotes"] = 0
        article_dict["created_at"] = datetime.utcnow()
        article_dict["updated_at"] = datetime.utcnow()
        
        if article_data.get("is_published", False):
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

@api_router.post("/articles/{article_id}/upvote")
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

# Include API router
app.include_router(api_router)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)