#!/usr/bin/env python3
"""
Teste das novas funcionalidades implementadas:
- Sistema de Loja PCon
- Portal de Vagas B2B  
- Sistema de Artigos
"""

import requests
import json
import time
from datetime import datetime

# Configuração
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_COMPANY_EMAIL = "company@example.com"
TEST_COMPANY_PASSWORD = "company123"

def log_test(test_name, success, details=""):
    """Log do resultado do teste"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")
    print()

def get_auth_token(email, password):
    """Obter token de autenticação"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    except Exception as e:
        print(f"Erro ao fazer login: {e}")
        return None

def test_store_system():
    """Testar sistema de Loja PCon"""
    print("🛍️ TESTANDO SISTEMA DE LOJA PCON")
    print("=" * 50)
    
    # Teste 1: Listar itens da loja
    try:
        response = requests.get(f"{BASE_URL}/api/store/items")
        success = response.status_code == 200
        log_test("GET /api/store/items", success, f"Status: {response.status_code}")
        
        if success:
            items = response.json()
            print(f"   Itens encontrados: {len(items)}")
            if items:
                print(f"   Primeiro item: {items[0].get('name', 'N/A')}")
    except Exception as e:
        log_test("GET /api/store/items", False, f"Erro: {e}")
    
    # Teste 2: Obter item específico
    try:
        response = requests.get(f"{BASE_URL}/api/store/items/1")
        success = response.status_code in [200, 404]  # 404 se não existir
        log_test("GET /api/store/items/{id}", success, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /api/store/items/{id}", False, f"Erro: {e}")
    
    # Teste 3: Verificar saldo do usuário (requer autenticação)
    token = get_auth_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    if token:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/store/balance", headers=headers)
            success = response.status_code == 200
            log_test("GET /api/store/balance (autenticado)", success, f"Status: {response.status_code}")
            
            if success:
                balance = response.json()
                print(f"   Saldo: {balance.get('balance', 'N/A')} PCons")
        except Exception as e:
            log_test("GET /api/store/balance (autenticado)", False, f"Erro: {e}")
    else:
        log_test("GET /api/store/balance (autenticado)", False, "Usuário de teste não encontrado")
    
    # Teste 4: Verificar inventário do usuário
    if token:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/store/inventory", headers=headers)
            success = response.status_code == 200
            log_test("GET /api/store/inventory (autenticado)", success, f"Status: {response.status_code}")
            
            if success:
                inventory = response.json()
                print(f"   Itens no inventário: {len(inventory)}")
        except Exception as e:
            log_test("GET /api/store/inventory (autenticado)", False, f"Erro: {e}")

def test_jobs_system():
    """Testar Portal de Vagas B2B"""
    print("\n💼 TESTANDO PORTAL DE VAGAS B2B")
    print("=" * 50)
    
    # Teste 1: Listar vagas
    try:
        response = requests.get(f"{BASE_URL}/api/jobs")
        success = response.status_code == 200
        log_test("GET /api/jobs", success, f"Status: {response.status_code}")
        
        if success:
            jobs = response.json()
            print(f"   Vagas encontradas: {len(jobs)}")
            if jobs:
                print(f"   Primeira vaga: {jobs[0].get('title', 'N/A')}")
    except Exception as e:
        log_test("GET /api/jobs", False, f"Erro: {e}")
    
    # Teste 2: Obter vaga específica
    try:
        response = requests.get(f"{BASE_URL}/api/jobs/1")
        success = response.status_code in [200, 404]  # 404 se não existir
        log_test("GET /api/jobs/{id}", success, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /api/jobs/{id}", False, f"Erro: {e}")
    
    # Teste 3: Criar vaga (requer autenticação de empresa)
    company_token = get_auth_token(TEST_COMPANY_EMAIL, TEST_COMPANY_PASSWORD)
    if company_token:
        try:
            headers = {"Authorization": f"Bearer {company_token}"}
            job_data = {
                "title": "Desenvolvedor Full Stack",
                "description": "Vaga para desenvolvedor com experiência em React e Python",
                "requirements": ["React", "Python", "MongoDB"],
                "salary_range": "5000-8000",
                "location": "Remoto",
                "job_type": "full_time"
            }
            response = requests.post(f"{BASE_URL}/api/jobs", json=job_data, headers=headers)
            success = response.status_code == 201
            log_test("POST /api/jobs (empresa)", success, f"Status: {response.status_code}")
            
            if success:
                job = response.json()
                print(f"   Vaga criada com ID: {job.get('id', 'N/A')}")
        except Exception as e:
            log_test("POST /api/jobs (empresa)", False, f"Erro: {e}")
    else:
        log_test("POST /api/jobs (empresa)", False, "Empresa de teste não encontrada")

def test_articles_system():
    """Testar Sistema de Artigos"""
    print("\n📝 TESTANDO SISTEMA DE ARTIGOS")
    print("=" * 50)
    
    # Teste 1: Listar artigos
    try:
        response = requests.get(f"{BASE_URL}/api/articles")
        success = response.status_code == 200
        log_test("GET /api/articles", success, f"Status: {response.status_code}")
        
        if success:
            articles = response.json()
            print(f"   Artigos encontrados: {len(articles)}")
            if articles:
                print(f"   Primeiro artigo: {articles[0].get('title', 'N/A')}")
    except Exception as e:
        log_test("GET /api/articles", False, f"Erro: {e}")
    
    # Teste 2: Obter artigo específico
    try:
        response = requests.get(f"{BASE_URL}/api/articles/1")
        success = response.status_code in [200, 404]  # 404 se não existir
        log_test("GET /api/articles/{id}", success, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /api/articles/{id}", False, f"Erro: {e}")
    
    # Teste 3: Criar artigo (requer autenticação de usuário)
    token = get_auth_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    if token:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            article_data = {
                "title": "Como implementar autenticação JWT",
                "content": "Artigo sobre implementação de autenticação JWT em aplicações web...",
                "category": "programming",
                "tags": ["JWT", "authentication", "security"]
            }
            response = requests.post(f"{BASE_URL}/api/articles", json=article_data, headers=headers)
            success = response.status_code == 201
            log_test("POST /api/articles (usuário)", success, f"Status: {response.status_code}")
            
            if success:
                article = response.json()
                print(f"   Artigo criado com ID: {article.get('id', 'N/A')}")
        except Exception as e:
            log_test("POST /api/articles (usuário)", False, f"Erro: {e}")
    else:
        log_test("POST /api/articles (usuário)", False, "Usuário de teste não encontrado")
    
    # Teste 4: Obter estatísticas dos artigos
    try:
        response = requests.get(f"{BASE_URL}/api/articles/overview")
        success = response.status_code == 200
        log_test("GET /api/articles/overview", success, f"Status: {response.status_code}")
        
        if success:
            stats = response.json()
            print(f"   Total de artigos: {stats.get('total_articles', 'N/A')}")
            print(f"   Total de votos: {stats.get('total_votes', 'N/A')}")
    except Exception as e:
        log_test("GET /api/articles/overview", False, f"Erro: {e}")

def main():
    """Executar todos os testes"""
    print("🚀 INICIANDO TESTE DAS NOVAS FUNCIONALIDADES")
    print("=" * 60)
    print(f"URL Base: {BASE_URL}")
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Verificar se o backend está rodando
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Backend está rodando e acessível")
        else:
            print("⚠️ Backend respondeu mas com status inesperado")
    except Exception as e:
        print(f"❌ Backend não está acessível: {e}")
        print("Certifique-se de que o servidor está rodando em http://localhost:8000")
        return
    
    print()
    
    # Executar testes
    test_store_system()
    test_jobs_system()
    test_articles_system()
    
    print("🎯 TESTE DAS NOVAS FUNCIONALIDADES CONCLUÍDO!")
    print("=" * 60)

if __name__ == "__main__":
    main()
