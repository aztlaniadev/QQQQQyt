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
  ExternalLink
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

const ArticlesList = () => (
  <div className="min-h-screen bg-black">
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

const Connect = () => (
  <div className="min-h-screen bg-black">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Acode Lab: Connect</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Rede Social</h3>
          <p className="text-gray-400">Conecte-se com outros desenvolvedores...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Store = () => (
  <div className="min-h-screen bg-black">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Loja PCon</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Loja de Vantagens</h3>
          <p className="text-gray-400">Use seus PCon para comprar vantagens...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

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

const AdminPanel = () => (
  <div className="min-h-screen bg-black">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Painel de Administração</h1>
      <Card className="bg-gray-900 border-copper/20">
        <CardContent className="p-8 text-center">
          <Crown className="h-12 w-12 text-copper mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Admin Panel</h3>
          <p className="text-gray-400">Painel para validação de respostas...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

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