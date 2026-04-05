import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Layers, Mail, Lock, User, ShieldCheck, CheckSquare } from 'lucide-react';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsRegistering(true);
    try {
      await register({ firstName, lastName, email, password });
      navigate('/workspaces', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center pt-32 pb-24 p-6 relative overflow-y-auto transition-colors duration-500">
      {/* Architectural Underlay */}
      <div className="fixed inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Global Brand Mark */}
      <div className="flex items-center gap-3 mb-16 relative z-20">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20">
          <Layers size={22} />
        </div>
        <span className="font-display font-black text-2xl tracking-tighter uppercase text-foreground">Mesh</span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <Card className="glass rounded-[48px] border-border/40 shadow-2xl overflow-hidden">
          {/* Technical Section Header */}
          <div className="p-10 border-b border-border/40 bg-muted/20 relative">
             <div className="absolute inset-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
                System Onboarding
             </div>
             <h1 className="font-display text-4xl font-black tracking-tight text-foreground mb-4">
                Initialize <span className="text-primary italic">Identity</span>.
             </h1>
             <p className="text-muted-foreground text-base max-w-sm font-serif italic leading-relaxed opacity-60">
                Establish a new neural connection to start mapping your architectural initiatives.
             </p>
          </div>

          <CardContent className="p-10 space-y-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                {error}
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Input 
                  id="firstName"
                  label="Forename"
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="e.g. John" 
                  icon={<User size={18} className="text-primary/40" />}
                  required 
                  className="rounded-2xl"
                />
                <Input 
                  id="lastName"
                  label="Surname"
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="e.g. Doe" 
                  icon={<User size={18} className="text-primary/40" />}
                  required 
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-6">
                <Input 
                  id="email"
                  type="email" 
                  label="Registry Key (Email)"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="you@mesh.studio" 
                  icon={<Mail size={18} className="text-primary/40" />}
                  required 
                  className="rounded-2xl"
                />
                
                <Input 
                  id="password"
                  type="password" 
                  label="Access Cipher"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  icon={<Lock size={18} className="text-primary/40" />}
                  required 
                  className="rounded-2xl"
                />
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                size="xl" 
                fullWidth 
                loading={isRegistering} 
                className="h-16 rounded-[22px] shadow-2xl shadow-primary/20"
                icon={<CheckSquare size={20} />}
              >
                Sign Up
              </Button>
            </form>
          </CardContent>

          <CardFooter className="p-10 border-t border-border/40 bg-muted/10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest mb-2">
               <ShieldCheck size={14} className="text-primary/30" />
               SECURE CONNECTION ESTABLISHED
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-serif italic">
              Already registered? 
              <button 
                type="button" 
                className="font-sans font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 decoration-2" 
                onClick={() => navigate('/login')}
              >
                Recall Identity
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* Support Link */}
        <div className="mt-12 text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
              Assistance required? Contact System Admin.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
