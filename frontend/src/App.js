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
  Search
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
                {user.is_admin && (
                  <Link to="/admin" className="text-gray-300 hover:text-copper transition-colors">
                    Admin
                  </Link>
                )}
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
      navigate('/perguntas');
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
      navigate('/perguntas');
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

// New Question Form Component
const NewQuestionForm = ({ onSuccess, onCancel }) => {
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

// Answer Form Component
const AnswerForm = ({ questionId, onSuccess }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/answers`, {
        content,
        question_id: questionId
      });
      
      onSuccess(response.data);
      setContent('');
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Compartilhe seu conhecimento e ajude a comunidade..."
            rows={6}
            required
          />
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

// Answer Card Component
const AnswerCard = ({ answer, questionAuthorId, onAccepted, onUserUpdate }) => {
  const { user, updateUser } = useAuth();
  const [userVote, setUserVote] = useState(null);
  const [votes, setVotes] = useState(answer.upvotes - answer.downvotes);
  const [isAccepted, setIsAccepted] = useState(answer.is_accepted);

  useEffect(() => {
    if (user) {
      fetchUserVote();
    }
  }, [user, answer.id]);

  const fetchUserVote = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/votes/${answer.id}`);
      setUserVote(response.data.vote_type);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (!user || user.id === answer.author_id) return;

    try {
      await axios.post(`${API}/vote`, {
        target_id: answer.id,
        target_type: 'answer',
        vote_type: voteType
      });
      
      // Update local state
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

      // Refresh user data
      const userResponse = await axios.get(`${API}/auth/me`);
      updateUser(userResponse.data);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleAccept = async () => {
    if (!user || user.id !== questionAuthorId) return;

    try {
      await axios.post(`${API}/answers/${answer.id}/accept`);
      setIsAccepted(true);
      onAccepted();
      
      // Refresh user data
      const userResponse = await axios.get(`${API}/auth/me`);
      updateUser(userResponse.data);
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  return (
    <Card className={`bg-gray-900 border-copper/20 ${isAccepted ? 'border-green-500/50 bg-green-900/10' : ''}`}>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          {/* Vote controls */}
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('upvote')}
              className={`p-1 ${
                userVote === 'upvote' 
                  ? 'text-copper' 
                  : 'text-gray-400 hover:text-copper'
              }`}
              disabled={!user || user.id === answer.author_id}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-white">
              {votes}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              className={`p-1 ${
                userVote === 'downvote' 
                  ? 'text-red-400' 
                  : 'text-gray-400 hover:text-red-400'
              }`}
              disabled={!user || user.id === answer.author_id}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
            
            {/* Accept answer button */}
            {user && user.id === questionAuthorId && !isAccepted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAccept}
                className="p-1 text-gray-400 hover:text-green-400 mt-2"
                title="Aceitar resposta"
              >
                <Check className="h-5 w-5" />
              </Button>
            )}
            
            {isAccepted && (
              <div className="mt-2 p-1">
                <Check className="h-5 w-5 text-green-400" title="Resposta aceita" />
              </div>
            )}
          </div>

          {/* Answer content */}
          <div className="flex-1">
            {isAccepted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-3">
                ✓ Resposta Aceita
              </Badge>
            )}
            
            <div className="text-gray-300 mb-4 whitespace-pre-wrap">
              {answer.content}
            </div>

            {/* Author info */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>respondido por</span>
                <span className="text-copper">{answer.author_username}</span>
                <span>{new Date(answer.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Question Detail Component
const QuestionDetail = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);
  const [votes, setVotes] = useState(0);

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
  }, [id]);

  useEffect(() => {
    if (user && question) {
      fetchUserVote();
    }
  }, [user, question]);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`${API}/questions/${id}`);
      setQuestion(response.data);
      setVotes(response.data.upvotes - response.data.downvotes);
    } catch (error) {
      console.error('Error fetching question:', error);
    }
  };

  const fetchAnswers = async () => {
    try {
      const response = await axios.get(`${API}/questions/${id}/answers`);
      setAnswers(response.data);
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVote = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/votes/${question.id}`);
      setUserVote(response.data.vote_type);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (!user || user.id === question.author_id) return;

    try {
      await axios.post(`${API}/vote`, {
        target_id: question.id,
        target_type: 'question',
        vote_type: voteType
      });
      
      // Update local state
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

      // Refresh user data
      const userResponse = await axios.get(`${API}/auth/me`);
      updateUser(userResponse.data);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleAnswerCreated = (newAnswer) => {
    setAnswers([...answers, newAnswer]);
    fetchQuestion(); // Refresh to update answer count
    
    // Refresh user data
    axios.get(`${API}/auth/me`).then(response => {
      updateUser(response.data);
    });
  };

  const handleAnswerAccepted = () => {
    fetchAnswers(); // Refresh answers to show accepted state
    fetchQuestion(); // Refresh question data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Pergunta não encontrada</h2>
          <Link to="/perguntas">
            <Button className="bg-copper hover:bg-copper/90 text-black">
              Voltar às Perguntas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Question Card */}
        <Card className="bg-gray-900 border-copper/20 mb-6">
          <CardContent className="p-6">
            <div className="flex space-x-4">
              {/* Vote controls */}
              <div className="flex flex-col items-center space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('upvote')}
                  className={`p-1 ${
                    userVote === 'upvote' 
                      ? 'text-copper' 
                      : 'text-gray-400 hover:text-copper'
                  }`}
                  disabled={!user || user.id === question.author_id}
                >
                  <ArrowUp className="h-6 w-6" />
                </Button>
                <span className="text-lg font-medium text-white">
                  {votes}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('downvote')}
                  className={`p-1 ${
                    userVote === 'downvote' 
                      ? 'text-red-400' 
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                  disabled={!user || user.id === question.author_id}
                >
                  <ArrowDown className="h-6 w-6" />
                </Button>
              </div>

              {/* Question content */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-4">
                  {question.title}
                </h1>
                
                <div className="text-gray-300 mb-6 whitespace-pre-wrap">
                  {question.content}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-copper/20 text-copper border-copper/30">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats and author */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{answers.length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{question.views}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>perguntado por</span>
                    <span className="text-copper">{question.author_username}</span>
                    <span>{new Date(question.created_at).toLocaleDateString('pt-BR')}</span>
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
            {answers.map((answer) => (
              <AnswerCard 
                key={answer.id} 
                answer={answer} 
                questionAuthorId={question.author_id}
                onAccepted={handleAnswerAccepted}
                onUserUpdate={updateUser}
              />
            ))}
          </div>
        </div>

        {/* Answer Form */}
        {user && (
          <AnswerForm questionId={question.id} onSuccess={handleAnswerCreated} />
        )}

        {!user && (
          <Card className="bg-gray-900 border-copper/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Quer responder esta pergunta?
              </h3>
              <p className="text-gray-400 mb-4">
                Entre na comunidade e compartilhe seu conhecimento!
              </p>
              <div className="space-x-4">
                <Link to="/login">
                  <Button variant="outline" className="border-copper text-copper hover:bg-copper hover:text-black">
                    Entrar
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button className="bg-copper hover:bg-copper/90 text-black">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
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
    if (!user || user.id === question.author_id) return;

    try {
      await axios.post(`${API}/vote`, {
        target_id: question.id,
        target_type: 'question',
        vote_type: voteType
      });
      
      // Update local state
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

      // Refresh user data to get updated points
      const userResponse = await axios.get(`${API}/auth/me`);
      updateUser(userResponse.data);
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
              className={`p-1 ${
                userVote === 'upvote' 
                  ? 'text-copper' 
                  : 'text-gray-400 hover:text-copper'
              }`}
              disabled={!user || user.id === question.author_id}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-white">
              {votes}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              className={`p-1 ${
                userVote === 'downvote' 
                  ? 'text-red-400' 
                  : 'text-gray-400 hover:text-red-400'
              }`}
              disabled={!user || user.id === question.author_id}
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
                <Badge key={index} variant="secondary" className="bg-copper/20 text-copper border-copper/30">
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
    // Filter questions based on search term
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
            {/* Search Bar */}
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
            
            {/* New Question Button */}
            {user && (
              <Dialog open={showNewQuestion} onOpenChange={setShowNewQuestion}>
                <DialogTrigger asChild>
                  <Button className="bg-copper hover:bg-copper/90 text-black whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Pergunta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-copper/20 text-white max-w-2xl">
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

        {/* Search Results Info */}
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
              {user && !searchTerm && (
                <Button 
                  onClick={() => setShowNewQuestion(true)}
                  className="bg-copper hover:bg-copper/90 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer Primeira Pergunta
                </Button>
              )}
              {searchTerm && (
                <Button 
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                  className="border-copper text-copper hover:bg-copper hover:text-black"
                >
                  Limpar Busca
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

// Home Component
const Home = () => {
  const { user } = useAuth();

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

// Admin Panel Component
const AdminPanel = () => {
  const { user } = useAuth();
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      fetchPendingAnswers();
    }
  }, [user]);

  const fetchPendingAnswers = async () => {
    try {
      const response = await axios.get(`${API}/admin/answers/pending`);
      setPendingAnswers(response.data);
    } catch (error) {
      console.error('Error fetching pending answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAnswer = async (answerId) => {
    try {
      await axios.post(`${API}/admin/answers/${answerId}/validate`);
      setPendingAnswers(pendingAnswers.filter(answer => answer.id !== answerId));
    } catch (error) {
      console.error('Error validating answer:', error);
    }
  };

  const handleRejectAnswer = async (answerId) => {
    try {
      await axios.post(`${API}/admin/answers/${answerId}/reject`);
      setPendingAnswers(pendingAnswers.filter(answer => answer.id !== answerId));
    } catch (error) {
      console.error('Error rejecting answer:', error);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acesso Negado</h2>
          <p className="text-gray-400 mb-4">Apenas administradores podem acessar esta página.</p>
          <Link to="/perguntas">
            <Button className="bg-copper hover:bg-copper/90 text-black">
              Voltar às Perguntas
            </Button>
          </Link>
        </div>
      </div>
    );
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
            Administrador
          </Badge>
        </div>

        <Card className="bg-gray-900 border-copper/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-copper" />
              Respostas Pendentes de Validação ({pendingAnswers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAnswers.length === 0 ? (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Todas as respostas foram validadas!
                </h3>
                <p className="text-gray-400">
                  Não há respostas pendentes de validação no momento.
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
                      
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleValidateAnswer(answer.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Validar (dar pontos)
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

        <Card className="bg-gray-900 border-copper/20">
          <CardHeader>
            <CardTitle className="text-white">Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-copper">{pendingAnswers.length}</h3>
                <p className="text-gray-400">Respostas Pendentes</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-400">Sistema Ativo</h3>
                <p className="text-gray-400">Status do Sistema</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-blue-400">Admin</h3>
                <p className="text-gray-400">Seu Nível de Acesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/perguntas" element={<QuestionsList />} />
            <Route path="/pergunta/:id" element={<QuestionDetail />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;