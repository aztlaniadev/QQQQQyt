#!/usr/bin/env python3
print("Teste simples funcionando!")
print("Verificando se o Python está funcionando...")

import requests
print("Requests importado com sucesso!")

try:
    response = requests.get("http://localhost:8000/docs")
    print(f"Backend respondeu com status: {response.status_code}")
except Exception as e:
    print(f"Erro ao conectar com backend: {e}")

print("Teste concluído!")
