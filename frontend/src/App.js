import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Shadcn components
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Label } from "./components/ui/label";

// Icons
import { 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Eye, 
  Trophy, 
  Coins, 
  User, 
  LogOut,
  Plus,
  Star,
  Check
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = ({ children }) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="auth-context">
      {React.cloneElement(children, { user, login, logout })}
    </div>
  );
};

// Header Component
const Header = ({ user, logout }) => {
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
                <div className="flex items-center space-x-4">
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
                  <Badge variant="secondary" className="bg-copper/20 text-copper border-copper/30">
                    {user.rank}
                  </Badge>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-copper/20 text-copper">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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

// Login Component
const Login = ({ login }) => {
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Register Component
const Register = ({ login }) => {
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

// Questions List Component
const QuestionsList = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewQuestion, setShowNewQuestion] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Perguntas</h1>
          {user && (
            <Dialog open={showNewQuestion} onOpenChange={setShowNewQuestion}>
              <DialogTrigger asChild>
                <Button className="bg-copper hover:bg-copper/90 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Pergunta
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-copper/20 text-white">
                <DialogHeader>
                  <DialogTitle>Criar Nova Pergunta</DialogTitle>
                </DialogHeader>
                <NewQuestionForm onSuccess={handleQuestionCreated} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Question Card Component
const QuestionCard = ({ question, user }) => {
  const [userVote, setUserVote] = useState(null);

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
    if (!user) return;

    try {
      await axios.post(`${API}/vote`, {
        target_id: question.id,
        target_type: 'question',
        vote_type: voteType
      });
      
      fetchUserVote();
      // Refresh questions would be better, but for simplicity we'll just update local state
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <Card className="bg-gray-900 border-copper/20 hover:border-copper/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          {/* Vote controls */}
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('upvote')}
              className={`p-1 ${userVote === 'upvote' ? 'text-copper' : 'text-gray-400 hover:text-copper'}`}
              disabled={!user}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-white">
              {question.upvotes - question.downvotes}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              className={`p-1 ${userVote === 'downvote' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              disabled={!user}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Question content */}
          <div className="flex-1">
            <Link to={`/pergunta/${question.id}`}>
              <h3 className="text-xl font-semibold text-white hover:text-copper transition-colors mb-2">
                {question.title}
              </h3>
            </Link>
            
            <p className="text-gray-300 mb-4 line-clamp-3">
              {question.content}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-copper/20 text-copper">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Stats and author */}
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

// New Question Form Component
const NewQuestionForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
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
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      
      onSuccess(response.data);
      setFormData({ title: '', content: '', tags: '' });
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
        <Label htmlFor="content" className="text-gray-300">Conteúdo</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Inclua todos os detalhes que alguém precisaria para responder sua pergunta..."
          rows={8}
          required
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
      
      <Button
        type="submit"
        className="w-full bg-copper hover:bg-copper/90 text-black"
        disabled={loading}
      >
        {loading ? 'Publicando...' : 'Publicar Pergunta'}
      </Button>
    </form>
  );
};

// Home Component
const Home = ({ user }) => {
  if (user) {
    return <Navigate to="/perguntas" replace />;
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

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthContext>
          {({ user, login, logout }) => (
            <>
              <Header user={user} logout={logout} />
              <Routes>
                <Route path="/" element={<Home user={user} />} />
                <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login login={login} />} />
                <Route path="/registro" element={user ? <Navigate to="/" replace /> : <Register login={login} />} />
                <Route path="/perguntas" element={<QuestionsList user={user} />} />
              </Routes>
            </>
          )}
        </AuthContext>
      </BrowserRouter>
    </div>
  );
}

export default App;