import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 px-4 md:px-8">
          <div className="flex gap-6 md:gap-10">
            <a href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold text-2xl tracking-tighter text-foreground">Mesh.</span>
            </a>
            <nav className="flex gap-6 hidden md:flex">
              <a href="#features" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#testimonials" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="tertiary" onClick={() => navigate('/login')}>Log in</Button>
              <Button onClick={() => navigate('/register')}>Get Started</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-16 md:pb-12 md:pt-24 lg:pb-32 lg:pt-32 px-4">
        <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary shadow-sm ring-1 ring-inset ring-primary/20">
            Introducing Mesh 1.0 ✨
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
            Orchestrate your workflow with <span className="text-primary relative inline-block">
              precision
              <svg className="absolute -bottom-2 w-full h-3 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" /></svg>
            </span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-lg sm:leading-8">
            The all-in-one workspace solution. Seamlessly manage projects, tasks, and team collaboration in an interface designed to vanish when you're working.
          </p>
          <div className="space-x-4 mt-6">
            <Button size="lg" onClick={() => navigate('/register')} className="h-12 px-8 text-lg rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform duration-200">
              Start Building Free
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/login')} className="h-12 px-8 text-lg rounded-xl">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Section Placeholder */}
      <section id="features" className="container mx-auto space-y-6 bg-slate-50 py-16 md:py-24 rounded-3xl mb-16 px-4 md:px-8 border border-border/50">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Speed meets aesthetics</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            A beautiful design system backed by real-time sync. Unblock your team today.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 pt-12">
            
            <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-2 transition-transform hover:-translate-y-1">
              <div className="flex h-[180px] flex-col justify-between rounded-xl bg-muted/50 p-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <div className="space-y-2">
                  <h3 className="font-bold">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">Every interaction is built to be blazing fast and accessible.</p>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-2 transition-transform hover:-translate-y-1">
              <div className="flex h-[180px] flex-col justify-between rounded-xl bg-muted/50 p-6">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <div className="space-y-2">
                  <h3 className="font-bold">Collaboration First</h3>
                  <p className="text-sm text-muted-foreground">Real-time sync, cursors, presence—everything built-in.</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-2 transition-transform hover:-translate-y-1">
              <div className="flex h-[180px] flex-col justify-between rounded-xl bg-muted/50 p-6">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                <div className="space-y-2">
                  <h3 className="font-bold">Beautiful System</h3>
                  <p className="text-sm text-muted-foreground">Modern tokens and variables giving it a refined aesthetic.</p>
                </div>
              </div>
            </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by the Mesh Team. The source code is available on GitHub.
          </p>
        </div>
      </footer>
    </div>
  );
}
