import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, KeyRound, Layers, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendEmailVerification = useAuthStore((state) => state.resendEmailVerification);

  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const inviteId = searchParams.get('invite') ?? '';
  const from = searchParams.get('from') ?? 'register';
  const wasCodeSent = searchParams.get('sent') === '1';

  const [code, setCode] = useState('');
  const [hasSentCode, setHasSentCode] = useState(wasCodeSent);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(
    wasCodeSent
      ? 'A verification code has already been sent to your inbox.'
      : from === 'login'
        ? 'Your account is waiting on email verification before it can be activated.'
        : '',
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const ctaLabel = useMemo(() => {
    if (hasSentCode) return 'Resend code';
    return from === 'login' ? 'Send verification code' : 'Send code again';
  }, [from, hasSentCode]);

  const handleVerify = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!email) {
      setError('We need an email address to verify this account.');
      return;
    }

    setError('');
    setIsVerifying(true);
    try {
      const result = await verifyEmail(email, code);

      if (inviteId) {
        navigate(`/invite/${encodeURIComponent(inviteId)}`, { replace: true });
        return;
      }

      navigate(result?.redirectTo || '/workspaces', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to verify your email');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      setError('We need an email address to send a verification code.');
      return;
    }

    setError('');
    setIsSendingCode(true);
    try {
      const result = await resendEmailVerification(email);
      setInfo(result.message);
      setHasSentCode(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsSendingCode(false);
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
                Activate your account
              </div>

              <h1 className="mt-5 text-balance font-display text-4xl font-black tracking-tight sm:text-5xl">
                Verify your email.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Enter the one-time code from your inbox to activate your Mesh account and continue into your workspace.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { icon: <Mail size={16} />, text: 'New accounts stay inactive until email ownership is confirmed' },
                  { icon: <KeyRound size={16} />, text: 'Each code is one-time use and expires quickly for safety' },
                  { icon: <CheckCircle2 size={16} />, text: 'Once verified, you can sign in normally from then on' },
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
                <p className="text-sm font-semibold text-primary">Email verification</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">Activate your account</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {email
                    ? `We’ll verify ${email} before letting this account sign in.`
                    : 'Open this page with the email address that needs verification.'}
                </p>
              </div>

              {info && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
                >
                  {info}
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleVerify} className="space-y-5">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  value={email}
                  icon={<Mail size={16} />}
                  disabled
                />

                <Input
                  id="code"
                  label="One-time code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  icon={<KeyRound size={16} />}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />

                <Button type="submit" fullWidth size="xl" loading={isVerifying} icon={<ArrowRight size={18} />}>
                  Verify and continue
                </Button>
              </form>

              <div className="mt-4">
                <Button type="button" variant="outline" fullWidth loading={isSendingCode} onClick={handleSendCode}>
                  {ctaLabel}
                </Button>
              </div>

              <div className="mt-6 border-t border-border/70 pt-5 text-sm text-muted-foreground">
                Need to use a different account?{' '}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => navigate(inviteId ? `/login?invite=${encodeURIComponent(inviteId)}` : '/login')}
                >
                  Back to sign in
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
