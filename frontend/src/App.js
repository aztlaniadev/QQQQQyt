import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Shadcn components
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";

// Icons
import { 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Eye, 
  Trophy, 
  Coins, 
  LogOut,
  Plus,
  Check,
  User,
  Search,
  Code,
  BookOpen,
  Users,
  Briefcase,
  Star,
  Heart,
  Share2,
  Edit,
  Settings,
  TrendingUp,
  Award,
  ShoppingCart,
  Building,
  Filter,
  Crown,
  Zap,
  Target,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  Clock,
  X
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
            <p className="text-gray-400 mb-4">Erro: {this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-copper px-4 py-2 rounded text-black"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
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

// Monaco Editor Component (Simplified)
const CodeEditor = ({ value = "", onChange, language = "javascript", height = "200px" }) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = (value || "").substring(0, start) + '  ' + (value || "").substring(end);
      if (onChange) {
        onChange(newValue);
      }
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-3 py-2 text-sm text-gray-400 border-b border-gray-700">
        <Code className="h-4 w-4 inline mr-2" />
        {language}
      </div>
      <textarea
        value={value || ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full bg-gray-900 text-gray-100 p-3 font-mono text-sm resize-none focus:outline-none"
        style={{ height }}
        placeholder="Digite seu código aqui..."
        spellCheck={false}
      />
    </div>
  );
};

// Header Component
const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-black border-b border-copper/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-copper to-amber-400 rounded-lg"></div>
            <span className="text-2xl font-bold text-white">
              Acode <span className="text-copper">Lab</span>
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            {user ? (
              <>
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
                {user.is_company && (
                  <Link to="/vagas" className="text-gray-300 hover:text-copper transition-colors">
                    Vagas
                  </Link>
                )}
                {user.is_admin && (
                  <Link to="/admin" className="text-gray-300 hover:text-copper transition-colors">
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  {!user.is_company && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-1 text-copper">
                        <Trophy className="h-4 w-4" />
                        <span>{user.pc_points || 0} PC</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-400">
                        <Coins className="h-4 w-4" />
                        <span>{user.pcon_points || 0} PCon</span>
                      </div>
                    </div>
                  )}
                  {!user.is_company && (
                    <Badge variant="secondary" className="bg-copper/20 text-copper border-copper/30">
                      {user.rank || 'Iniciante'}
                    </Badge>
                  )}
                  <Link to="/dashboard">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-copper/20 text-copper">
                        {user.is_company ? 
                          (user.name || 'E').charAt(0).toUpperCase() : 
                          (user.username || 'U').charAt(0).toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-copper">
                    Entrar
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button className="bg-copper hover:bg-copper/90 text-black">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

// Home Component
const Home = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Acode <span className="text-copper">Lab</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            O ecossistema completo para profissionais de tecnologia.
            Resolva problemas, construa reputação e desenvolva sua carreira.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registro">
              <Button size="lg" className="bg-copper hover:bg-copper/90 text-black font-semibold px-8 py-3">
                Começar Agora
              </Button>
            </Link>
            <Link to="/registro-empresa">
              <Button size="lg" variant="outline" className="border-copper text-copper hover:bg-copper hover:text-black px-8 py-3">
                Sou Empresa
              </Button>
            </Link>
            <Link to="/perguntas">
              <Button size="lg" variant="outline" className="border-copper text-copper hover:bg-copper hover:text-black px-8 py-3">
                Explorar Perguntas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Como Funciona
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-copper/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-copper" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Faça Perguntas</h3>
                <p className="text-gray-300">
                  Encontre soluções para seus desafios técnicos com a ajuda da comunidade.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-copper/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-copper" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Ganhe Reputação</h3>
                <p className="text-gray-300">
                  Acumule PC (Pontos de Classificação) ajudando outros e demonstre sua expertise.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-copper/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-6 w-6 text-copper" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Use PCon</h3>
                <p className="text-gray-300">
                  Ganhe Pontos de Conquista (PCon) e use como moeda para vantagens na plataforma.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Sistema de Gamificação
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-copper mr-2" />
                  <h3 className="text-2xl font-semibold text-white">PC - Pontos de Classificação</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Sua reputação técnica na comunidade. Ganhe PC por:
                </p>
                <ul className="text-left text-gray-300 space-y-2">
                  <li>• Respostas aceitas: +15 PC</li>
                  <li>• Votos positivos: +2 PC</li>
                  <li>• Contribuições de qualidade</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Coins className="h-8 w-8 text-amber-400 mr-2" />
                  <h3 className="text-2xl font-semibold text-white">PCon - Pontos de Conquista</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Moeda virtual para vantagens. Ganhe PCon por:
                </p>
                <ul className="text-left text-gray-300 space-y-2">
                  <li>• Criar perguntas: +5 PCon</li>
                  <li>• Responder perguntas: +10 PCon</li>
                  <li>• Respostas aceitas: +25 PCon</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-copper/10 to-amber-400/10 rounded-lg p-8 border border-copper/20">
            <h3 className="text-2xl font-semibold text-white mb-4">Ranks Disponíveis</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="bg-gray-800 text-gray-300 px-4 py-2">Iniciante (0-99 PC)</Badge>
              <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 px-4 py-2">Colaborador (100-499 PC)</Badge>
              <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 px-4 py-2">Especialista (500-1999 PC)</Badge>
              <Badge variant="secondary" className="bg-amber-900/50 text-amber-300 px-4 py-2">Mestre (2000-4999 PC)</Badge>
              <Badge variant="secondary" className="bg-copper/50 text-copper px-4 py-2">Guru (5000+ PC)</Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Login Component
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      login(response.data.token, response.data.user);
      navigate(response.data.user.is_company ? '/vagas' : '/dashboard');
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-900 border-copper/20">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">
            Entrar no <span className="text-copper">Acode Lab</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Não tem uma conta? {' '}
              <Link to="/registro" className="text-copper hover:underline">
                Cadastre-se
              </Link>
            </p>
            <p className="text-gray-400 mt-2">
              Empresa? {' '}
              <Link to="/registro-empresa" className="text-copper hover:underline">
                Cadastre sua empresa
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Register Component
const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-900 border-copper/20">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">
            Junte-se ao <span className="text-copper">Acode Lab</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-300">Nome de usuário</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="location" className="text-gray-300">Localização (opcional)</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Ex: São Paulo, Brasil"
              />
            </div>
            <div>
              <Label htmlFor="bio" className="text-gray-300">Bio (opcional)</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Conte um pouco sobre você..."
                rows={3}
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
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Já tem uma conta? {' '}
              <Link to="/login" className="text-copper hover:underline">
                Entre aqui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Simplified Dashboard for testing
const Dashboard = () => {
  const { user } = useAuth();

  if (user?.is_company) {
    return <Navigate to="/vagas" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Dashboard - Bem-vindo, {user?.username || 'Usuário'}!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-copper mx-auto mb-2" />
              <p className="text-2xl font-bold text-copper">{user?.pc_points || 0}</p>
              <p className="text-gray-400 text-sm">PC (Reputação)</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Coins className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-400">{user?.pcon_points || 0}</p>
              <p className="text-gray-400 text-sm">PCon (Moeda)</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{user?.rank || 'Iniciante'}</p>
              <p className="text-gray-400 text-sm">Rank Atual</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{user?.achievements?.length || 0}</p>
              <p className="text-gray-400 text-sm">Conquistas</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/perguntas">
                  <Button className="w-full bg-copper hover:bg-copper/90 text-black">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Perguntas
                  </Button>
                </Link>
                <Link to="/artigos">
                  <Button className="w-full" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Artigos
                  </Button>
                </Link>
                <Link to="/connect">
                  <Button className="w-full" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </Link>
                <Link to="/loja">
                  <Button className="w-full" variant="outline">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Loja PCon
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Questions List Component
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
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{question.title}</h3>
                      <p className="text-gray-300 mb-3 line-clamp-3">{question.content}</p>
                      
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-copper/20 text-copper">
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
                    </div>
                  </div>
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

const ArticlesList = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    published: false
  });

  const canCreateArticle = user && ['Mestre', 'Guru'].includes(user.rank);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API}/articles`);
      setArticles(response.data);
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const articleData = {
        ...newArticle,
        tags: newArticle.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      await axios.post(`${API}/articles`, articleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateForm(false);
      setNewArticle({ title: '', content: '', excerpt: '', tags: '', published: false });
      fetchArticles();
    } catch (error) {
      console.error('Erro ao criar artigo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Artigos</h1>
          {canCreateArticle && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-copper hover:bg-copper/90 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Artigo
            </Button>
          )}
        </div>

        {!canCreateArticle && user && !user.is_company && (
          <Card className="mb-6 bg-gray-900 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-yellow-500" />
                <p className="text-yellow-200">
                  Apenas usuários <strong>Mestre</strong> ou <strong>Guru</strong> podem escrever artigos. 
                  Continue participando para subir de rank!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {showCreateForm && (
          <Card className="mb-6 bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white">Novo Artigo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Título</Label>
                  <Input
                    value={newArticle.title}
                    onChange={(e) => setNewArticle(prev => ({...prev, title: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Resumo</Label>
                  <Textarea
                    value={newArticle.excerpt}
                    onChange={(e) => setNewArticle(prev => ({...prev, excerpt: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={2}
                    placeholder="Breve descrição do artigo..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Conteúdo</Label>
                  <Textarea
                    value={newArticle.content}
                    onChange={(e) => setNewArticle(prev => ({...prev, content: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={10}
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Tags (separadas por vírgula)</Label>
                  <Input
                    value={newArticle.tags}
                    onChange={(e) => setNewArticle(prev => ({...prev, tags: e.target.value}))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="javascript, tutorial, avançado"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={newArticle.published}
                    onChange={(e) => setNewArticle(prev => ({...prev, published: e.target.checked}))}
                    className="rounded"
                  />
                  <Label htmlFor="published" className="text-gray-300">Publicar imediatamente</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-copper hover:bg-copper/90 text-black">
                    {newArticle.published ? 'Publicar' : 'Salvar Rascunho'}
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
          <div className="text-center text-gray-400">Carregando artigos...</div>
        ) : (
          <div className="space-y-6">
            {articles.map(article => (
              <Card key={article.id} className="bg-gray-900 border-gray-700 hover:border-copper/50 transition-colors">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
                    <p className="text-gray-300 mb-4">{article.excerpt || article.content.substring(0, 200) + '...'}</p>
                    
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-copper/20 text-copper">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-4">
                        <span>Por {article.author_username}</span>
                        <span>{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4" />
                          <span>{article.upvotes}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>{article.views}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ler mais
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {articles.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                Nenhum artigo publicado ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Connect = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    post_type: 'text',
    metadata: {}
  });

  useEffect(() => {
    fetchFeed();
    fetchUsers();
  }, []);

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Erro ao buscar feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard?type=pc&limit=10`);
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/posts`, newPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreatePost(false);
      setNewPost({ content: '', post_type: 'text', metadata: {} });
      fetchFeed();
    } catch (error) {
      console.error('Erro ao criar post:', error);
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh feed after following
      fetchFeed();
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Acode Lab: Connect</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Principal */}
          <div className="lg:col-span-2">
            {user && !user.is_company && (
              <Card className="mb-6 bg-gray-900 border-copper/20">
                <CardContent className="p-4">
                  {!showCreatePost ? (
                    <Button 
                      onClick={() => setShowCreatePost(true)}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-left justify-start"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      O que você está pensando, {user.username}?
                    </Button>
                  ) : (
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <Textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({...prev, content: e.target.value}))}
                        placeholder="Compartilhe seus pensamentos, projetos ou conquistas..."
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={4}
                        required
                      />
                      <div className="flex items-center gap-2">
                        <Select value={newPost.post_type} onValueChange={(value) => setNewPost(prev => ({...prev, post_type: value}))}>
                          <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="project">Projeto</SelectItem>
                            <SelectItem value="achievement">Conquista</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2 ml-auto">
                          <Button type="submit" className="bg-copper hover:bg-copper/90 text-black">
                            Publicar
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowCreatePost(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="text-center text-gray-400">Carregando feed...</div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <Card key={post.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-copper text-black">
                            {post.author_username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{post.author_username}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {post.post_type === 'project' ? 'Projeto' : 
                               post.post_type === 'achievement' ? 'Conquista' : 'Post'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(post.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.comments_count}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
                          <Share2 className="h-4 w-4" />
                          Compartilhar
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {posts.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum post ainda. Siga outros usuários para ver conteúdo!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-copper/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-copper" />
                  Top Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(0, 5).map((topUser, index) => (
                    <div key={topUser.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-copper/20 rounded-full text-copper font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{topUser.username}</p>
                          <p className="text-xs text-gray-400">{topUser.pc_points} PC</p>
                        </div>
                      </div>
                      {user && topUser.id !== user.id && !user.is_company && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFollowUser(topUser.id)}
                        >
                          Seguir
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {user && (
              <Card className="bg-gray-900 border-copper/20">
                <CardHeader>
                  <CardTitle className="text-white">Suas Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rank</span>
                      <span className="text-copper font-semibold">{user.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PC</span>
                      <span className="text-white">{user.pc_points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PCon</span>
                      <span className="text-amber-400">{user.pcon_points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seguindo</span>
                      <span className="text-white">{user.following?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seguidores</span>
                      <span className="text-white">{user.followers?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Store = () => {
  const { user } = useAuth();
  const [storeItems, setStoreItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreItems();
  }, []);

  const fetchStoreItems = async () => {
    try {
      const response = await axios.get(`${API}/store`);
      setStoreItems(response.data);
    } catch (error) {
      console.error('Erro ao buscar itens da loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/store/purchase/${itemId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh user data to update PCon balance
      window.location.reload();
    } catch (error) {
      console.error('Erro ao comprar item:', error);
      alert('Erro ao comprar item. Verifique se você tem PCon suficientes.');
    }
  };

  const categoryIcons = {
    features: Zap,
    cosmetic: Star,
    premium: Crown
  };

  const categoryNames = {
    features: 'Funcionalidades',
    cosmetic: 'Cosméticos',
    premium: 'Premium'
  };

  const groupedItems = storeItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Loja PCon</h1>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Seu saldo</p>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <span className="text-xl font-bold text-amber-400">{user.pcon_points || 0}</span>
                  <span className="text-gray-400">PCon</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {!user && (
          <Card className="mb-6 bg-gray-900 border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-yellow-200">
                <strong>Faça login</strong> para ver seus PCon e fazer compras na loja.
              </p>
            </CardContent>
          </Card>
        )}

        {user?.is_company && (
          <Card className="mb-6 bg-gray-900 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-blue-200">
                A loja PCon é exclusiva para usuários desenvolvedores. Empresas não podem fazer compras.
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center text-gray-400">Carregando loja...</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => {
              const IconComponent = categoryIcons[category] || ShoppingCart;
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <IconComponent className="h-6 w-6 text-copper" />
                    <h2 className="text-2xl font-bold text-white">
                      {categoryNames[category] || category}
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                      <Card key={item.id} className="bg-gray-900 border-gray-700 hover:border-copper/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                            <p className="text-gray-300 text-sm mb-4">{item.description}</p>
                            
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Coins className="h-5 w-5 text-amber-400" />
                                <span className="text-xl font-bold text-amber-400">{item.cost_pcon}</span>
                                <span className="text-gray-400">PCon</span>
                              </div>
                              
                              <Badge 
                                variant="secondary" 
                                className={
                                  category === 'features' ? 'bg-blue-500/20 text-blue-400' :
                                  category === 'cosmetic' ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }
                              >
                                {categoryNames[category]}
                              </Badge>
                            </div>
                            
                            {user && !user.is_company ? (
                              <Button 
                                onClick={() => handlePurchase(item.id)}
                                disabled={user.pcon_points < item.cost_pcon}
                                className={
                                  user.pcon_points >= item.cost_pcon 
                                    ? "w-full bg-copper hover:bg-copper/90 text-black"
                                    : "w-full"
                                }
                                variant={user.pcon_points >= item.cost_pcon ? "default" : "secondary"}
                              >
                                {user.pcon_points >= item.cost_pcon ? (
                                  <>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Comprar
                                  </>
                                ) : (
                                  <>PCon insuficientes</>
                                )}
                              </Button>
                            ) : (
                              <Button disabled className="w-full" variant="secondary">
                                {!user ? 'Faça login para comprar' : 'Não disponível para empresas'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {storeItems.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum item disponível na loja no momento.</p>
              </div>
            )}
          </div>
        )}

        {user && !user.is_company && (
          <Card className="mt-8 bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-copper" />
                Como ganhar PCon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-gray-300">• <strong>Criar perguntas:</strong> +5 PCon</p>
                  <p className="text-gray-300">• <strong>Respostas validadas:</strong> +10 PCon</p>
                  <p className="text-gray-300">• <strong>Respostas aceitas:</strong> +25 PCon</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-300">• <strong>Receber upvotes:</strong> +1 PCon</p>
                  <p className="text-gray-300">• <strong>Publicar artigos:</strong> +50 PCon</p>
                  <p className="text-gray-300">• <strong>Conquistas especiais:</strong> PCon variável</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const Jobs = () => (
  <div className="min-h-screen bg-black">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Portal de Vagas</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sistema B2B</h3>
          <p className="text-gray-400">Empresas podem publicar vagas e buscar talentos...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const AdminPanel = () => {
  const { user } = useAuth();
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      fetchPendingAnswers();
      fetchAdminStats();
    }
  }, [user]);

  const fetchPendingAnswers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/answers/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingAnswers(response.data);
    } catch (error) {
      console.error('Erro ao buscar respostas pendentes:', error);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
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
      
      // Remove from pending list
      setPendingAnswers(prev => prev.filter(answer => answer.id !== answerId));
      
      // Refresh stats
      fetchAdminStats();
      
      alert('Resposta validada com sucesso!');
    } catch (error) {
      console.error('Erro ao validar resposta:', error);
      alert('Erro ao validar resposta.');
    }
  };

  const handleRejectAnswer = async (answerId) => {
    if (!confirm('Tem certeza que deseja rejeitar esta resposta? Ela será removida permanentemente.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/answers/${answerId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from pending list
      setPendingAnswers(prev => prev.filter(answer => answer.id !== answerId));
      
      // Refresh stats
      fetchAdminStats();
      
      alert('Resposta rejeitada e removida.');
    } catch (error) {
      console.error('Erro ao rejeitar resposta:', error);
      alert('Erro ao rejeitar resposta.');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="h-8 w-8 text-copper" />
          <h1 className="text-3xl font-bold text-white">Painel de Administração</h1>
        </div>

        {/* Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.total_users || 0}</p>
                <p className="text-xs text-gray-400">Usuários</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-4 text-center">
                <Building className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.total_companies || 0}</p>
                <p className="text-xs text-gray-400">Empresas</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.total_questions || 0}</p>
                <p className="text-xs text-gray-400">Perguntas</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-4 text-center">
                <Check className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.total_answers || 0}</p>
                <p className="text-xs text-gray-400">Respostas</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.pending_answers || 0}</p>
                <p className="text-xs text-gray-400">Pendentes</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-copper/20">
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.total_articles || 0}</p>
                <p className="text-xs text-gray-400">Artigos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Answers Section */}
        <Card className="bg-gray-900 border-copper/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              Respostas Pendentes de Validação ({pendingAnswers.length})
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
      </div>
    </div>
  );
};

// Company Register placeholder
const CompanyRegister = () => (
  <div className="min-h-screen bg-black flex items-center justify-center px-4">
    <Card className="w-full max-w-md bg-gray-900 border-copper/20">
      <CardContent className="p-8 text-center">
        <Building className="h-12 w-12 text-copper mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Cadastro de Empresa</h3>
        <p className="text-gray-400 mb-4">Funcionalidade em desenvolvimento...</p>
        <Link to="/login">
          <Button className="bg-copper hover:bg-copper/90 text-black">
            Voltar ao Login
          </Button>
        </Link>
      </CardContent>
    </Card>
  </div>
);

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <BrowserRouter>
          <AuthProvider>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/registro-empresa" element={<CompanyRegister />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/perguntas" element={<QuestionsList />} />
              <Route path="/artigos" element={<ArticlesList />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/loja" element={<Store />} />
              <Route path="/vagas" element={<Jobs />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </ErrorBoundary>
  );
}

export default App;