import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers,
  LogOut,
  Mail,
  UserPlus,
  Users,
} from 'lucide-react';

import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

type InvitePreview = {
  inviteId: string | null;
  email: string;
  scope: 'workspace' | 'project';
  role: string;
  workspaceId: string;
  workspaceName: string;
  projectId?: string | null;
  projectName?: string | null;
  hasExistingAccount: boolean;
  expiresAt?: string | null;
  status?: 'pending' | 'accepted';
};

export default function InvitePage() {
  const { inviteId = '' } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!inviteId) {
      setError('This invite link is invalid.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    api
      .get('/auth/invitations/preview', { params: { inviteId } })
      .then(({ data }) => setInvitePreview(data))
      .catch((err) => {
        setInvitePreview(null);
        setError(err?.response?.data?.message || 'This invite link is invalid or has expired.');
      })
      .finally(() => setIsLoading(false));
  }, [inviteId]);

  const inviteTargetName = invitePreview?.projectName || invitePreview?.workspaceName || 'Mesh';
  const inviteExpiresLabel = useMemo(() => {
    if (!invitePreview?.expiresAt) {
      return 'Expires soon';
    }

    return new Date(invitePreview.expiresAt).toLocaleString();
  }, [invitePreview?.expiresAt]);

  const currentEmail = currentUser?.email?.trim().toLowerCase() ?? '';
  const invitedEmail = invitePreview?.email?.trim().toLowerCase() ?? '';
  const signedInWithInvitedEmail = Boolean(currentUser && invitedEmail && currentEmail === invitedEmail);
  const isExpiredInvite = /expired/i.test(error);

  const handleAcceptInvite = async () => {
    if (!inviteId) {
      return;
    }

    setIsAccepting(true);
    setError('');

    try {
      const { data } = await api.post('/auth/invitations/accept', { token: inviteId });
      navigate(data.redirectTo || '/workspaces', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to accept this invite.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSwitchAccount = () => {
    logout();
    navigate(`/login?invite=${encodeURIComponent(inviteId)}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
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
                Invitation flow
              </div>

              <h1 className="mt-5 text-balance font-display text-4xl font-black tracking-tight sm:text-5xl">
                Review your invite.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Open the invite, confirm the account email, and choose when to join the workspace or project.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { icon: <Mail size={16} />, text: 'Invite emails work even before the recipient has an account' },
                  { icon: <UserPlus size={16} />, text: 'New users can sign up with the invited email prefilled' },
                  { icon: <Clock3 size={16} />, text: 'Each invite expires automatically after 24 hours' },
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
              {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                    Checking invite…
                  </div>
                </div>
              ) : !invitePreview ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-primary">Invite unavailable</p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">
                      {isExpiredInvite ? 'This invite has expired' : 'This invite cannot be opened'}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {error || 'Ask the sender to create a fresh invite and try again.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                    {isExpiredInvite
                      ? 'For security, invite links only stay active for 24 hours.'
                      : 'The link may be invalid, already used, or no longer available.'}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => navigate('/')} icon={<ArrowRight size={16} />}>
                      Back to home
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/login')}>
                      Sign in instead
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-primary">Invitation ready</p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">
                      Join {inviteTargetName}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Review the invite details below, then continue with the invited email address.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-card/70 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                      <span className="rounded-full bg-primary/10 px-3 py-1">{invitePreview.scope}</span>
                      <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">Role: {invitePreview.role}</span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start gap-3 rounded-2xl bg-muted/50 px-3.5 py-3">
                        <Users size={16} className="mt-0.5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Destination</p>
                          <p className="text-muted-foreground">
                            {invitePreview.projectName
                              ? `${invitePreview.workspaceName} → ${invitePreview.projectName}`
                              : invitePreview.workspaceName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-muted/50 px-3.5 py-3">
                        <Mail size={16} className="mt-0.5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Invited email</p>
                          <p className="text-muted-foreground">{invitePreview.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-muted/50 px-3.5 py-3">
                        <Clock3 size={16} className="mt-0.5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Expiry</p>
                          <p className="text-muted-foreground">{inviteExpiresLabel}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}

                  {!currentUser ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {invitePreview.hasExistingAccount
                          ? 'This email already has a Mesh account. Sign in first, then confirm the invite.'
                          : 'No Mesh account exists for this email yet. Create one first, then confirm the invite.'}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => navigate(`/login?invite=${encodeURIComponent(inviteId)}`)}
                          icon={<ArrowRight size={16} />}
                        >
                          Sign in to continue
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/register?invite=${encodeURIComponent(inviteId)}`)}
                          icon={<UserPlus size={16} />}
                        >
                          Create account
                        </Button>
                      </div>
                    </div>
                  ) : !signedInWithInvitedEmail ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        You are signed in as <strong>{currentUser.email}</strong>, but this invite is for <strong>{invitePreview.email}</strong>.
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={handleSwitchAccount} icon={<LogOut size={16} />}>
                          Switch account
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                          {invitePreview.status === 'accepted' ? 'Already accepted' : 'Ready to join'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {invitePreview.status === 'accepted'
                            ? 'This invite has already been applied to your account. Continue into the app.'
                            : `You are signed in with ${invitePreview.email}. Click below to join ${inviteTargetName}.`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={handleAcceptInvite}
                          loading={isAccepting}
                          icon={<CheckCircle2 size={16} />}
                        >
                          {invitePreview.status === 'accepted' ? 'Open workspace' : 'Accept invite'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
