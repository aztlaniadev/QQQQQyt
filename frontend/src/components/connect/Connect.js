import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { connectService } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Heart, MessageSquare, Share, MoreHorizontal, User, Calendar, ThumbsUp, Award } from 'lucide-react';
import PostCard from './PostCard';
import PortfolioCard from './PortfolioCard';

const Connect = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('text');
  const [selectedPostForComment, setSelectedPostForComment] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showCommentModal && selectedPostForComment) {
      fetchComments(selectedPostForComment);
    }
  }, [showCommentModal, selectedPostForComment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsData, portfoliosData] = await Promise.all([
        connectService.getPosts(),
        connectService.getFeaturedPortfolios()
      ]);
      
      setPosts(postsData || []);
      setPortfolios(portfoliosData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    setLoadingComments(true);
    try {
      const response = await connectService.getComments(postId);
      setComments(response || []);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const postData = {
        content: newPost,
        type: postType,
      };

      await connectService.createPost(postData);
      setNewPost('');
      setShowCreatePost(false);
      fetchData(); // Recarregar posts
    } catch (error) {
      alert('Erro ao criar post: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleLikePost = async (postId) => {
    if (!isAuthenticated) {
      alert('Faça login para curtir posts');
      return;
    }

    try {
      await connectService.likePost(postId);
      // Atualizar o post localmente
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId || post._id?.$oid === postId
            ? { ...post, likes_count: (post.likes_count || 0) + 1, is_liked: true }
            : post
        )
      );
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await connectService.createComment(selectedPostForComment, { content: newComment });
      
      setNewComment('');
      fetchComments(selectedPostForComment);
      
      // Atualizar contador de comentários
      setPosts(prevPosts => 
        prevPosts.map(post => {
          const postId = post.id || post._id?.$oid;
          return postId === selectedPostForComment 
            ? { ...post, comments_count: (post.comments_count || 0) + 1 }
            : post;
        })
      );
    } catch (error) {
      alert('Erro ao criar comentário: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      alert('Faça login para curtir comentários');
      return;
    }

    try {
      await connectService.likeComment(commentId);
      fetchComments(selectedPostForComment);
    } catch (error) {
      console.error('Erro ao curtir comentário:', error);
    }
  };

  const handleVotePortfolio = async (portfolioId) => {
    if (!isAuthenticated) {
      alert('Faça login para votar em portfolios');
      return;
    }

    try {
      await connectService.votePortfolio(portfolioId);
      // Atualizar o portfolio localmente
      setPortfolios(prevPortfolios =>
        prevPortfolios.map(portfolio =>
          portfolio.id === portfolioId || portfolio._id?.$oid === portfolioId
            ? { ...portfolio, votes: (portfolio.votes || 0) + 1, has_voted: true }
            : portfolio
        )
      );
    } catch (error) {
      console.error('Erro ao votar no portfolio:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper mx-auto"></div>
          <p className="text-white mt-4">Carregando Connect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Connect</h1>
          <p className="text-gray-400 text-lg">
            Conecte-se com outros desenvolvedores, compartilhe suas experiências e descubra novos talentos
          </p>
        </div>

        {/* Create Post Section */}
        {isAuthenticated && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Criar Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={postType === 'text' ? 'default' : 'outline'}
                    onClick={() => setPostType('text')}
                    className={postType === 'text' ? 'bg-copper text-black' : ''}
                  >
                    Texto
                  </Button>
                  <Button
                    type="button"
                    variant={postType === 'link' ? 'default' : 'outline'}
                    onClick={() => setPostType('link')}
                    className={postType === 'link' ? 'bg-copper text-black' : ''}
                  >
                    Link
                  </Button>
                </div>
                
                <Textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder={`O que você quer compartilhar? ${postType === 'link' ? '(inclua o link)' : ''}`}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-copper focus:ring-copper"
                  rows={3}
                  required
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!newPost.trim()}
                    className="bg-copper hover:bg-copper/90 text-black"
                  >
                    Publicar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Featured Portfolios Section */}
        {portfolios.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="h-6 w-6 text-copper" />
              Portfolios em Destaque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolios.map((portfolio) => (
                <PortfolioCard
                  key={portfolio.id || portfolio._id?.$oid}
                  portfolio={portfolio}
                  onVote={handleVotePortfolio}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </div>
        )}

        {/* Posts Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-copper" />
            Posts Recentes
          </h2>
          
          {posts.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Nenhum post ainda</p>
                <p className="text-gray-500">Seja o primeiro a compartilhar algo!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id || post._id?.$oid}
                  post={post}
                  onLike={handleLikePost}
                  onComment={() => {
                    setSelectedPostForComment(post.id || post._id?.$oid);
                    setShowCommentModal(true);
                  }}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>

        {/* Comments Modal */}
        <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comentários</DialogTitle>
            </DialogHeader>
            
            {/* Lista de Comentários */}
            <div className="space-y-4 mb-6">
              {loadingComments ? (
                <div className="text-center text-gray-400 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-copper mx-auto"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-gray-400 py-4">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id || comment._id?.$oid} className="flex gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className="h-8 w-8 bg-copper rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-black" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">
                          {comment.author_username}
                        </span>
                        <span className="text-xs text-gray-400">
                          {comment.created_at?.$date 
                            ? new Date(comment.created_at.$date).toLocaleDateString('pt-BR')
                            : new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{comment.content}</p>
                      <button 
                        onClick={() => handleLikeComment(comment.id || comment._id?.$oid)}
                        className="flex items-center gap-1 mt-2 text-gray-400 hover:text-red-400 transition-colors text-sm"
                      >
                        <Heart className="h-4 w-4" />
                        <span>{comment.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Formulário de Novo Comentário */}
            {isAuthenticated && !user?.is_company ? (
              <form onSubmit={handleCreateComment} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                  required
                />
                <Button 
                  type="submit"
                  className="bg-copper hover:bg-copper/90 text-black"
                >
                  Comentar
                </Button>
              </form>
            ) : (
              <p className="text-center text-gray-400 py-2">
                {!isAuthenticated ? 'Faça login para comentar' : 'Empresas não podem comentar'}
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Connect;
