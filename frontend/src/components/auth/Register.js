import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { VALIDATION } from '../../utils/constants';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isCompany: false,
    companyName: '',
    companyDescription: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    // Username validation
    if (formData.username.length < VALIDATION.MIN_USERNAME_LENGTH) {
      errors.username = `Nome de usuário deve ter pelo menos ${VALIDATION.MIN_USERNAME_LENGTH} caracteres`;
    } else if (formData.username.length > VALIDATION.MAX_USERNAME_LENGTH) {
      errors.username = `Nome de usuário deve ter no máximo ${VALIDATION.MAX_USERNAME_LENGTH} caracteres`;
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Nome de usuário deve conter apenas letras, números e underscore';
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    // Password validation
    if (formData.password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      errors.password = `Senha deve ter pelo menos ${VALIDATION.MIN_PASSWORD_LENGTH} caracteres`;
    } else if (formData.password.length > VALIDATION.MAX_PASSWORD_LENGTH) {
      errors.password = `Senha deve ter no máximo ${VALIDATION.MAX_PASSWORD_LENGTH} caracteres`;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }

    // Company validation
    if (formData.isCompany) {
      if (!formData.companyName.trim()) {
        errors.companyName = 'Nome da empresa é obrigatório';
      }
      if (!formData.companyDescription.trim()) {
        errors.companyDescription = 'Descrição da empresa é obrigatória';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (error) {
      clearError();
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleCompanyToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      isCompany: checked,
      companyName: checked ? prev.companyName : '',
      companyDescription: checked ? prev.companyDescription : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        is_company: formData.isCompany,
        ...(formData.isCompany && {
          company_name: formData.companyName,
          company_description: formData.companyDescription,
        }),
      };

      const result = await register(userData);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= VALIDATION.MIN_PASSWORD_LENGTH) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;
    
    if (score <= 2) return { level: 'fraca', color: 'text-red-500' };
    if (score <= 3) return { level: 'média', color: 'text-yellow-500' };
    if (score <= 4) return { level: 'forte', color: 'text-blue-500' };
    return { level: 'muito forte', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-copper rounded-lg flex items-center justify-center mb-4">
            <span className="text-black font-bold text-2xl">A</span>
          </div>
          <h2 className="text-3xl font-bold text-white">
            Crie sua conta
          </h2>
          <p className="mt-2 text-gray-400">
            Junte-se à comunidade ACODE LAB
          </p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Registrar</CardTitle>
            <CardDescription className="text-gray-400">
              Preencha os dados para criar sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Nome de usuário
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-copper focus:ring-copper ${
                    validationErrors.username ? 'border-red-500' : ''
                  }`}
                  placeholder="seu_usuario"
                />
                {validationErrors.username && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <X className="h-4 w-4" />
                    {validationErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-copper focus:ring-copper ${
                    validationErrors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="seu@email.com"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <X className="h-4 w-4" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-copper focus:ring-copper pr-10 ${
                      validationErrors.password ? 'border-red-500' : ''
                    }`}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-600"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${passwordStrength.color}`}>
                    Força: {passwordStrength.level}
                  </span>
                  <span className="text-gray-400">
                    {formData.password.length}/{VALIDATION.MAX_PASSWORD_LENGTH}
                  </span>
                </div>
                {validationErrors.password && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <X className="h-4 w-4" />
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-copper focus:ring-copper pr-10 ${
                      validationErrors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-600"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <X className="h-4 w-4" />
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isCompany"
                  name="isCompany"
                  type="checkbox"
                  checked={formData.isCompany}
                  onChange={(e) => handleCompanyToggle(e.target.checked)}
                  className="h-4 w-4 text-copper focus:ring-copper border-gray-600 rounded bg-gray-700"
                />
                <Label htmlFor="isCompany" className="text-sm text-gray-300">
                  Sou uma empresa
                </Label>
              </div>

              {formData.isCompany && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-white">
                      Nome da empresa
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-copper focus:ring-copper ${
                        validationErrors.companyName ? 'border-red-500' : ''
                      }`}
                      placeholder="Nome da sua empresa"
                    />
                    {validationErrors.companyName && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <X className="h-4 w-4" />
                        {validationErrors.companyName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyDescription" className="text-white">
                      Descrição da empresa
                    </Label>
                    <textarea
                      id="companyDescription"
                      name="companyDescription"
                      required
                      value={formData.companyDescription}
                      onChange={handleChange}
                      rows={3}
                      className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-copper focus:ring-copper rounded-md px-3 py-2 resize-none ${
                        validationErrors.companyDescription ? 'border-red-500' : ''
                      }`}
                      placeholder="Descreva brevemente sua empresa"
                    />
                    {validationErrors.companyDescription && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <X className="h-4 w-4" />
                        {validationErrors.companyDescription}
                      </p>
                    )}
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-copper hover:bg-copper/90 text-black font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>

              <div className="text-center">
                <p className="text-gray-400">
                  Já tem uma conta?{' '}
                  <Link
                    to="/login"
                    className="text-copper hover:text-copper/80 font-medium transition-colors"
                  >
                    Entre aqui
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ao continuar, você concorda com nossos{' '}
            <Link to="/terms" className="text-copper hover:text-copper/80">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link to="/privacy" className="text-copper hover:text-copper/80">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
