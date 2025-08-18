#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Implementar o sistema Connect - feed social com posts de usuários, sistema de curtidas, comentários, seguir usuários, e seção 'Portfólios em Destaque da Semana' para networking profissional"

backend:
  - task: "Implementar modelos Connect (Posts, Likes, Comments)"
    implemented: false
    working: "NA"
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Iniciando implementação dos modelos backend para Connect"

  - task: "Criar endpoints para posts sociais"
    implemented: false
    working: "NA"
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Endpoints para criar, listar, curtir posts e comentários"

  - task: "Implementar sistema de seguir usuários"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Sistema de follow/unfollow já implementado nos endpoints user"

  - task: "Criar endpoints para Featured Portfolios"
    implemented: false
    working: "NA"
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Sistema de submissão e votação de portfólios semanais"

frontend:
  - task: "Implementar painel admin avançado com abas"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: true
          agent: "main"
          comment: "Painel admin completo implementado com 4 abas: Dashboard, Usuários, Empresas, Moderação. Inclui criação de bots, gestão completa de usuários/empresas, controle de pontos e todas as funcionalidades solicitadas"

metadata:
  created_by: "main_agent"
  version: "1.2"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus:
    - "Verificar funcionalidades do painel admin frontend"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Implementei um sistema administrativo completo e avançado conforme solicitado. Inclui: 1) Criação de bots para engajamento 2) Gerenciamento completo de usuários com controle livre de PC/PCon 3) Sistema de moderação com ban/unban, mute/unmute, silence/unsilence 4) Gerenciamento de empresas 5) Deleção permanente de usuários/empresas 6) Estatísticas avançadas 7) Interface com tabs organizadas. O admin agora tem poder total sobre a plataforma."
    - agent: "testing"
      message: "🎉 TESTE COMPLETO DOS ENDPOINTS ADMIN AVANÇADOS REALIZADO COM 100% DE SUCESSO! Todos os 26 testes passaram. Funcionalidades testadas e funcionando: ✅ Autenticação admin (admin@teste.com) ✅ Listagem de usuários com paginação ✅ Listagem de empresas ✅ Estatísticas avançadas com contadores de moderação ✅ Criação de bots com dados personalizados ✅ Moderação completa de usuários (ban/unban/mute/unmute/silence/unsilence) ✅ Atualização livre de pontos PC/PCon ✅ Moderação de empresas (ban/unban) ✅ Deleção permanente de usuários e empresas ✅ Proteção de permissões (403 para usuários normais). Sistema administrativo totalmente funcional e seguro. Backend pronto para produção."