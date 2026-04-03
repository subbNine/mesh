import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/workspaces', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 flex-col lg:flex-row">
      
      {/* Brand Side (Visible on lg screens) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 bg-card border-r border-border min-h-screen">
        <h1 className="text-4xl font-bold text-foreground mb-4">Welcome back to Mesh.</h1>
        <p className="text-lg text-muted-foreground">Log in to your account and continue plotting your next big project.</p>
      </div>

      {/* Login Form Side */}
      <div className="flex-1 flex w-full items-center justify-center relative">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Enter your email below to log into your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 mb-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                id="email"
                type="email" 
                label="Email Address"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
              />
              <div className="space-y-1">
                <Input 
                  id="password"
                  type="password" 
                  label="Password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                </div>
              </div>
              <Button type="submit" fullWidth loading={isLoading} className="mt-4">
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border pt-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account? <button type="button" className="text-primary font-medium hover:underline" onClick={() => navigate('/register')}>Sign Up</button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
