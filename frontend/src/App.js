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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
                        <span>{user.pc_points} PC</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-400">
                        <Coins className="h-4 w-4" />
                        <span>{user.pcon_points} PCon</span>
                      </div>
                    </div>
                  )}
                  {!user.is_company && (
                    <Badge variant="secondary" className="bg-copper/20 text-copper border-copper/30">
                      {user.rank}
                    </Badge>
                  )}
                  <Link to="/dashboard">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-copper/20 text-copper">
                        {user.is_company ? user.name?.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase()}
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

// Monaco Editor Component
const CodeEditor = ({ value, onChange, language = "javascript", height = "200px" }) => {
  const textareaRef = React.useRef(null);

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
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
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
        ref={textareaRef}
        value={value}
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

// Company Register Component
const CompanyRegister = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    description: '',
    website: '',
    location: '',
    size: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/auth/register-company`, formData);
      login(response.data.token, response.data.company);
      navigate('/vagas');
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao criar conta da empresa');
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
            Cadastre sua <span className="text-copper">Empresa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Nome da empresa</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
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
              <Label htmlFor="website" className="text-gray-300">Website (opcional)</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://suaempresa.com"
              />
            </div>
            <div>
              <Label htmlFor="size" className="text-gray-300">Tamanho da empresa</Label>
              <Select value={formData.size} onValueChange={(value) => setFormData({...formData, size: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="startup">Startup (1-10)</SelectItem>
                  <SelectItem value="pequena">Pequena (11-50)</SelectItem>
                  <SelectItem value="media">Média (51-200)</SelectItem>
                  <SelectItem value="grande">Grande (201-1000)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-300">Descrição (opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Descreva sua empresa..."
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
              {loading ? 'Criando conta...' : 'Criar conta da empresa'}
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

// Dashboard Component
const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.is_company) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/users/${user.id}/stats`),
        axios.get(`${API}/leaderboard?limit=10`)
      ]);
      
      setStats(statsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_company) {
    return <Navigate to="/vagas" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Bem-vindo de volta, {user?.username}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-copper/20 text-copper border-copper/30 px-4 py-2">
              {user?.rank}
            </Badge>
            <Link to="/perfil">
              <Button variant="outline" className="border-copper text-copper hover:bg-copper hover:text-black">
                <Settings className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">PC (Reputação)</p>
                  <p className="text-2xl font-bold text-copper">{user?.pc_points}</p>
                </div>
                <Trophy className="h-8 w-8 text-copper" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">PCon (Moeda)</p>
                  <p className="text-2xl font-bold text-amber-400">{user?.pcon_points}</p>
                </div>
                <Coins className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Perguntas</p>
                  <p className="text-2xl font-bold text-white">{stats?.questions_count || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Respostas</p>
                  <p className="text-2xl font-bold text-white">{stats?.answers_count || 0}</p>
                </div>
                <Check className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Award className="h-5 w-5 mr-2 text-copper" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user?.achievements?.length > 0 ? (
                  user.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Badge className="bg-copper/20 text-copper border-copper/30">
                        {achievement}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">Nenhuma conquista ainda. Continue contribuindo!</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-copper/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-copper" />
                Top 10 - Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-white">{user.username}</span>
                      <Badge variant="secondary" className="text-xs">
                        {user.rank}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-copper" />
                      <span className="text-copper font-semibold">{user.pc_points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Store Component
const Store = () => {
  const { user, updateUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreItems();
  }, []);

  const fetchStoreItems = async () => {
    try {
      const response = await axios.get(`${API}/store`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching store items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId) => {
    try {
      await axios.post(`${API}/store/purchase/${itemId}`);
      
      // Refresh user data
      const userResponse = await axios.get(`${API}/auth/me`);
      updateUser(userResponse.data);
      
      alert('Item comprado com sucesso!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao comprar item');
    }
  };

  if (user?.is_company) {
    return <Navigate to="/vagas" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Loja PCon</h1>
            <p className="text-gray-400">Use seus Pontos de Conquista para comprar vantagens</p>
          </div>
          <div className="flex items-center space-x-2 bg-gray-900 px-4 py-2 rounded-lg border border-copper/20">
            <Coins className="h-5 w-5 text-amber-400" />
            <span className="text-white">{user?.pcon_points} PCon</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="bg-gray-900 border-copper/20 hover:border-copper/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{item.name}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                  <div className="flex items-center space-x-1 bg-amber-500/20 px-2 py-1 rounded">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400 font-semibold">{item.cost_pcon}</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => handlePurchase(item.id)}
                  disabled={user?.pcon_points < item.cost_pcon}
                  className="w-full bg-copper hover:bg-copper/90 text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {user?.pcon_points >= item.cost_pcon ? 'Comprar' : 'PCon Insuficiente'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Question Components with Monaco Editor
const NewQuestionForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    code: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/questions`, {
        title: formData.title,
        content: formData.content,
        code: formData.code,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      
      onSuccess(response.data);
      setFormData({ title: '', content: '', code: '', tags: '' });
    } catch (error) {
      console.error('Error creating question:', error);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-gray-300">Título da pergunta</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Seja específico e imagine que está perguntando para um colega..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="content" className="text-gray-300">Descrição</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Descreva seu problema em detalhes..."
          rows={4}
          required
        />
      </div>
      
      <div>
        <Label className="text-gray-300">Código (opcional)</Label>
        <CodeEditor
          value={formData.code}
          onChange={(value) => setFormData({...formData, code: value})}
          height="150px"
        />
      </div>
      
      <div>
        <Label htmlFor="tags" className="text-gray-300">Tags (separadas por vírgula)</Label>
        <Input
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="javascript, react, node.js"
        />
      </div>
      
      <div className="flex space-x-3">
        <Button
          type="submit"
          className="flex-1 bg-copper hover:bg-copper/90 text-black"
          disabled={loading}
        >
          {loading ? 'Publicando...' : 'Publicar Pergunta'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

// Continue with remaining components...
// Answer Form Component
const AnswerForm = ({ questionId, onSuccess }) => {
  const [formData, setFormData] = useState({
    content: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/answers`, {
        content: formData.content,
        code: formData.code,
        question_id: questionId
      });
      
      onSuccess(response.data);
      setFormData({ content: '', code: '' });
    } catch (error) {
      console.error('Error creating answer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-copper/20 mt-6">
      <CardHeader>
        <CardTitle className="text-white">Sua Resposta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Compartilhe seu conhecimento e ajude a comunidade..."
            rows={6}
            required
          />
          
          <div>
            <Label className="text-gray-300">Código (opcional)</Label>
            <CodeEditor
              value={formData.code}
              onChange={(value) => setFormData({...formData, code: value})}
              height="150px"
            />
          </div>
          
          <Button
            type="submit"
            className="bg-copper hover:bg-copper/90 text-black"
            disabled={loading}
          >
            {loading ? 'Publicando...' : 'Publicar Resposta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Question Card Component
const QuestionCard = ({ question }) => {
  const { user, updateUser } = useAuth();
  const [userVote, setUserVote] = useState(null);
  const [votes, setVotes] = useState(question.upvotes - question.downvotes);

  useEffect(() => {
    if (user) {
      fetchUserVote();
    }
  }, [user, question.id]);

  const fetchUserVote = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/votes/${question.id}`);
      setUserVote(response.data.vote_type);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (!user || user.id === question.author_id || user.is_company) return;

    try {
      await axios.post(`${API}/vote`, {
        target_id: question.id,
        target_type: 'question',
        vote_type: voteType
      });
      
      if (userVote === voteType) {
        const delta = voteType === 'upvote' ? -1 : 1;
        setVotes(votes + delta);
        setUserVote(null);
      } else {
        let delta = 0;
        if (userVote === null) {
          delta = voteType === 'upvote' ? 1 : -1;
        } else {
          delta = voteType === 'upvote' ? 2 : -2;
        }
        setVotes(votes + delta);
        setUserVote(voteType);
      }

      const userResponse = await axios.get(`${API}/auth/me`);
      updateUser(userResponse.data);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <Card className={`bg-gray-900 border-copper/20 hover:border-copper/40 transition-colors ${question.is_featured ? 'border-amber-500/50 bg-amber-900/10' : ''}`}>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('upvote')}
              className={`p-1 ${userVote === 'upvote' ? 'text-copper' : 'text-gray-400 hover:text-copper'}`}
              disabled={!user || user.id === question.author_id || user.is_company}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-white">{votes}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              className={`p-1 ${userVote === 'downvote' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              disabled={!user || user.id === question.author_id || user.is_company}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1">
            {question.is_featured && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-2">
                ⭐ Destaque
              </Badge>
            )}
            
            <Link to={`/pergunta/${question.id}`}>
              <h3 className="text-xl font-semibold text-white hover:text-copper transition-colors mb-2">
                {question.title}
              </h3>
            </Link>
            
            <p className="text-gray-300 mb-4 line-clamp-3">
              {question.content}
            </p>

            {question.code && (
              <div className="mb-4">
                <CodeEditor
                  value={question.code}
                  onChange={() => {}}
                  height="100px"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-copper/20 text-copper border-copper/30">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{question.answers_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{question.views}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span>por</span>
                <span className="text-copper">{question.author_username}</span>
                <span>{new Date(question.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Questions List Component
const QuestionsList = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(question => 
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        question.author_username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  }, [searchTerm, questions]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/questions`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionCreated = (newQuestion) => {
    setQuestions([newQuestion, ...questions]);
    setShowNewQuestion(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Perguntas</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar perguntas, tags, autores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pl-10"
              />
            </div>
            
            {user && !user.is_company && (
              <Dialog open={showNewQuestion} onOpenChange={setShowNewQuestion}>
                <DialogTrigger asChild>
                  <Button className="bg-copper hover:bg-copper/90 text-black whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Pergunta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-copper/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Pergunta</DialogTitle>
                  </DialogHeader>
                  <NewQuestionForm 
                    onSuccess={handleQuestionCreated} 
                    onCancel={() => setShowNewQuestion(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {searchTerm && (
          <div className="mb-4">
            <p className="text-gray-400">
              {filteredQuestions.length} resultado(s) para "{searchTerm}"
            </p>
          </div>
        )}

        {filteredQuestions.length === 0 ? (
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-copper mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'Nenhuma pergunta encontrada' : 'Nenhuma pergunta ainda'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm 
                  ? `Não encontramos perguntas relacionadas a "${searchTerm}". Tente outros termos.`
                  : 'Seja o primeiro a fazer uma pergunta na comunidade!'
                }
              </p>
              {user && !user.is_company && !searchTerm && (
                <Button 
                  onClick={() => setShowNewQuestion(true)}
                  className="bg-copper hover:bg-copper/90 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer Primeira Pergunta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Articles List Component
const ArticlesList = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewArticle, setShowNewArticle] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API}/articles`);
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const canWriteArticles = user && !user.is_company && (user.rank === 'Mestre' || user.rank === 'Guru');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Artigos</h1>
            <p className="text-gray-400">Conhecimento aprofundado da comunidade</p>
          </div>
          
          {canWriteArticles && (
            <Dialog open={showNewArticle} onOpenChange={setShowNewArticle}>
              <DialogTrigger asChild>
                <Button className="bg-copper hover:bg-copper/90 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Escrever Artigo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-copper/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Escrever Novo Artigo</DialogTitle>
                </DialogHeader>
                <ArticleForm onSuccess={() => {
                  setShowNewArticle(false);
                  fetchArticles();
                }} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {articles.length === 0 ? (
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-copper mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum artigo ainda</h3>
              <p className="text-gray-400 mb-4">
                {canWriteArticles 
                  ? 'Seja o primeiro a compartilhar conhecimento com um artigo!'
                  : 'Apenas usuários Mestre e Guru podem escrever artigos. Continue contribuindo para subir de rank!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Article Form Component
const ArticleForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    published: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/articles`, {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        published: formData.published
      });
      
      onSuccess();
      setFormData({ title: '', content: '', excerpt: '', tags: '', published: false });
    } catch (error) {
      console.error('Error creating article:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-gray-300">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Título do seu artigo..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="excerpt" className="text-gray-300">Resumo</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Um breve resumo do artigo..."
          rows={2}
        />
      </div>
      
      <div>
        <Label htmlFor="content" className="text-gray-300">Conteúdo</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Conteúdo do artigo em markdown..."
          rows={20}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="tags" className="text-gray-300">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({...formData, tags: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="javascript, tutorial, react"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="published"
          checked={formData.published}
          onChange={(e) => setFormData({...formData, published: e.target.checked})}
          className="rounded"
        />
        <Label htmlFor="published" className="text-gray-300">Publicar imediatamente</Label>
      </div>
      
      <Button
        type="submit"
        className="w-full bg-copper hover:bg-copper/90 text-black"
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar Artigo'}
      </Button>
    </form>
  );
};

// Article Card Component
const ArticleCard = ({ article }) => {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState(null);
  const [votes, setVotes] = useState(article.upvotes - article.downvotes);

  useEffect(() => {
    if (user && !user.is_company) {
      fetchUserVote();
    }
  }, [user, article.id]);

  const fetchUserVote = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/votes/${article.id}`);
      setUserVote(response.data.vote_type);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (!user || user.is_company || user.id === article.author_id) return;

    try {
      await axios.post(`${API}/vote`, {
        target_id: article.id,
        target_type: 'article',
        vote_type: voteType
      });
      
      if (userVote === voteType) {
        const delta = voteType === 'upvote' ? -1 : 1;
        setVotes(votes + delta);
        setUserVote(null);
      } else {
        let delta = 0;
        if (userVote === null) {
          delta = voteType === 'upvote' ? 1 : -1;
        } else {
          delta = voteType === 'upvote' ? 2 : -2;
        }
        setVotes(votes + delta);
        setUserVote(voteType);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <Card className="bg-gray-900 border-copper/20 hover:border-copper/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('upvote')}
              className={`p-1 ${userVote === 'upvote' ? 'text-copper' : 'text-gray-400 hover:text-copper'}`}
              disabled={!user || user.is_company || user.id === article.author_id}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-white">{votes}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              className={`p-1 ${userVote === 'downvote' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              disabled={!user || user.is_company || user.id === article.author_id}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1">
            <Link to={`/artigo/${article.id}`}>
              <h3 className="text-2xl font-bold text-white hover:text-copper transition-colors mb-3">
                {article.title}
              </h3>
            </Link>
            
            <p className="text-gray-300 mb-4 leading-relaxed">
              {article.excerpt || article.content.substring(0, 200) + '...'}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.views}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Artigo</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span>por</span>
                <span className="text-copper">{article.author_username}</span>
                <span>{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Connect (Social Feed) Component
const Connect = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await axios.get(`${API}/feed`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response = await axios.post(`${API}/posts`, {
        content: newPost,
        post_type: 'text'
      });
      
      setPosts([response.data, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (user?.is_company) {
    return <Navigate to="/vagas" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Acode Lab: Connect</h1>
        
        {user && (
          <Card className="bg-gray-900 border-copper/20 mb-8">
            <CardContent className="p-6">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Compartilhe suas conquistas, projetos ou insights..."
                  rows={3}
                />
                <Button
                  type="submit"
                  className="bg-copper hover:bg-copper/90 text-black"
                  disabled={!newPost.trim()}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-gray-900 border-copper/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-copper/20 text-copper">
                      {post.author_username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-white">{post.author_username}</span>
                      <span className="text-gray-400 text-sm">
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 whitespace-pre-wrap mb-4">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <button className="flex items-center space-x-1 hover:text-copper transition-colors">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-copper transition-colors">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Jobs (Company Portal) Component
const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    fetchJobs();
    if (user?.is_company) {
      fetchMyJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs`);
      setMyJobs(response.data.filter(job => job.company_id === user.id));
    } catch (error) {
      console.error('Error fetching my jobs:', error);
    }
  };

  const searchTalent = async () => {
    try {
      const response = await axios.get(`${API}/talent-search`);
      setTalents(response.data);
    } catch (error) {
      console.error('Error searching talent:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            {user?.is_company ? 'Portal da Empresa' : 'Vagas'}
          </h1>
          
          {user?.is_company && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-copper hover:bg-copper/90 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar Vaga
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-copper/20 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Publicar Nova Vaga</DialogTitle>
                </DialogHeader>
                <JobForm onSuccess={() => {
                  fetchJobs();
                  fetchMyJobs();
                }} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {user?.is_company ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-800 mb-8">
              <TabsTrigger value="jobs" className="data-[state=active]:bg-copper data-[state=active]:text-black">
                Minhas Vagas ({myJobs.length})
              </TabsTrigger>
              <TabsTrigger value="talent" className="data-[state=active]:bg-copper data-[state=active]:text-black">
                Buscar Talentos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs">
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <JobCard key={job.id} job={job} isOwner />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="talent">
              <div className="mb-6">
                <Button onClick={searchTalent} className="bg-copper hover:bg-copper/90 text-black">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Talentos
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {talents.map((talent) => (
                  <TalentCard key={talent.id} talent={talent} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Job Form Component
const JobForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    salary_range: '',
    location: '',
    remote: false,
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/jobs`, {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      
      onSuccess();
      setFormData({
        title: '',
        description: '',
        requirements: '',
        salary_range: '',
        location: '',
        remote: false,
        tags: ''
      });
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-gray-300">Título da vaga</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description" className="text-gray-300">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          rows={4}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="requirements" className="text-gray-300">Requisitos</Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={(e) => setFormData({...formData, requirements: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          rows={4}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="salary_range" className="text-gray-300">Faixa salarial</Label>
        <Input
          id="salary_range"
          value={formData.salary_range}
          onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="R$ 5.000 - R$ 8.000"
        />
      </div>
      
      <div>
        <Label htmlFor="location" className="text-gray-300">Localização</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="São Paulo, SP"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="remote"
          checked={formData.remote}
          onChange={(e) => setFormData({...formData, remote: e.target.checked})}
        />
        <Label htmlFor="remote" className="text-gray-300">Trabalho remoto</Label>
      </div>
      
      <div>
        <Label htmlFor="tags" className="text-gray-300">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({...formData, tags: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="javascript, react, senior"
        />
      </div>
      
      <Button
        type="submit"
        className="w-full bg-copper hover:bg-copper/90 text-black"
        disabled={loading}
      >
        {loading ? 'Publicando...' : 'Publicar Vaga'}
      </Button>
    </form>
  );
};

// Job Card Component
const JobCard = ({ job, isOwner = false }) => {
  return (
    <Card className="bg-gray-900 border-copper/20 hover:border-copper/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
            <p className="text-copper font-medium">{job.company_name}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {job.remote && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Remoto
              </Badge>
            )}
            {job.salary_range && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {job.salary_range}
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-gray-300 mb-4 line-clamp-3">{job.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="bg-copper/20 text-copper border-copper/30">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{job.location || 'Remoto'}</span>
            <span>{job.applications_count} candidatos</span>
          </div>
          
          <span>{new Date(job.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
        
        {!isOwner && (
          <div className="mt-4">
            <Button className="bg-copper hover:bg-copper/90 text-black">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Vaga
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Talent Card Component
const TalentCard = ({ talent }) => {
  return (
    <Card className="bg-gray-900 border-copper/20 hover:border-copper/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-copper/20 text-copper text-lg">
              {talent.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-lg font-semibold text-white">{talent.username}</h3>
            <div className="flex items-center space-x-2">
              <Badge className="bg-copper/20 text-copper border-copper/30">
                {talent.rank}
              </Badge>
              <div className="flex items-center space-x-1 text-copper text-sm">
                <Trophy className="h-3 w-3" />
                <span>{talent.pc_points} PC</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{talent.bio}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {talent.skills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {talent.skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{talent.skills.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{talent.location}</span>
          <span>{talent.achievements.length} conquistas</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Admin Panel Component remains the same as before...
const AdminPanel = () => {
  const { user } = useAuth();
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [answersRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/answers/pending`),
        axios.get(`${API}/admin/stats`)
      ]);
      
      setPendingAnswers(answersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAnswer = async (answerId) => {
    try {
      await axios.post(`${API}/admin/answers/${answerId}/validate`);
      setPendingAnswers(pendingAnswers.filter(answer => answer.id !== answerId));
      fetchAdminData(); // Refresh stats
    } catch (error) {
      console.error('Error validating answer:', error);
    }
  };

  const handleRejectAnswer = async (answerId) => {
    try {
      await axios.post(`${API}/admin/answers/${answerId}/reject`);
      setPendingAnswers(pendingAnswers.filter(answer => answer.id !== answerId));
      fetchAdminData(); // Refresh stats
    } catch (error) {
      console.error('Error rejecting answer:', error);
    }
  };

  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Painel de Administração</h1>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <Crown className="h-4 w-4 mr-1" />
            Administrador
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.total_users}</p>
              <p className="text-gray-400 text-sm">Usuários</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-4 text-center">
              <Building className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.total_companies}</p>
              <p className="text-gray-400 text-sm">Empresas</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.total_questions}</p>
              <p className="text-gray-400 text-sm">Perguntas</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.pending_answers}</p>
              <p className="text-gray-400 text-sm">Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Answers */}
        <Card className="bg-gray-900 border-copper/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="h-5 w-5 mr-2 text-copper" />
              Respostas Pendentes de Validação ({pendingAnswers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAnswers.length === 0 ? (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Todas as respostas validadas!
                </h3>
                <p className="text-gray-400">
                  Não há respostas pendentes no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAnswers.map((answer) => (
                  <Card key={answer.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">
                            Resposta de <span className="text-copper">{answer.author_username}</span>
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(answer.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                          Pendente
                        </Badge>
                      </div>
                      
                      <div className="text-gray-300 mb-4 whitespace-pre-wrap">
                        {answer.content}
                      </div>
                      
                      {answer.code && (
                        <div className="mb-4">
                          <CodeEditor
                            value={answer.code}
                            onChange={() => {}}
                            height="100px"
                          />
                        </div>
                      )}
                      
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleValidateAnswer(answer.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Validar (+5 PC, +10 PCon)
                        </Button>
                        <Button
                          onClick={() => handleRejectAnswer(answer.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Rejeitar (remover)
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

export default function App() {
  return (
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
            <Route path="/loja" element={<Store />} />
            <Route path="/perguntas" element={<QuestionsList />} />
            <Route path="/artigos" element={<ArticlesList />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/vagas" element={<Jobs />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}