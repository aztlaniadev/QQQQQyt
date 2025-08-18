#!/usr/bin/env python3
"""
Script para testar a configuração Docker do ACODE LAB
Valida se todos os arquivos necessários estão presentes e corretos
"""

import os
import yaml
import re
from pathlib import Path

def check_file_exists(file_path, description):
    """Verifica se um arquivo existe"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} - ARQUIVO NÃO ENCONTRADO!")
        return False

def validate_docker_compose():
    """Valida o arquivo docker-compose.yml"""
    print("\n🔍 VALIDANDO DOCKER-COMPOSE.YML")
    print("=" * 50)
    
    if not check_file_exists("docker-compose.yml", "Docker Compose"):
        return False
    
    try:
        with open("docker-compose.yml", "r", encoding="utf-8") as f:
            content = f.read()
            compose = yaml.safe_load(content)
        
        # Verificar serviços obrigatórios
        required_services = ["mongodb", "backend", "frontend"]
        services_found = list(compose.get("services", {}).keys())
        
        print(f"   Serviços encontrados: {services_found}")
        
        for service in required_services:
            if service in services_found:
                print(f"   ✅ Serviço {service} presente")
            else:
                print(f"   ❌ Serviço {service} ausente")
                return False
        
        # Verificar versão
        version = compose.get("version", "Não especificado")
        print(f"   Versão: {version}")
        
        # Verificar networks
        networks = compose.get("networks", {})
        if "acode_lab_network" in networks:
            print("   ✅ Network personalizada configurada")
        else:
            print("   ⚠️ Network padrão será usada")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erro ao validar docker-compose.yml: {e}")
        return False

def validate_dockerfiles():
    """Valida os Dockerfiles"""
    print("\n🔍 VALIDANDO DOCKERFILES")
    print("=" * 50)
    
    backend_ok = check_file_exists("backend/Dockerfile", "Backend Dockerfile")
    frontend_ok = check_file_exists("frontend/Dockerfile", "Frontend Dockerfile")
    
    if backend_ok and frontend_ok:
        # Validar conteúdo do backend Dockerfile
        try:
            with open("backend/Dockerfile", "r", encoding="utf-8") as f:
                content = f.read()
                
            checks = [
                ("FROM python:3.10-slim", "Imagem base Python"),
                ("WORKDIR /app", "Diretório de trabalho"),
                ("COPY requirements.txt", "Cópia de requirements"),
                ("EXPOSE 8000", "Porta exposta"),
                ("CMD", "Comando de execução")
            ]
            
            for check, description in checks:
                if check in content:
                    print(f"   ✅ {description}")
                else:
                    print(f"   ❌ {description} não encontrado")
                    backend_ok = False
                    
        except Exception as e:
            print(f"   ❌ Erro ao ler backend Dockerfile: {e}")
            backend_ok = False
    
    return backend_ok and frontend_ok

def validate_nginx_config():
    """Valida a configuração do Nginx"""
    print("\n🔍 VALIDANDO CONFIGURAÇÃO NGINX")
    print("=" * 50)
    
    if not check_file_exists("nginx/nginx.conf", "Configuração Nginx"):
        return False
    
    try:
        with open("nginx/nginx.conf", "r", encoding="utf-8") as f:
            content = f.read()
        
        checks = [
            ("upstream backend", "Upstream backend"),
            ("upstream frontend", "Upstream frontend"),
            ("location /api/", "Rota API"),
            ("proxy_pass", "Proxy pass"),
            ("ssl_certificate", "SSL configurado")
        ]
        
        for check, description in checks:
            if check in content:
                print(f"   ✅ {description}")
            else:
                print(f"   ⚠️ {description} não encontrado")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erro ao validar nginx.conf: {e}")
        return False

def validate_mongodb_init():
    """Valida o script de inicialização do MongoDB"""
    print("\n🔍 VALIDANDO SCRIPT MONGODB")
    print("=" * 50)
    
    if not check_file_exists("backend/init-mongo.js", "Script MongoDB"):
        return False
    
    try:
        with open("backend/init-mongo.js", "r", encoding="utf-8") as e:
            content = f.read()
        
        checks = [
            ("createCollection", "Criação de collections"),
            ("createIndex", "Criação de índices"),
            ("admin@acodelab.com", "Usuário admin"),
            ("Premium Badge", "Item de exemplo")
        ]
        
        for check, description in checks:
            if check in content:
                print(f"   ✅ {description}")
            else:
                print(f"   ❌ {description} não encontrado")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erro ao validar init-mongo.js: {e}")
        return False

def validate_project_structure():
    """Valida a estrutura geral do projeto"""
    print("\n🔍 VALIDANDO ESTRUTURA DO PROJETO")
    print("=" * 50)
    
    required_dirs = [
        "backend",
        "frontend", 
        "nginx"
    ]
    
    required_files = [
        "README.md",
        "docker-compose.yml"
    ]
    
    all_ok = True
    
    for directory in required_dirs:
        if os.path.isdir(directory):
            print(f"   ✅ Diretório {directory}")
        else:
            print(f"   ❌ Diretório {directory} não encontrado")
            all_ok = False
    
    for file in required_files:
        if os.path.isfile(file):
            print(f"   ✅ Arquivo {file}")
        else:
            print(f"   ❌ Arquivo {file} não encontrado")
            all_ok = False
    
    return all_ok

def validate_backend_files():
    """Valida arquivos específicos do backend"""
    print("\n🔍 VALIDANDO ARQUIVOS DO BACKEND")
    print("=" * 50)
    
    backend_files = [
        "server.py",
        "requirements.txt",
        "store_endpoints.py",
        "jobs_endpoints.py", 
        "articles_endpoints.py"
    ]
    
    all_ok = True
    for file in backend_files:
        file_path = f"backend/{file}"
        if os.path.exists(file_path):
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} não encontrado")
            all_ok = False
    
    return all_ok

def main():
    """Executa todas as validações"""
    print("🚀 VALIDAÇÃO DA CONFIGURAÇÃO DOCKER - ACODE LAB")
    print("=" * 60)
    
    results = []
    
    # Executar validações
    results.append(("Estrutura do Projeto", validate_project_structure()))
    results.append(("Docker Compose", validate_docker_compose()))
    results.append(("Dockerfiles", validate_dockerfiles()))
    results.append(("Configuração Nginx", validate_nginx_config()))
    results.append(("Script MongoDB", validate_mongodb_init()))
    results.append(("Arquivos Backend", validate_backend_files()))
    
    # Resumo dos resultados
    print("\n📊 RESUMO DA VALIDAÇÃO")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 RESULTADO: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 CONFIGURAÇÃO DOCKER VÁLIDA! Sistema pronto para deploy.")
        print("\n📋 PRÓXIMOS PASSOS:")
        print("1. Configure as variáveis de ambiente (.env)")
        print("2. Execute: docker-compose up -d --build")
        print("3. Acesse: http://localhost:3000")
    else:
        print("⚠️ ALGUNS PROBLEMAS FORAM IDENTIFICADOS. Corrija antes do deploy.")
    
    return passed == total

if __name__ == "__main__":
    main()
