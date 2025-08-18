# ACODE LAB - Sistema Completo de Networking Profissional

## 🚀 Visão Geral

ACODE LAB é uma plataforma completa de networking profissional que inclui:

- **Sistema Connect**: Feed social com posts, curtidas, comentários e sistema de seguir usuários
- **Portfólios em Destaque**: Sistema semanal de submissão e votação de portfólios
- **Loja PCon**: Sistema de compras com moeda virtual e itens especiais
- **Portal de Vagas B2B**: Sistema de vagas para empresas e candidaturas
- **Sistema de Artigos**: Criação, edição e votação de artigos técnicos
- **Estrutura Modular**: Frontend organizado em componentes reutilizáveis

## 🏗️ Arquitetura

- **Backend**: FastAPI + MongoDB + JWT Authentication
- **Frontend**: React + Context API + Tailwind CSS
- **Database**: MongoDB com validação de esquemas
- **Deploy**: Docker + Docker Compose + Nginx

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Python 3.10+ (para desenvolvimento local)
- MongoDB (para desenvolvimento local)

## 🚀 Deploy Rápido com Docker

### 1. Clone o repositório
```bash
git clone <repository-url>
cd ACODE-LAB
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite as variáveis necessárias
nano .env
```

### 3. Execute com Docker Compose
```bash
# Construir e iniciar todos os serviços
docker-compose up -d --build

# Verificar status dos serviços
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f
```

### 4. Acesse a aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## 🔧 Desenvolvimento Local

### Backend
```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
export MONGODB_URL="mongodb://localhost:27017"
export DATABASE_NAME="acode_lab"
export SECRET_KEY="your-secret-key"

# Executar servidor
python server.py
# ou
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm start

# Build para produção
npm run build
```

## 📁 Estrutura do Projeto

```
ACODE-LAB/
├── backend/                 # Backend FastAPI
│   ├── server.py           # Servidor principal
│   ├── store_endpoints.py  # Endpoints da Loja PCon
│   ├── jobs_endpoints.py   # Endpoints do Portal de Vagas
│   ├── articles_endpoints.py # Endpoints dos Artigos
│   ├── requirements.txt    # Dependências Python
│   └── Dockerfile         # Container do backend
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes organizados por funcionalidade
│   │   ├── services/      # Serviços da API
│   │   ├── contexts/      # Contextos React
│   │   └── utils/         # Utilitários e constantes
│   ├── package.json       # Dependências Node.js
│   └── Dockerfile         # Container do frontend
├── nginx/                  # Configuração do Nginx
│   └── nginx.conf         # Proxy reverso e SSL
├── docker-compose.yml     # Orquestração dos containers
└── README.md              # Este arquivo
```

## 🔐 Autenticação e Usuários

### Tipos de Usuário
- **User**: Usuário comum com acesso a todas as funcionalidades
- **Company**: Empresa com acesso ao Portal de Vagas
- **Admin**: Administrador com acesso total ao sistema

### Usuário Admin Padrão
- **Email**: admin@acodelab.com
- **Senha**: admin123

## 🛍️ Sistema de Loja PCon

### Itens Disponíveis
- **Badges**: Emblemas especiais para perfis
- **Themes**: Temas visuais personalizados
- **Boosts**: Aumento temporário de visibilidade
- **Features**: Funcionalidades especiais

### Sistema de PCons
- Moeda virtual do sistema
- Ganha através de atividades (posts, comentários, votos)
- Gasta em itens da loja

## 💼 Portal de Vagas B2B

### Funcionalidades
- Criação de vagas por empresas
- Sistema de candidaturas
- Filtros por localização, tipo e requisitos
- Gestão de status das candidaturas

### Validações
- Apenas empresas podem criar vagas
- Usuários podem se candidatar a múltiplas vagas
- Sistema de notificações para candidaturas

## 📝 Sistema de Artigos

### Categorias
- Programming
- Design
- Business
- Tutorial
- News

### Funcionalidades
- Criação e edição de artigos
- Sistema de votação (upvote/downvote)
- Comentários nos artigos
- Estatísticas e trending

## 🔧 Configuração de Produção

### Variáveis de Ambiente
```bash
# Backend
MONGODB_URL=mongodb://admin:admin123@mongodb:27017
DATABASE_NAME=acode_lab
SECRET_KEY=your-production-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
REACT_APP_API_URL=https://your-domain.com
REACT_APP_ENV=production
```

### SSL/HTTPS
O Nginx está configurado para redirecionar HTTP para HTTPS. Para produção:

1. Gere certificados SSL válidos
2. Coloque em `nginx/ssl/`
3. Atualize o domínio em `nginx/nginx.conf`

### Monitoramento
- Health checks automáticos
- Logs estruturados
- Métricas de performance

## 🧪 Testes

### Backend
```bash
cd backend
python backend_test.py
python backend_test_new_features.py
```

### Frontend
```bash
cd frontend
npm test
npm run build
```

## 🚀 Deploy em Produção

### 1. Servidor VPS/Cloud
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configurar Firewall
```bash
# Abrir portas necessárias
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. Deploy
```bash
# Clonar repositório
git clone <repository-url>
cd ACODE-LAB

# Configurar variáveis de produção
nano .env

# Deploy
docker-compose -f docker-compose.yml up -d
```

## 📊 Monitoramento e Logs

### Logs dos Containers
```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Métricas
- **Backend**: Health check em `/health`
- **Frontend**: Build status e performance
- **Database**: Conexões e queries

## 🔒 Segurança

### Implementado
- JWT Authentication
- Rate limiting
- CORS configurado
- Headers de segurança
- Validação de entrada
- Sanitização de dados

### Recomendações para Produção
- Usar certificados SSL válidos
- Configurar firewall adequado
- Monitorar logs de acesso
- Implementar backup automático
- Usar secrets management

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

#### Backend não inicia
```bash
# Verificar logs
docker-compose logs backend

# Verificar variáveis de ambiente
docker-compose exec backend env

# Verificar conectividade MongoDB
docker-compose exec backend python -c "import motor; print('MongoDB OK')"
```

#### Frontend não carrega
```bash
# Verificar build
docker-compose exec frontend npm run build

# Verificar logs
docker-compose logs frontend
```

#### Problemas de banco
```bash
# Acessar MongoDB
docker-compose exec mongodb mongosh

# Verificar collections
use acode_lab
show collections
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

- **Email**: admin@acodelab.com
- **Issues**: GitHub Issues
- **Documentação**: http://localhost:8000/docs (quando rodando)

---

**ACODE LAB** - Conectando profissionais, impulsionando carreiras! 🚀
