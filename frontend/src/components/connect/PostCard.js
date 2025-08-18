import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Heart, MessageSquare, Share, MoreHorizontal, User, Calendar, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { POST_TYPES } from '../../utils/constants';

const PostCard = ({ post, onLike, onComment, isAuthenticated }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const handleLike = () => {
    if (!isAuthenticated) {
      alert('Faça login para curtir posts');
      return;
    }

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike(post.id || post._id?.$oid);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.author_username}`,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para navegadores que não suportam Web Share API
      navigator.clipboard.writeText(post.content);
      alert('Conteúdo copiado para a área de transferência!');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = dateString.$date ? new Date(dateString.$date) : new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case POST_TYPES.LINK:
        return <ExternalLink className="h-4 w-4" />;
      case POST_TYPES.IMAGE:
        return <img src={post.image_url} alt="Post" className="h-4 w-4 rounded" />;
      default:
        return null;
    }
  };

  const getPostTypeBadge = (type) => {
    switch (type) {
      case POST_TYPES.LINK:
        return <Badge variant="secondary" className="text-xs">Link</Badge>;
      case POST_TYPES.IMAGE:
        return <Badge variant="secondary" className="text-xs">Imagem</Badge>;
      case POST_TYPES.POLL:
        return <Badge variant="secondary" className="text-xs">Enquete</Badge>;
      default:
        return null;
    }
  };

  const isAuthor = user && (user.id === post.author_id || user._id === post.author_id);

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author_profile_image} alt={post.author_username} />
              <AvatarFallback className="bg-copper text-black">
                {post.author_username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-white text-sm">
                  {post.author_username}
                </h3>
                {post.author_rank && (
                  <Badge variant="outline" className="text-xs border-copper text-copper">
                    {post.author_rank}
                  </Badge>
                )}
                {post.author_is_company && (
                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                    Empresa
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.created_at)}</span>
                {getPostTypeIcon(post.type)}
                {getPostTypeBadge(post.type)}
              </div>
            </div>
          </div>

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-400">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Conteúdo do Post */}
        <div className="mb-4">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
          
          {/* Link Preview */}
          {post.type === POST_TYPES.LINK && post.link_url && (
            <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex items-center space-x-2 text-blue-400 hover:text-blue-300">
                <ExternalLink className="h-4 w-4" />
                <a 
                  href={post.link_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  {post.link_url}
                </a>
              </div>
            </div>
          )}

          {/* Imagem */}
          {post.type === POST_TYPES.IMAGE && post.image_url && (
            <div className="mt-3">
              <img 
                src={post.image_url} 
                alt="Post" 
                className="w-full rounded-lg max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="flex items-center justify-between text-gray-400 text-sm mb-4">
          <div className="flex items-center space-x-4">
            <span>{likesCount} curtida{likesCount !== 1 ? 's' : ''}</span>
            <span>{post.comments_count || 0} comentário{post.comments_count !== 1 ? 's' : ''}</span>
            <span>{post.shares_count || 0} compartilhamento{post.shares_count !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center space-x-1 border-t border-gray-700 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center space-x-2 h-10 ${
              isLiked 
                ? 'text-red-500 hover:text-red-400 hover:bg-red-500/10' 
                : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>Curtir</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            className="flex-1 flex items-center justify-center space-x-2 h-10 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Comentar</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex-1 flex items-center justify-center space-x-2 h-10 text-gray-400 hover:text-green-400 hover:bg-green-500/10"
          >
            <Share className="h-5 w-5" />
            <span>Compartilhar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
