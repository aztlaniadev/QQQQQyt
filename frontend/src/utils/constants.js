// Configurações da API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SKIP: 0,
};

// Configurações de upload
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Configurações de autenticação
export const AUTH = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas
};

// Configurações de roles de usuário
export const USER_ROLES = {
  USER: 'user',
  COMPANY: 'company',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

// Configurações de ranks de usuário
export const USER_RANKS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
};

// Configurações de tipos de post
export const POST_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LINK: 'link',
  POLL: 'poll',
};

// Configurações de tipos de voto
export const VOTE_TYPES = {
  UP: 'up',
  DOWN: 'down',
};

// Configurações de tipos de item da loja
export const STORE_ITEM_TYPES = {
  BADGE: 'badge',
  THEME: 'theme',
  FEATURE: 'feature',
  CUSTOMIZATION: 'customization',
};

// Configurações de tipos de vaga
export const JOB_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
};

// Configurações de status de aplicação
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

// Configurações de categorias de artigos
export const ARTICLE_CATEGORIES = {
  TUTORIAL: 'tutorial',
  NEWS: 'news',
  OPINION: 'opinion',
  REVIEW: 'review',
  INTERVIEW: 'interview',
  CASE_STUDY: 'case_study',
};

// Configurações de notificações
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MENTION: 'mention',
  SYSTEM: 'system',
  JOB_UPDATE: 'job_update',
  STORE_PURCHASE: 'store_purchase',
};

// Configurações de temas
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

// Configurações de idiomas
export const LANGUAGES = {
  PT_BR: 'pt-BR',
  EN_US: 'en-US',
  ES_ES: 'es-ES',
};

// Configurações de moeda
export const CURRENCY = {
  BRL: 'BRL',
  USD: 'USD',
  EUR: 'EUR',
};

// Configurações de timezone
export const TIMEZONE = 'America/Sao_Paulo';

// Configurações de formatação de data
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_TIME: 'YYYY-MM-DDTHH:mm:ss',
};

// Configurações de validação
export const VALIDATION = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_POST_LENGTH: 1,
  MAX_POST_LENGTH: 1000,
  MIN_COMMENT_LENGTH: 1,
  MAX_COMMENT_LENGTH: 500,
  MIN_QUESTION_LENGTH: 10,
  MAX_QUESTION_LENGTH: 2000,
  MIN_ANSWER_LENGTH: 10,
  MAX_ANSWER_LENGTH: 5000,
  MIN_ARTICLE_LENGTH: 100,
  MAX_ARTICLE_LENGTH: 10000,
  MIN_JOB_TITLE_LENGTH: 5,
  MAX_JOB_TITLE_LENGTH: 100,
  MIN_JOB_DESCRIPTION_LENGTH: 50,
  MAX_JOB_DESCRIPTION_LENGTH: 5000,
};

// Configurações de cache
export const CACHE = {
  USER_PROFILE_TTL: 5 * 60 * 1000, // 5 minutos
  POSTS_TTL: 2 * 60 * 1000, // 2 minutos
  COMMENTS_TTL: 1 * 60 * 1000, // 1 minuto
  PORTFOLIOS_TTL: 10 * 60 * 1000, // 10 minutos
  STORE_ITEMS_TTL: 30 * 60 * 1000, // 30 minutos
  JOBS_TTL: 5 * 60 * 1000, // 5 minutos
  ARTICLES_TTL: 15 * 60 * 1000, // 15 minutos
};

// Configurações de rate limiting
export const RATE_LIMITING = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_COOLDOWN: 15 * 60 * 1000, // 15 minutos
};

// Configurações de segurança
export const SECURITY = {
  PASSWORD_SALT_ROUNDS: 12,
  JWT_SECRET_MIN_LENGTH: 32,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  MAX_SESSIONS_PER_USER: 5,
};

// Configurações de performance
export const PERFORMANCE = {
  MAX_CONCURRENT_REQUESTS: 10,
  REQUEST_TIMEOUT: 30 * 1000, // 30 segundos
  RETRY_DELAY: 1000, // 1 segundo
  MAX_RETRIES: 3,
};

// Configurações de monitoramento
export const MONITORING = {
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'info',
  ENABLE_METRICS: true,
  ENABLE_TRACING: false,
  SAMPLE_RATE: 0.1, // 10% das requisições
};

// Configurações de desenvolvimento
export const DEVELOPMENT = {
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_HOT_RELOAD: process.env.NODE_ENV === 'development',
  ENABLE_DEV_TOOLS: process.env.NODE_ENV === 'development',
  LOG_API_CALLS: process.env.NODE_ENV === 'development',
};

// Configurações de produção
export const PRODUCTION = {
  ENABLE_COMPRESSION: true,
  ENABLE_CACHING: true,
  ENABLE_CDN: true,
  ENABLE_SSL: true,
  ENABLE_MONITORING: true,
};

// Configurações de teste
export const TESTING = {
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'test',
  ENABLE_TEST_DATABASE: process.env.NODE_ENV === 'test',
  ENABLE_COVERAGE: process.env.NODE_ENV === 'test',
  TEST_TIMEOUT: 10000, // 10 segundos
};
