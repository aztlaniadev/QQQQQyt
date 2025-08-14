// Profile Settings Component - FIXED
const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
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
      window.location.reload(); // Reload to update user data
    } catch (error) {
      setMessage('Erro ao atualizar perfil: ' + (error.response?.data?.detail || 'Erro desconhecido'));
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
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
              </div>
              
              <div>
                <Label htmlFor="custom_title" className="text-gray-300">Título Personalizado</Label>
                <Input
                  id="custom_title"
                  name="custom_title"
                  value={formData.custom_title}
                  onChange={handleChange}
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
                    onChange={handleChange}
                    className="w-20 h-10 bg-gray-800 border-gray-700"
                  />
                  <Input
                    name="theme_color"
                    value={formData.theme_color}
                    onChange={handleChange}
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
                  onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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