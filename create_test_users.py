#!/usr/bin/env python3

import asyncio
import hashlib
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv('backend/.env')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def create_test_users():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        print("🔍 Verificando usuários existentes...")
        
        # Check if users already exist
        admin_exists = await db.users.find_one({"email": "admin@teste.com"})
        user_exists = await db.users.find_one({"email": "usuario@teste.com"})
        
        if admin_exists:
            print("⚠️  Admin admin@teste.com já existe!")
        else:
            # Create admin user
            admin_user = {
                "id": str(uuid.uuid4()),
                "username": "admin_teste",
                "email": "admin@teste.com",
                "password_hash": hash_password("Admin123!"),
                "pc_points": 1000,
                "pcon_points": 500,
                "rank": "Especialista",
                "is_admin": True,
                "is_company": False,
                "created_at": datetime.utcnow(),
                "bio": "Administrador de teste do sistema Acode Lab",
                "location": "São Paulo, SP",
                "website": "",
                "github": "",
                "linkedin": "",
                "skills": ["Python", "JavaScript", "MongoDB"],
                "experience": "Administrador do sistema",
                "portfolio_projects": [],
                "following": [],
                "followers": [],
                "achievements": ["first_join", "admin_privileges"]
            }
            
            await db.users.insert_one(admin_user)
            print("✅ Usuário admin criado com sucesso!")
            print(f"   Email: admin@teste.com")
            print(f"   Senha: Admin123!")
            print(f"   Username: admin_teste")
            print(f"   Tipo: Administrador")
        
        if user_exists:
            print("⚠️  Usuário usuario@teste.com já existe!")
        else:
            # Create normal user
            normal_user = {
                "id": str(uuid.uuid4()),
                "username": "usuario_teste",
                "email": "usuario@teste.com",
                "password_hash": hash_password("Usuario123!"),
                "pc_points": 50,
                "pcon_points": 100,
                "rank": "Iniciante",
                "is_admin": False,
                "is_company": False,
                "created_at": datetime.utcnow(),
                "bio": "Usuário de teste do sistema Acode Lab",
                "location": "Rio de Janeiro, RJ",
                "website": "",
                "github": "",
                "linkedin": "",
                "skills": ["JavaScript", "React"],
                "experience": "Desenvolvedor iniciante",
                "portfolio_projects": [],
                "following": [],
                "followers": [],
                "achievements": ["first_join"]
            }
            
            await db.users.insert_one(normal_user)
            print("✅ Usuário normal criado com sucesso!")
            print(f"   Email: usuario@teste.com")
            print(f"   Senha: Usuario123!")
            print(f"   Username: usuario_teste")
            print(f"   Tipo: Usuário Normal")
        
        print("\n🎯 RESUMO DOS USUÁRIOS DE TESTE:")
        print("="*50)
        print("👑 ADMINISTRADOR:")
        print("   Email: admin@teste.com")
        print("   Senha: Admin123!")
        print("   Acesso: Painel Admin + Todas as funcionalidades")
        print()
        print("👤 USUÁRIO NORMAL:")
        print("   Email: usuario@teste.com")
        print("   Senha: Usuario123!")
        print("   Acesso: Funcionalidades normais do sistema")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Erro ao criar usuários: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_test_users())