import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ firstName, lastName, userName, email, password });
      navigate('/workspaces', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 flex-col lg:flex-row">
      
      {/* Brand Side (Visible on lg screens) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 bg-card border-r border-border min-h-screen">
        <h1 className="text-4xl font-bold text-foreground mb-4">Join Mesh today.</h1>
        <p className="text-lg text-muted-foreground">Create workspaces, orchestrate your team, and ship faster together.</p>
      </div>

      {/* Register Form Side */}
      <div className="flex-1 flex w-full items-center justify-center relative">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Enter your details below to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 mb-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  id="firstName"
                  type="text" 
                  label="First Name"
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="Jane" 
                  required 
                />
                <Input 
                  id="lastName"
                  type="text" 
                  label="Last Name"
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="Doe" 
                  required 
                />
              </div>
              
              <Input 
                id="username"
                type="text" 
                label="Username"
                value={userName} 
                onChange={e => setUserName(e.target.value)} 
                placeholder="janedoe" 
                required 
              />
              
              <Input 
                id="email"
                type="email" 
                label="Email Address"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
              />
              
              <Input 
                id="password"
                type="password" 
                label="Password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                minLength={8}
              />
              
              <Button type="submit" fullWidth loading={isLoading} className="mt-6">
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border pt-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account? <button type="button" className="text-primary font-medium hover:underline" onClick={() => navigate('/login')}>Sign in</button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
