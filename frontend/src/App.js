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
// [This is a large file - I'll continue implementing the remaining components in the next part]

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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

// Placeholder Home component for now
const Home = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          Acode <span className="text-copper">Lab</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          O ecossistema completo para profissionais de tecnologia
        </p>
        <div className="space-x-4">
          <Link to="/registro">
            <Button className="bg-copper hover:bg-copper/90 text-black">
              Começar Agora
            </Button>
          </Link>
          <Link to="/registro-empresa">
            <Button variant="outline" className="border-copper text-copper hover:bg-copper hover:text-black">
              Sou Empresa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};