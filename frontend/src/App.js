import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Basic UI Components - Inline definitions
const Button = ({ children, onClick, type = "button", className = "", disabled = false, variant = "default", size = "default", ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const variants = {
    default: "bg-copper hover:bg-copper/90 text-black",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground text-gray-300",
    destructive: "bg-red-600 hover:bg-red-700 text-white"
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md"
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", ...props }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm bg-gray-900 border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight text-white ${className}`} {...props}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

const Input = ({ className = "", type = "text", ...props }) => (
  <input
    type={type}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-800 border-gray-700 text-white ${className}`}
    {...props}
  />
);

const Label = ({ children, className = "", ...props }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300 ${className}`} {...props}>
    {children}
  </label>
);

const Textarea = ({ className = "", rows = 4, ...props }) => (
  <textarea
    rows={rows}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-800 border-gray-700 text-white ${className}`}
    {...props}
  />
);

const Badge = ({ children, className = "", variant = "default" }) => {
  const variants = {
    default: "bg-copper/20 text-copper",
    secondary: "bg-gray-700 text-gray-300"
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ children }) => (
  <div className="mb-4">
    {children}
  </div>
);

const DialogTitle = ({ children, className = "" }) => (
  <h2 className={`text-xl font-semibold text-white ${className}`}>
    {children}
  </h2>
);

const Tabs = ({ value, onValueChange, children, className = "" }) => (
  <div className={`w-full ${className}`}>
    {React.Children.map(children, child => 
      React.cloneElement(child, { activeTab: value, setActiveTab: onValueChange })
    )}
  </div>
);

const TabsList = ({ children, className = "", activeTab, setActiveTab }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-800 p-1 text-muted-foreground ${className}`}>
    {React.Children.map(children, child => 
      React.cloneElement(child, { activeTab, setActiveTab })
    )}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeTab === value ? 'bg-copper text-black' : 'text-gray-300 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeTab, className = "" }) => {
  if (activeTab !== value) return null;
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

// Simple icons as text alternatives
const LogOut = ({ className }) => <span className={className}>🚪</span>;
const Settings = ({ className }) => <span className={className}>⚙️</span>;
const Crown = ({ className }) => <span className={className}>👑</span>;
const Check = ({ className }) => <span className={className}>✅</span>;
const MessageSquare = ({ className }) => <span className={className}>💬</span>;
const Trophy = ({ className }) => <span className={className}>🏆</span>;
const Coins = ({ className }) => <span className={className}>🪙</span>;
const BookOpen = ({ className }) => <span className={className}>📖</span>;
const Users = ({ className }) => <span className={className}>👥</span>;
const Briefcase = ({ className }) => <span className={className}>💼</span>;
const ShoppingCart = ({ className }) => <span className={className}>🛒</span>;
const Building = ({ className }) => <span className={className}>🏢</span>;
const Star = ({ className }) => <span className={className}>⭐</span>;
const Award = ({ className }) => <span className={className}>🏅</span>;
const Plus = ({ className }) => <span className={className}>➕</span>;
const ArrowUp = ({ className }) => <span className={className}>⬆️</span>;
const ArrowDown = ({ className }) => <span className={className}>⬇️</span>;
const Eye = ({ className }) => <span className={className}>👁️</span>;
const Search = ({ className }) => <span className={className}>🔍</span>;
const Edit = ({ className }) => <span className={className}>✏️</span>;
const X = ({ className }) => <span className={className}>❌</span>;
const Heart = ({ className }) => <span className={className}>❤️</span>;
const Share2 = ({ className }) => <span className={className}>📤</span>;
const TrendingUp = ({ className }) => <span className={className}>📈</span>;
const User = ({ className }) => <span className={className}>👤</span>;
const Clock = ({ className }) => <span className={className}>⏰</span>;

const API = process.env.REACT_APP_BACKEND_URL;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${API}/auth/login`, formData);
    localStorage.setItem('token', response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Algo deu errado!</h1>
            <p className="text-gray-400 mb-6">Recarregue a página para tentar novamente.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-copper hover:bg-copper/90 text-black h-10 py-2 px-4"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-900 border-b border-copper/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-copper">
            Acode Lab
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/perguntas" className="text-gray-300 hover:text-copper transition-colors">
              Perguntas
            </Link>
            <Link to="/artigos" className="text-gray-300 hover:text-copper transition-colors">
              Artigos
            </Link>
            <Link to="/connect" className="text-gray-300 hover:text-copper transition-colors">
              Connect
            </Link>
            <Link to="/loja" className="text-gray-300 hover:text-copper transition-colors">
              Loja
            </Link>
            <Link to="/vagas" className="text-gray-300 hover:text-copper transition-colors">
              Vagas
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-copper transition-colors">
                  Dashboard
                </Link>
                <Link to="/perfil" className="text-gray-300 hover:text-copper transition-colors">
                  <Settings className="h-5 w-5" />
                </Link>
                {user.is_admin && (
                  <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                    <Crown className="h-5 w-5" />
                  </Link>
                )}
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-copper/20 text-gray-300"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-copper/20 text-gray-300">
                    Login
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button size="sm" className="bg-copper hover:bg-copper/90 text-black">
                    Registrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Homepage Component
const Homepage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Bem-vindo ao <span className="text-copper">Acode Lab</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            A plataforma global para desenvolvedores: resolva problemas técnicos, 
            desenvolva sua carreira e conecte-se com profissionais do mundo todo.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/perguntas">
              <Button size="lg" className="bg-copper hover:bg-copper/90 text-black">
                Explorar Perguntas
              </Button>
            </Link>
            <Link to="/registro">
              <Button size="lg" variant="outline" className="border-copper text-copper hover:bg-copper/10">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-copper mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Q&A System</h3>
              <p className="text-gray-400">Faça perguntas técnicas e receba respostas de especialistas</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-copper mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Gamificação</h3>
              <p className="text-gray-400">Ganhe pontos PC e PCon, suba de rank e desbloqueie conquistas</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-copper mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Networking</h3>
              <p className="text-gray-400">Conecte-se com outros desenvolvedores e empresas</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Login Component  
const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(formData.email, formData.password);
      window.location.href = '/dashboard';
    } catch (error) {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md bg-gray-900 border-copper/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-copper hover:bg-copper/90 text-black"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/registro" className="text-copper hover:underline">
                Não tem conta? Registre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API}/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md bg-gray-900 border-green-500/20">
            <CardContent className="p-8 text-center">
              <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Conta criada!</h3>
              <p className="text-gray-400 mb-4">Sua conta foi criada com sucesso.</p>
              <Link to="/login">
                <Button className="bg-copper hover:bg-copper/90 text-black">
                  Fazer Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md bg-gray-900 border-copper/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">Criar Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-gray-300">Nome de usuário</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-copper hover:bg-copper/90 text-black"
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Conta'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-copper hover:underline">
                Já tem conta? Faça login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Questions List Component - COMPLETE IMPLEMENTATION
const QuestionsList = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    code: '',
    tags: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/questions`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Erro ao buscar perguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const questionData = {
        ...newQuestion,
        tags: newQuestion.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      await axios.post(`${API}/questions`, questionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateForm(false);
      setNewQuestion({ title: '', content: '', code: '', tags: '' });
      fetchQuestions();
    } catch (error) {
      console.error('Erro ao criar pergunta:', error);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Perguntas</h1>
          {user && !user.is_company && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-copper hover:bg-copper/90 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Pergunta
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar perguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {showCreateForm && (
          <Card className="mb-6 bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white">Nova Pergunta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Título</Label>
                  <Input
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion(prev => ({...prev, title: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Conteúdo</Label>
                  <Textarea
                    value={newQuestion.content}
                    onChange={(e) => setNewQuestion(prev => ({...prev, content: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Código (opcional)</Label>
                  <Textarea
                    value={newQuestion.code}
                    onChange={(e) => setNewQuestion(prev => ({...prev, code: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                    rows={6}
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Tags (separadas por vírgula)</Label>
                  <Input
                    value={newQuestion.tags}
                    onChange={(e) => setNewQuestion(prev => ({...prev, tags: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="javascript, react, bug"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-copper hover:bg-copper/90 text-black">
                    Publicar
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center text-gray-400">Carregando perguntas...</div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map(question => (
              <Card key={question.id} className="bg-gray-900 border-gray-700 hover:border-copper/50 transition-colors">
                <CardContent className="p-6">
                  <Link to={`/perguntas/${question.id}`} className="block hover:bg-gray-800/50 transition-colors rounded p-2 -m-2">
                    <h3 className="text-lg font-semibold text-white mb-2">{question.title}</h3>
                    <p className="text-gray-300 mb-3 line-clamp-3">{question.content}</p>
                    
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {question.tags.map(tag => (
                          <Badge key={tag} variant="default" className="bg-copper/20 text-copper">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Por {question.author_username}</span>
                      <span>{new Date(question.created_at).toLocaleDateString('pt-BR')}</span>
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4" />
                        <span>{question.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{question.answers_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{question.views}</span>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
            
            {filteredQuestions.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {searchTerm ? 'Nenhuma pergunta encontrada para sua busca.' : 'Nenhuma pergunta ainda. Seja o primeiro a perguntar!'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Question Detail Component - COMPLETE IMPLEMENTATION
const QuestionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState({ content: '', code: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
    // Increment view count
    incrementViews();
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`${API}/questions/${id}`);
      setQuestion(response.data);
    } catch (error) {
      console.error('Erro ao buscar pergunta:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async () => {
    try {
      const response = await axios.get(`${API}/questions/${id}/answers`);
      setAnswers(response.data);
    } catch (error) {
      console.error('Erro ao buscar respostas:', error);
    }
  };

  const incrementViews = async () => {
    try {
      await axios.post(`${API}/questions/${id}/view`);
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Faça login para responder');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/questions/${id}/answers`, newAnswer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewAnswer({ content: '', code: '' });
      fetchAnswers();
      alert('Resposta enviada! Aguarde a validação do administrador.');
    } catch (error) {
      alert('Erro ao enviar resposta: ' + error.response?.data?.detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteQuestion = async (type) => {
    if (!user) {
      alert('Faça login para votar');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/questions/${id}/vote`, { vote_type: type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuestion();
    } catch (error) {
      console.error('Erro ao votar:', error);
    }
  };

  const handleVoteAnswer = async (answerId, type) => {
    if (!user) {
      alert('Faça login para votar');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/answers/${answerId}/vote`, { vote_type: type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnswers();
    } catch (error) {
      console.error('Erro ao votar:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Pergunta não encontrada</h1>
            <Link to="/perguntas">
              <Button className="bg-copper hover:bg-copper/90 text-black">
                Voltar às Perguntas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/perguntas" className="text-copper hover:underline">
            ← Voltar às Perguntas
          </Link>
        </div>

        {/* Question Card */}
        <Card className="bg-gray-900 border-copper/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Vote buttons */}
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => handleVoteQuestion('up')}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <ArrowUp className="h-6 w-6 text-gray-400 hover:text-green-400" />
                </button>
                <span className="text-white font-bold text-lg">{question.upvotes - question.downvotes}</span>
                <button 
                  onClick={() => handleVoteQuestion('down')}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <ArrowDown className="h-6 w-6 text-gray-400 hover:text-red-400" />
                </button>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-4">{question.title}</h1>
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">{question.content}</p>
                
                {question.code && (
                  <div className="bg-gray-800 p-4 rounded-lg mb-4">
                    <pre className="text-gray-100 font-mono text-sm overflow-x-auto">
                      <code>{question.code}</code>
                    </pre>
                  </div>
                )}
                
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map(tag => (
                      <Badge key={tag} variant="default" className="bg-copper/20 text-copper">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Por {question.author_username}</span>
                    <span>{new Date(question.created_at).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{question.views} visualizações</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answers Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {answers.length} {answers.length === 1 ? 'Resposta' : 'Respostas'}
          </h2>
          
          <div className="space-y-4">
            {answers.map(answer => (
              <Card key={answer.id} className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Vote buttons for answers */}
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => handleVoteAnswer(answer.id, 'up')}
                        className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                      >
                        <ArrowUp className="h-5 w-5 text-gray-400 hover:text-green-400" />
                      </button>
                      <span className="text-white font-bold">{answer.upvotes - answer.downvotes}</span>
                      <button 
                        onClick={() => handleVoteAnswer(answer.id, 'down')}
                        className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                      >
                        <ArrowDown className="h-5 w-5 text-gray-400 hover:text-red-400" />
                      </button>
                      {answer.is_validated && (
                        <Check className="h-5 w-5 text-green-400" title="Resposta validada" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{answer.content}</p>
                      
                      {answer.code && (
                        <div className="bg-gray-800 p-4 rounded-lg mb-4">
                          <pre className="text-gray-100 font-mono text-sm overflow-x-auto">
                            <code>{answer.code}</code>
                          </pre>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Por {answer.author_username}</span>
                        <span>{new Date(answer.created_at).toLocaleDateString('pt-BR')}</span>
                        {answer.is_validated && (
                          <Badge className="bg-green-500/20 text-green-400">Validada</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Answer Form */}
        {user && !user.is_company && (
          <Card className="bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white">Sua Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Resposta</Label>
                  <Textarea
                    value={newAnswer.content}
                    onChange={(e) => setNewAnswer(prev => ({...prev, content: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={6}
                    placeholder="Escreva sua resposta aqui..."
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Código (opcional)</Label>
                  <Textarea
                    value={newAnswer.code}
                    onChange={(e) => setNewAnswer(prev => ({...prev, code: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                    rows={6}
                    placeholder="// Cole seu código aqui"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-copper hover:bg-copper/90 text-black"
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Enviar Resposta'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400 mb-4">Faça login para responder esta pergunta</p>
              <Link to="/login">
                <Button className="bg-copper hover:bg-copper/90 text-black">
                  Fazer Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Profile Settings Component - COMPLETE IMPLEMENTATION
const ProfileSettings = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    skills: user?.skills?.join(', ') || '',
    theme_color: user?.theme_color || '#D97745',
    custom_title: user?.custom_title || '',
    banner_image: user?.banner_image || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
      };
      
      await axios.put(`${API}/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Perfil atualizado com sucesso!');
      
      // Update user context
      const updatedUser = { ...user, ...updateData };
      setUser(updatedUser);
      
    } catch (error) {
      setMessage('Erro ao atualizar perfil: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Configurações do Perfil</h1>
        
        <Card className="bg-gray-900 border-copper/20">
          <CardHeader>
            <CardTitle className="text-white">Personalizar Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username" className="text-gray-300">Nome de usuário</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="custom_title" className="text-gray-300">Título Personalizado</Label>
                <Input
                  id="custom_title"
                  name="custom_title"
                  value={formData.custom_title}
                  onChange={(e) => setFormData({...formData, custom_title: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Ex: Desenvolvedor Full Stack"
                />
              </div>
              
              <div>
                <Label htmlFor="theme_color" className="text-gray-300">Cor do Tema</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="theme_color"
                    name="theme_color"
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                    className="w-20 h-10 bg-gray-800 border-gray-700"
                  />
                  <Input
                    name="theme_color"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="#D97745"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="banner_image" className="text-gray-300">URL da Imagem de Banner</Label>
                <Input
                  id="banner_image"
                  name="banner_image"
                  value={formData.banner_image}
                  onChange={(e) => setFormData({...formData, banner_image: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="https://exemplo.com/banner.jpg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-gray-300">Localização</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="São Paulo, Brasil"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-gray-300">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="https://seusite.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="github" className="text-gray-300">GitHub</Label>
                  <Input
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={(e) => setFormData({...formData, github: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="https://github.com/usuario"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin" className="text-gray-300">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="https://linkedin.com/in/usuario"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Conte sobre você..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="skills" className="text-gray-300">Habilidades (separadas por vírgula)</Label>
                <Input
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="JavaScript, Python, React"
                />
              </div>
              
              {message && (
                <div className={`text-sm text-center ${message.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-copper hover:bg-copper/90 text-black"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Dashboard Component - COMPLETE IMPLEMENTATION
const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-copper mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{user.pc_points || 0}</div>
              <div className="text-sm text-gray-400">PC Points</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Coins className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{user.pcon_points || 0}</div>
              <div className="text-sm text-gray-400">PCon Points</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{user.rank || 'Iniciante'}</div>
              <div className="text-sm text-gray-400">Rank</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{user.achievements?.length || 0}</div>
              <div className="text-sm text-gray-400">Conquistas</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white">Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-300"><strong>Nome:</strong> {user.username}</p>
                <p className="text-gray-300"><strong>Email:</strong> {user.email}</p>
                <p className="text-gray-300"><strong>Localização:</strong> {user.location || 'Não informado'}</p>
                <p className="text-gray-300"><strong>Bio:</strong> {user.bio || 'Nenhuma bio ainda'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/perguntas" className="block">
                <Button className="w-full bg-copper hover:bg-copper/90 text-black">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Fazer Pergunta
                </Button>
              </Link>
              <Link to="/loja" className="block">
                <Button variant="outline" className="w-full border-copper/20 text-gray-300">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Loja PCon
                </Button>
              </Link>
              <Link to="/connect" className="block">
                <Button variant="outline" className="w-full border-copper/20 text-gray-300">
                  <Users className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Admin Panel Component - COMPLETE IMPLEMENTATION
const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminData();
    }
  }, [user, activeTab]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'dashboard') {
        const [statsRes, pendingRes] = await Promise.all([
          axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/admin/answers/pending`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStats(statsRes.data);
        setPendingAnswers(pendingRes.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAnswer = async (answerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/answers/${answerId}/validate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPendingAnswers(prev => prev.filter(answer => answer.id !== answerId));
      alert('Resposta validada com sucesso!');
    } catch (error) {
      alert('Erro ao validar resposta.');
    }
  };

  const handleRejectAnswer = async (answerId) => {
    if (!confirm('Tem certeza que deseja rejeitar esta resposta?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/answers/${answerId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPendingAnswers(prev => prev.filter(answer => answer.id !== answerId));
      alert('Resposta rejeitada.');
    } catch (error) {
      alert('Erro ao rejeitar resposta.');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="bg-gray-900 border-red-500/20">
            <CardContent className="p-8 text-center">
              <Crown className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Acesso Negado</h3>
              <p className="text-gray-400 mb-4">Apenas administradores podem acessar esta área.</p>
              <Link to="/dashboard">
                <Button className="bg-copper hover:bg-copper/90 text-black">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="h-8 w-8 text-copper" />
          <h1 className="text-3xl font-bold text-white">Painel de Administração</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="validation">Validação</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            {loading ? (
              <div className="text-center text-gray-400">Carregando dados...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-gray-900 border-blue-500/20">
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.total_users || 0}</p>
                    <p className="text-xs text-gray-400">Usuários</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <Building className="h-6 w-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.total_companies || 0}</p>
                    <p className="text-xs text-gray-400">Empresas</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border-purple-500/20">
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.total_questions || 0}</p>
                    <p className="text-xs text-gray-400">Perguntas</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border-amber-500/20">
                  <CardContent className="p-4 text-center">
                    <Check className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.total_answers || 0}</p>
                    <p className="text-xs text-gray-400">Respostas</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border-orange-500/20">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.pending_answers || 0}</p>
                    <p className="text-xs text-gray-400">Pendentes</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border-cyan-500/20">
                  <CardContent className="p-4 text-center">
                    <BookOpen className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.total_articles || 0}</p>
                    <p className="text-xs text-gray-400">Artigos</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
            <Card className="bg-gray-900 border-copper/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-400" />
                  Respostas Pendentes ({pendingAnswers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-gray-400 py-8">Carregando respostas pendentes...</div>
                ) : pendingAnswers.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma resposta pendente de validação!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAnswers.map(answer => (
                      <Card key={answer.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-400">
                                Resposta de <strong className="text-white">{answer.author_username}</strong>
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(answer.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-white whitespace-pre-wrap">{answer.content}</p>
                              {answer.code && (
                                <div className="mt-3 p-3 bg-black rounded border border-gray-600">
                                  <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                                    <code>{answer.code}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleValidateAnswer(answer.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Validar
                            </Button>
                            <Button 
                              onClick={() => handleRejectAnswer(answer.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Placeholder components for remaining features
const CompanyRegister = () => (
  <div className="min-h-screen bg-black">
    <Navigation />
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Registro de Empresa</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <Building className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Em Desenvolvimento</h3>
          <p className="text-gray-400">Registro de empresas em breve...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ArticlesList = () => (
  <div className="min-h-screen bg-black">
    <Navigation />
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Artigos</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sistema de Artigos</h3>
          <p className="text-gray-400">Apenas usuários Mestre e Guru podem escrever artigos...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Connect = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [featuredPortfolios, setFeaturedPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [newPost, setNewPost] = useState({ 
    content: '', 
    post_type: 'text', 
    metadata: {}, 
    tags: [] 
  });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    project_url: '',
    image_url: '',
    technologies: []
  });
  const [showPortfolioSubmit, setShowPortfolioSubmit] = useState(false);

  useEffect(() => {
    fetchConnectData();
  }, [activeTab]);

  const fetchConnectData = async () => {
    try {
      if (activeTab === 'feed') {
        const response = await axios.get(`${API}/api/connect/posts?limit=20`);
        setPosts(response.data || []);
      } else if (activeTab === 'portfolios') {
        const response = await axios.get(`${API}/api/connect/portfolios/featured`);
        setFeaturedPortfolios(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Connect:', error);
      // Set empty arrays to prevent infinite loading
      if (activeTab === 'feed') setPosts([]);
      if (activeTab === 'portfolios') setFeaturedPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Faça login para criar posts');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const postData = {
        ...newPost,
        tags: newPost.tags.filter(tag => tag.trim() !== '')
      };

      await axios.post(`${API}/api/connect/posts`, postData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewPost({ content: '', post_type: 'text', metadata: {}, tags: [] });
      setShowCreatePost(false);
      fetchConnectData(); // Refresh posts
      alert('Post criado com sucesso!');
    } catch (error) {
      alert('Erro ao criar post: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) {
      alert('Faça login para curtir posts');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/connect/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchConnectData(); // Refresh to show updated likes
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const handleSubmitPortfolio = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Faça login para submeter portfólio');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const portfolioData = {
        ...newPortfolio,
        technologies: newPortfolio.technologies.filter(tech => tech.trim() !== '')
      };

      await axios.post(`${API}/api/connect/portfolios/submit`, portfolioData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewPortfolio({
        title: '',
        description: '',
        project_url: '',
        image_url: '',
        technologies: []
      });
      setShowPortfolioSubmit(false);
      fetchConnectData(); // Refresh portfolios
      alert('Portfólio submetido com sucesso!');
    } catch (error) {
      alert('Erro ao submeter portfólio: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleVotePortfolio = async (portfolioId) => {
    if (!user) {
      alert('Faça login para votar');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/connect/portfolios/${portfolioId}/vote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchConnectData(); // Refresh to show updated votes
      alert('Voto registrado com sucesso!');
    } catch (error) {
      alert('Erro ao votar: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-copper" />
          <h1 className="text-3xl font-bold text-white">Connect</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
            <TabsTrigger value="feed">Feed Social</TabsTrigger>
            <TabsTrigger value="portfolios">Portfólios em Destaque</TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            {/* Create Post Section */}
            {user && !user.is_company && (
              <Card className="bg-gray-900 border-copper/20 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-copper rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-black" />
                    </div>
                    <Button 
                      onClick={() => setShowCreatePost(true)}
                      className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 justify-start"
                      variant="outline"
                    >
                      O que você está desenvolvendo, {user.username}?
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            {loading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper mx-auto mb-4"></div>
                Carregando feed...
              </div>
            ) : posts.length === 0 ? (
              <Card className="bg-gray-900 border-copper/20">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhum post ainda</h3>
                  <p className="text-gray-400 mb-4">Seja o primeiro a compartilhar algo interessante!</p>
                  {user && !user.is_company && (
                    <Button 
                      onClick={() => setShowCreatePost(true)}
                      className="bg-copper hover:bg-copper/90 text-black"
                    >
                      Criar Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <Card key={post.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 bg-copper rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{post.author_username}</span>
                            <span className="text-sm text-gray-400">
                              {new Date(post.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {post.post_type !== 'text' && (
                              <Badge variant="secondary">{post.post_type}</Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                          
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.map(tag => (
                                <Badge key={tag} variant="default" className="bg-copper/20 text-copper">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleLikePost(post.id)}
                              className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Heart className="h-5 w-5" />
                              <span>{post.likes}</span>
                            </button>
                            <div className="flex items-center gap-2 text-gray-400">
                              <MessageSquare className="h-5 w-5" />
                              <span>{post.comments_count}</span>
                            </div>
                            <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                              <Share2 className="h-5 w-5" />
                              <span>Compartilhar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="portfolios">
            {/* Portfolio Submission */}
            {user && !user.is_company && (
              <Card className="bg-gray-900 border-copper/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-copper" />
                    Submeta seu Portfólio da Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Compartilhe seu melhor projeto desta semana e concorra para ser destaque!
                  </p>
                  <Button 
                    onClick={() => setShowPortfolioSubmit(true)}
                    className="bg-copper hover:bg-copper/90 text-black"
                  >
                    Submeter Portfólio
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Featured Portfolios */}
            {loading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper mx-auto mb-4"></div>
                Carregando portfólios...
              </div>
            ) : featuredPortfolios.length === 0 ? (
              <Card className="bg-gray-900 border-copper/20">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhum portfólio esta semana</h3>
                  <p className="text-gray-400">Seja o primeiro a submeter seu projeto!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {featuredPortfolios.map(portfolio => (
                  <Card key={portfolio.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-6">
                      {portfolio.image_url && (
                        <div className="aspect-video bg-gray-800 rounded-lg mb-4 overflow-hidden">
                          <img 
                            src={portfolio.image_url} 
                            alt={portfolio.title}
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                      
                      <h3 className="text-xl font-semibold text-white mb-2">{portfolio.title}</h3>
                      <p className="text-gray-300 mb-4">{portfolio.description}</p>
                      
                      {portfolio.technologies && portfolio.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {portfolio.technologies.map(tech => (
                            <Badge key={tech} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Por {portfolio.user_username}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span>{portfolio.votes} votos</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(portfolio.project_url, '_blank')}
                            size="sm"
                            variant="outline"
                            className="border-copper/20 text-gray-300"
                          >
                            Ver Projeto
                          </Button>
                          {user && portfolio.user_id !== user.id && (
                            <Button
                              onClick={() => handleVotePortfolio(portfolio.id)}
                              size="sm"
                              className="bg-copper hover:bg-copper/90 text-black"
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Votar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <Label className="text-gray-300">Tipo de Post</Label>
              <select
                value={newPost.post_type}
                onChange={(e) => setNewPost(prev => ({...prev, post_type: e.target.value}))}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="text">Texto</option>
                <option value="project">Projeto</option>
                <option value="achievement">Conquista</option>
              </select>
            </div>
            
            <div>
              <Label className="text-gray-300">Conteúdo</Label>
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({...prev, content: e.target.value}))}
                className="bg-gray-800 border-gray-700 text-white"
                rows={4}
                placeholder="O que você quer compartilhar?"
                required
              />
            </div>
            
            <div>
              <Label className="text-gray-300">Tags (separadas por vírgula)</Label>
              <Input
                value={newPost.tags.join(', ')}
                onChange={(e) => setNewPost(prev => ({
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="javascript, react, projeto"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setShowCreatePost(false)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-copper hover:bg-copper/90 text-black"
              >
                Publicar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Portfolio Submission Modal */}
      <Dialog open={showPortfolioSubmit} onOpenChange={setShowPortfolioSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submeter Portfólio da Semana</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPortfolio} className="space-y-4">
            <div>
              <Label className="text-gray-300">Título do Projeto</Label>
              <Input
                value={newPortfolio.title}
                onChange={(e) => setNewPortfolio(prev => ({...prev, title: e.target.value}))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Nome do seu projeto"
                required
              />
            </div>
            
            <div>
              <Label className="text-gray-300">Descrição</Label>
              <Textarea
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio(prev => ({...prev, description: e.target.value}))}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
                placeholder="Descreva seu projeto..."
                required
              />
            </div>
            
            <div>
              <Label className="text-gray-300">URL do Projeto</Label>
              <Input
                value={newPortfolio.project_url}
                onChange={(e) => setNewPortfolio(prev => ({...prev, project_url: e.target.value}))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://github.com/usuario/projeto"
                required
              />
            </div>
            
            <div>
              <Label className="text-gray-300">URL da Imagem (opcional)</Label>
              <Input
                value={newPortfolio.image_url}
                onChange={(e) => setNewPortfolio(prev => ({...prev, image_url: e.target.value}))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://exemplo.com/screenshot.png"
              />
            </div>
            
            <div>
              <Label className="text-gray-300">Tecnologias (separadas por vírgula)</Label>
              <Input
                value={newPortfolio.technologies.join(', ')}
                onChange={(e) => setNewPortfolio(prev => ({
                  ...prev, 
                  technologies: e.target.value.split(',').map(tech => tech.trim()).filter(tech => tech)
                }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setShowPortfolioSubmit(false)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-copper hover:bg-copper/90 text-black"
              >
                Submeter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Store = () => (
  <div className="min-h-screen bg-black">
    <Navigation />
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Loja PCon</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Loja de Vantagens</h3>
          <p className="text-gray-400">Sistema de loja em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Jobs = () => (
  <div className="min-h-screen bg-black">
    <Navigation />
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Vagas</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Portal de Vagas</h3>
          <p className="text-gray-400">Portal B2B em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/registro-empresa" element={<CompanyRegister />} />
            <Route path="/perguntas" element={<QuestionsList />} />
            <Route path="/perguntas/:id" element={<QuestionDetail />} />
            <Route path="/artigos" element={<ArticlesList />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/loja" element={<Store />} />
            <Route path="/vagas" element={<Jobs />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/perfil" element={<ProfileSettings />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;