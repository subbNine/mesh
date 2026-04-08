import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers,
  LayoutGrid,
  MessageSquare,
  MousePointer2,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-[0.08]" />

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Layers size={20} />
            </div>
            <div>
              <p className="font-display text-lg font-black tracking-tight">Mesh</p>
              <p className="text-xs text-muted-foreground">Canvas-first project management</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition hover:text-foreground">How it works</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Get started</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                Built for small product, design, and engineering teams
              </motion.div>

              <motion.h1 variants={fadeUp} className="max-w-3xl text-balance font-display text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Plan, discuss, and ship from the <span className="text-primary">canvas</span>.
              </motion.h1>

              <motion.p variants={fadeUp} className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Mesh keeps tasks, comments, files, and decisions in one canvas-first workspace, so your team can work where the context already lives.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
                <Button size="xl" onClick={() => navigate('/register')} icon={<ArrowRight size={18} />}>
                  Create your workspace
                </Button>
                <Button size="xl" variant="outline" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="grid gap-3 pt-2 sm:grid-cols-3">
                <PreviewStat label="Canvas tasks" value="Core workflow" />
                <PreviewStat label="Comments in context" value="Figma-style pins" />
                <PreviewStat label="Realtime presence" value="Multi-user sync" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-6 rounded-[32px] bg-primary/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card/90 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]">
                <div className="border-b border-border/70 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Launch Week</p>
                      <p className="text-xs text-muted-foreground">Project overview</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      <Users size={12} />
                      6 active now
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {['All tasks', 'Docs & files', 'Activity'].map((tab, index) => (
                      <span
                        key={tab}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/55 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">My work</p>
                        <h2 className="text-base font-semibold text-foreground">This week</h2>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">2 due soon</span>
                    </div>

                    {[
                      { title: 'Finalize homepage messaging', meta: 'Due today', tone: 'text-amber-700 bg-amber-100' },
                      { title: 'Review onboarding canvas', meta: 'In progress', tone: 'text-sky-700 bg-sky-100' },
                      { title: 'Upload launch assets', meta: 'Docs & files', tone: 'text-emerald-700 bg-emerald-100' },
                    ].map((item) => (
                      <div key={item.title} className="rounded-xl border border-border/70 bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Canvas task · Product team</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.tone}`}>
                            {item.meta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border/70 bg-secondary/55 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <MousePointer2 size={15} className="text-primary" />
                        <p className="text-sm font-semibold">Live canvas activity</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm">
                          <MessageSquare size={14} className="text-accent" />
                          New comment pinned to onboarding flow
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm">
                          <FileText size={14} className="text-primary" />
                          Brand brief updated in Docs & files
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm">
                          <Activity size={14} className="text-emerald-600" />
                          Status changed to Review
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-slate-950 p-4 text-white shadow-inner dark:bg-slate-900">
                      <div className="mb-3 flex items-center gap-2 text-slate-300">
                        <LayoutGrid size={15} />
                        Canvas snapshot
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="h-16 rounded-lg bg-teal-400/80" />
                          <div className="rounded-lg border border-dashed border-white/15 p-3 text-xs text-slate-300">
                            Launch checklist, notes, and comments stay together here.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="border-y border-border/70 bg-card/35 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold text-primary">Why Mesh feels different</p>
              <h2 className="mt-2 text-balance font-display text-3xl font-black tracking-tight sm:text-4xl">
                A calmer workflow for teams that think visually.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FeatureCard
                icon={<Layers size={18} />}
                title="Every task is a canvas"
                description="Sketch, annotate, upload images, and keep the working context attached to the task itself."
              />
              <FeatureCard
                icon={<MessageSquare size={18} />}
                title="Comments where they matter"
                description="Drop pins directly on the canvas so feedback stays anchored to the exact spot under discussion."
              />
              <FeatureCard
                icon={<FileText size={18} />}
                title="Docs and files nearby"
                description="Store briefs, PDFs, assets, and rich-text notes inside each project instead of scattering them elsewhere."
              />
              <FeatureCard
                icon={<CheckCircle2 size={18} />}
                title="Personal focus view"
                description="My work and workspace activity help everyone stay aligned without heavy process overhead."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                title: 'Start from the project view',
                description: 'Projects stay lightweight: a clean overview of tasks, assignees, due dates, docs, and activity.',
              },
              {
                title: 'Open a task canvas',
                description: 'The canvas becomes the place to think, map, review, and decide with your team in real time.',
              },
              {
                title: 'Keep momentum across the workspace',
                description: 'Use My work, notifications, and activity to stay on top of what needs attention next.',
              },
            ].map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="overflow-hidden rounded-[28px] border border-border/80 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_-40px_rgba(8,17,31,0.9)] sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-teal-300">Ready to try Mesh?</p>
                <h2 className="mt-2 text-balance font-display text-3xl font-black tracking-tight">
                  Bring the work, the conversation, and the context into one place.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate('/register')} className="bg-white text-slate-950 hover:bg-slate-100">
                  Create account
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function PreviewStat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/75 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: Readonly<{ icon: ReactNode; title: string; description: string }>) {
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </motion.div>
  );
}
