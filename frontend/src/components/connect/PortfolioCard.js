import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ThumbsUp, ExternalLink, Award, Calendar, Eye, Star } from 'lucide-react';

const PortfolioCard = ({ portfolio, onVote, isAuthenticated }) => {
  const handleVote = () => {
    if (!isAuthenticated) {
      alert('Faça login para votar em portfolios');
      return;
    }
    onVote(portfolio.id || portfolio._id?.$oid);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = dateString.$date ? new Date(dateString.$date) : new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getRankColor = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'bronze':
        return 'border-amber-600 text-amber-400';
      case 'silver':
        return 'border-gray-400 text-gray-300';
      case 'gold':
        return 'border-yellow-500 text-yellow-400';
      case 'platinum':
        return 'border-cyan-400 text-cyan-300';
      case 'diamond':
        return 'border-purple-400 text-purple-300';
      default:
        return 'border-gray-600 text-gray-400';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'bronze':
        return '🥉';
      case 'silver':
        return '🥈';
      case 'gold':
        return '🥇';
      case 'platinum':
        return '💎';
      case 'diamond':
        return '💎';
      default:
        return '⭐';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-copper/10 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={portfolio.author_profile_image} alt={portfolio.author_username} />
              <AvatarFallback className="bg-copper text-black text-lg font-bold">
                {portfolio.author_username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-white text-sm">
                  {portfolio.author_username}
                </h3>
                {portfolio.author_rank && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRankColor(portfolio.author_rank)}`}
                  >
                    <span className="mr-1">{getRankIcon(portfolio.author_rank)}</span>
                    {portfolio.author_rank}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <Calendar className="h-3 w-3" />
                <span>Submetido em {formatDate(portfolio.submitted_at)}</span>
              </div>
            </div>
          </div>

          {/* Badge de Destaque */}
          <div className="flex items-center space-x-1">
            <Award className="h-5 w-5 text-copper" />
            <Badge variant="outline" className="border-copper text-copper text-xs">
              Destaque
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Título e Descrição */}
        <div className="mb-4">
          <h4 className="font-semibold text-white text-base mb-2 group-hover:text-copper transition-colors">
            {portfolio.title || 'Portfolio Sem Título'}
          </h4>
          
          {portfolio.description && (
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
              {portfolio.description}
            </p>
          )}
        </div>

        {/* Tecnologias */}
        {portfolio.technologies && portfolio.technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {portfolio.technologies.slice(0, 5).map((tech, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-gray-700 text-gray-300 border-gray-600"
                >
                  {tech}
                </Badge>
              ))}
              {portfolio.technologies.length > 5 && (
                <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-400 border-gray-600">
                  +{portfolio.technologies.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Imagem do Portfolio */}
        {portfolio.image_url && (
          <div className="mb-4">
            <img 
              src={portfolio.image_url} 
              alt="Portfolio" 
              className="w-full h-32 object-cover rounded-lg border border-gray-600 group-hover:border-copper/50 transition-colors"
            />
          </div>
        )}

        {/* Estatísticas */}
        <div className="flex items-center justify-between text-gray-400 text-sm mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{portfolio.votes || 0} voto{portfolio.votes !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{portfolio.views || 0} visualização{portfolio.views !== 1 ? 'ões' : ''}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-400 font-medium">
              {portfolio.rating ? portfolio.rating.toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Links */}
        {portfolio.links && Object.keys(portfolio.links).length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {portfolio.links.demo && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs border-copper text-copper hover:bg-copper hover:text-black"
                >
                  <a href={portfolio.links.demo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Demo
                  </a>
                </Button>
              )}
              
              {portfolio.links.github && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <a href={portfolio.links.github} target="_blank" rel="noopener noreferrer">
                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                </Button>
              )}
              
              {portfolio.links.website && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                >
                  <a href={portfolio.links.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Botão de Voto */}
        <Button
          onClick={handleVote}
          disabled={portfolio.has_voted}
          className={`w-full ${
            portfolio.has_voted
              ? 'bg-green-600 text-white cursor-not-allowed'
              : 'bg-copper hover:bg-copper/90 text-black'
          } transition-colors`}
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          {portfolio.has_voted ? 'Votado!' : 'Votar'}
        </Button>

        {/* Semana de Submissão */}
        <div className="mt-3 text-center">
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
            Semana {portfolio.week_year || 'N/A'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioCard;
