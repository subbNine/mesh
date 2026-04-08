import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers,
  Lock,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      await login(email, password);
      navigate('/workspaces', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign in');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers size={16} />
          </div>
          Mesh
        </button>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden bg-slate-950 text-white">
            <div className="h-full bg-[radial-gradient(circle_at_top_left,rgba(57,175,203,0.28),transparent_35%)] p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-teal-200">
                Canvas-first collaboration
              </div>

              <h1 className="mt-5 text-balance font-display text-4xl font-black tracking-tight sm:text-5xl">
                Welcome back.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Sign in to jump back into your projects, comments, docs, files, and the work happening on the canvas.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { icon: <MessageSquare size={16} />, text: 'Comments stay pinned to the exact spot on the canvas' },
                  { icon: <FileText size={16} />, text: 'Project docs and files stay close to the work' },
                  { icon: <CheckCircle2 size={16} />, text: 'My work and activity keep the team aligned' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-slate-200">
                    <span className="mt-0.5 text-teal-300">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <p className="text-sm font-semibold text-primary">Sign in</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">Access your workspace</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use the email and password you registered with.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  icon={<Mail size={16} />}
                  required
                />

                <Input
                  id="password"
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  required
                />

                <Button type="submit" fullWidth size="xl" loading={isLoggingIn} icon={<ArrowRight size={18} />}>
                  Sign in
                </Button>
              </form>

              <div className="mt-6 border-t border-border/70 pt-5 text-sm text-muted-foreground">
                New to Mesh?{' '}
                <button type="button" className="font-semibold text-primary hover:underline" onClick={() => navigate('/register')}>
                  Create an account
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
