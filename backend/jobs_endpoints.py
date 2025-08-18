from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import json
from bson import json_util

from server import get_current_user, db

jobs_router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# Modelos Pydantic
class JobCreate(BaseModel):
    title: str
    description: str
    company_name: str
    location: str
    job_type: str  # full_time, part_time, contract, internship, freelance
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    requirements: List[str] = []
    benefits: List[str] = []
    skills: List[str] = []
    experience_level: str  # junior, mid, senior, lead
    remote_work: bool = False
    application_deadline: Optional[datetime] = None

class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    company_name: str
    company_id: str
    location: str
    job_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    requirements: List[str] = []
    benefits: List[str] = []
    skills: List[str] = []
    experience_level: str
    remote_work: bool
    application_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    applications_count: int = 0

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    remote_work: Optional[bool] = None
    application_deadline: Optional[datetime] = None
    is_active: Optional[bool] = None

class ApplicationCreate(BaseModel):
    cover_letter: str
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    expected_salary: Optional[int] = None
    availability: Optional[str] = None
    additional_info: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    user_id: str
    cover_letter: str
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    expected_salary: Optional[int] = None
    availability: Optional[str] = None
    additional_info: Optional[str] = None
    status: str  # pending, reviewing, accepted, rejected, withdrawn
    applied_at: datetime
    updated_at: datetime
    job: JobResponse
    user: dict

class ApplicationUpdate(BaseModel):
    status: str
    feedback: Optional[str] = None
    interview_date: Optional[datetime] = None

# Endpoints
@jobs_router.get("/", response_model=List[JobResponse])
async def get_jobs(
    company_id: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    location: Optional[str] = None,
    remote_work: Optional[bool] = None,
    skills: Optional[str] = None,  # Comma-separated skills
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

@jobs_router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Obter detalhes de uma vaga específica"""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da vaga inválido"
            )
        
        # Buscar vaga com contagem de aplicações
        pipeline = [
            {"$match": {"_id": ObjectId(job_id)}},
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
            }
        ]
        
        jobs = await db.jobs.aggregate(pipeline).to_list(1)
        if not jobs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada"
            )
        
        job = jobs[0]
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(job))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar vaga: {str(e)}"
        )

@jobs_router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user)
):
    """Criar nova vaga (apenas empresas)"""
    try:
        if not current_user.get("is_company"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas empresas podem criar vagas"
            )
        
        job_dict = job_data.dict()
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

@jobs_router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Atualizar vaga (apenas empresa proprietária)"""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da vaga inválido"
            )
        
        # Verificar se a vaga existe e se pertence à empresa
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada"
            )
        
        if job["company_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas a empresa proprietária pode editar esta vaga"
            )
        
        update_data = job_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada"
            )
        
        # Buscar a vaga atualizada
        updated_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        
        # Contar aplicações
        applications_count = await db.job_applications.count_documents({"job_id": ObjectId(job_id)})
        updated_job["applications_count"] = applications_count
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(updated_job))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar vaga: {str(e)}"
        )

@jobs_router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Excluir vaga (apenas empresa proprietária)"""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da vaga inválido"
            )
        
        # Verificar se a vaga existe e se pertence à empresa
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada"
            )
        
        if job["company_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas a empresa proprietária pode excluir esta vaga"
            )
        
        # Verificar se há candidaturas
        applications_count = await db.job_applications.count_documents({"job_id": ObjectId(job_id)})
        if applications_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível excluir vaga que já possui candidaturas"
            )
        
        result = await db.jobs.delete_one({"_id": ObjectId(job_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada"
            )
        
        return {"message": "Vaga excluída com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir vaga: {str(e)}"
        )

@jobs_router.post("/{job_id}/apply", response_model=ApplicationResponse)
async def apply_to_job(
    job_id: str,
    application_data: ApplicationCreate,
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
        
        # Verificar prazo de candidatura
        if job.get("application_deadline") and datetime.utcnow() > job["application_deadline"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prazo de candidatura encerrado"
            )
        
        # Criar candidatura
        application_dict = application_data.dict()
        application_dict["job_id"] = ObjectId(job_id)
        application_dict["user_id"] = current_user["_id"]
        application_dict["status"] = "pending"
        application_dict["applied_at"] = datetime.utcnow()
        application_dict["updated_at"] = datetime.utcnow()
        
        result = await db.job_applications.insert_one(application_dict)
        
        # Buscar candidatura criada com dados da vaga
        created_application = await db.job_applications.find_one({"_id": result.inserted_id})
        created_application["job"] = job
        created_application["user"] = {
            "id": str(current_user["_id"]),
            "username": current_user["username"],
            "email": current_user["email"],
            "profile_image": current_user.get("profile_image")
        }
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(created_application))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao candidatar-se: {str(e)}"
        )

@jobs_router.get("/{job_id}/applications", response_model=List[ApplicationResponse])
async def get_job_applications(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    """Obter candidaturas de uma vaga (apenas empresa proprietária)"""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da vaga inválido"
            )
        
        # Verificar se a vaga existe e se pertence à empresa
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada"
            )
        
        if job["company_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas a empresa proprietária pode ver as candidaturas"
            )
        
        # Buscar candidaturas com dados dos usuários
        pipeline = [
            {"$match": {"job_id": ObjectId(job_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }
            },
            {"$unwind": "$user"},
            {
                "$addFields": {
                    "user": {
                        "id": {"$toString": "$user._id"},
                        "username": "$user.username",
                        "email": "$user.email",
                        "profile_image": "$user.profile_image"
                    }
                }
            },
            {"$sort": {"applied_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        applications = await db.job_applications.aggregate(pipeline).to_list(limit)
        
        # Adicionar dados da vaga
        for app in applications:
            app["job"] = job
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(applications))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar candidaturas: {str(e)}"
        )

@jobs_router.put("/applications/{application_id}", response_model=ApplicationResponse)
async def update_application_status(
    application_id: str,
    update_data: ApplicationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Atualizar status de uma candidatura (apenas empresa proprietária da vaga)"""
    try:
        if not ObjectId.is_valid(application_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da candidatura inválido"
            )
        
        # Verificar se a candidatura existe
        application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidatura não encontrada"
            )
        
        # Verificar se a vaga pertence à empresa
        job = await db.jobs.find_one({"_id": application["job_id"]})
        if not job or job["company_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas a empresa proprietária da vaga pode atualizar candidaturas"
            )
        
        # Atualizar candidatura
        update_dict = update_data.dict(exclude_unset=True)
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db.job_applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidatura não encontrada"
            )
        
        # Buscar candidatura atualizada
        updated_application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
        updated_application["job"] = job
        
        # Buscar dados do usuário
        user = await db.users.find_one({"_id": application["user_id"]})
        updated_application["user"] = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "profile_image": user.get("profile_image")
        }
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(updated_application))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar candidatura: {str(e)}"
        )

@jobs_router.get("/applications/user", response_model=List[ApplicationResponse])
async def get_user_applications(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    """Obter candidaturas do usuário logado"""
    try:
        # Buscar candidaturas com dados das vagas
        pipeline = [
            {"$match": {"user_id": current_user["_id"]}},
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "job_id",
                    "foreignField": "_id",
                    "as": "job"
                }
            },
            {"$unwind": "$job"},
            {"$sort": {"applied_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        applications = await db.job_applications.aggregate(pipeline).to_list(limit)
        
        # Adicionar dados do usuário
        for app in applications:
            app["user"] = {
                "id": str(current_user["_id"]),
                "username": current_user["username"],
                "email": current_user["email"],
                "profile_image": current_user.get("profile_image")
            }
        
        # Converter para JSON serializável
        return json.loads(json_util.dumps(applications))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar candidaturas: {str(e)}"
        )

@jobs_router.delete("/applications/{application_id}")
async def withdraw_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Desistir de uma candidatura"""
    try:
        if not ObjectId.is_valid(application_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da candidatura inválido"
            )
        
        # Verificar se a candidatura existe e pertence ao usuário
        application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidatura não encontrada"
            )
        
        if application["user_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o candidato pode desistir da candidatura"
            )
        
        # Atualizar status para withdrawn
        result = await db.job_applications.update_one(
            {"_id": ObjectId(application_id)},
            {
                "$set": {
                    "status": "withdrawn",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidatura não encontrada"
            )
        
        return {"message": "Candidatura cancelada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao cancelar candidatura: {str(e)}"
        )

# Endpoints de estatísticas para empresas
@jobs_router.get("/company/{company_id}/stats")
async def get_company_job_stats(
    company_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obter estatísticas das vagas de uma empresa"""
    try:
        if not ObjectId.is_valid(company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID da empresa inválido"
            )
        
        # Verificar se o usuário é a empresa ou admin
        if str(current_user["_id"]) != company_id and current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        # Estatísticas das vagas
        total_jobs = await db.jobs.count_documents({"company_id": ObjectId(company_id)})
        active_jobs = await db.jobs.count_documents({"company_id": ObjectId(company_id), "is_active": True})
        
        # Estatísticas das candidaturas
        pipeline = [
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "job_id",
                    "foreignField": "_id",
                    "as": "job"
                }
            },
            {"$unwind": "$job"},
            {"$match": {"job.company_id": ObjectId(company_id)}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        status_stats = await db.job_applications.aggregate(pipeline).to_list(100)
        status_counts = {stat["_id"]: stat["count"] for stat in status_stats}
        
        # Total de candidaturas
        total_applications = sum(status_counts.values())
        
        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "applications_by_status": status_counts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar estatísticas: {str(e)}"
        )
