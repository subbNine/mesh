import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { 
  BarChart3, 
  Layers, 
  MousePointer2, 
  Sparkles, 
  Zap, 
  Users,
  Layout
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
      
      {/* Background Grids */}
      <div className="fixed inset-0 bg-dot-grid opacity-[0.15] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--primary)_0%,transparent_50%)] opacity-[0.05] pointer-events-none z-0 dark:opacity-[0.1]" />

      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 ring-1 ring-primary/20 group-hover:scale-105 transition-transform duration-300">M</div>
                <span className="font-display font-black text-2xl tracking-tighter">Mesh.</span>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors tracking-tight">Capabilities</a>
              <a href="#vision" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors tracking-tight">Vision</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="tertiary" onClick={() => navigate('/login')} size="sm">Log in</Button>
            <Button onClick={() => navigate('/register')} size="sm" className="px-6">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Hero Text */}
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="flex-1 text-center lg:text-left space-y-8"
            >
              <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                <Sparkles size={12} /> Version 1.0 is Live
              </motion.div>
              
              <motion.h1 variants={item} className="font-display text-5xl sm:text-7xl md:text-8xl font-black tracking-[calc(-0.06em)] leading-[1.0] text-balance">
                Orchestrate work in <span className="text-primary italic">freeform.</span>
              </motion.h1>
              
              <motion.p variants={item} className="max-w-[540px] mx-auto lg:mx-0 text-xl md:text-2xl text-muted-foreground/80 font-serif leading-relaxed italic">
                Mesh is the canvas-first project management engine. Stop filling forms. Start making decisions where the work actually lives.
              </motion.p>
              
              <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Button size="xl" onClick={() => navigate('/register')} className="w-full sm:w-auto shadow-2xl shadow-primary/30">
                  Build your workspace
                </Button>
                <Button size="xl" variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto">
                    View Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Visual: The "Drafting Table" simulation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              className="flex-1 w-full relative"
            >
              <div className="relative aspect-[4/3] w-full max-w-[600px] mx-auto">
                {/* Main "Task" Card */}
                <div className="absolute inset-0 bg-card border-2 border-border/80 rounded-[32px] shadow-2xl overflow-hidden glass p-8 group">
                   <div className="w-full h-full border border-dashed border-border rounded-2xl bg-muted/30 relative overflow-hidden">
                      {/* Floating Canvas Elements */}
                      <motion.div 
                         animate={{ y: [0, -10, 0] }}
                         transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                         className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary rounded-xl shadow-xl flex items-center justify-center text-white"
                      >
                         <Layers size={32} />
                      </motion.div>
                      
                      <motion.div 
                         animate={{ y: [0, 10, 0], x: [0, 5, 0] }}
                         transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                         className="absolute bottom-1/4 right-1/4 w-40 h-24 bg-card border border-border rounded-xl shadow-2xl p-4"
                      >
                        <div className="w-full h-2 bg-muted rounded-full mb-2" />
                        <div className="w-2/3 h-2 bg-muted rounded-full" />
                      </motion.div>

                      {/* Cursor */}
                      <motion.div
                        animate={{ x: [0, 150, 50, 200], y: [0, 100, 200, 50] }}
                        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                        className="absolute text-primary pointer-events-none drop-shadow-xl z-20"
                      >
                        <MousePointer2 size={32} fill="currentColor" />
                        <div className="ml-6 -mt-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Designer</div>
                      </motion.div>
                   </div>
                </div>

                {/* Decorative floating cards */}
                <div className="absolute -top-12 -right-8 w-40 h-40 bg-accent/20 border border-accent/30 rounded-3xl backdrop-blur-md hidden md:block -z-10 rotate-12" />
                <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-primary/10 border border-primary/20 rounded-[40px] backdrop-blur-md hidden md:block -z-10 -rotate-6" />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Feature Grid */}
      <section id="features" className="py-24 md:py-48 bg-card/30 border-y border-border/40 relative">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center mb-24 space-y-6">
            <h2 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-none italic-slnt-0">
               Tools should be <span className="text-primary italic font-serif">invisible.</span>
            </h2>
            <p className="text-xl text-muted-foreground/80 font-serif leading-relaxed italic">
              We built Mesh to vanish. No bloat, no complex hierarchies. Just you, your team, and the canvas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
               icon={<Zap className="text-primary" />}
               title="Multiplayer Sync"
               description="Real-time collaboration faster than you can think. Cursors, presence, and CRDT sync built-in."
            />
            <FeatureCard 
               icon={<Layout className="text-primary" />}
               title="Spatial Layout"
               description="Ditch the grid. Organize tasks spatially. Map out the actual structure of your project."
            />
            <FeatureCard 
               icon={<Users className="text-primary" />}
               title="Human Comments"
               description="Pin discussions exactly where they matter. Figma-style pins, formatted as high-end editorial."
            />
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-24 md:py-48">
        <div className="container mx-auto px-6 md:px-12">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-8">
                 <h3 className="font-display text-5xl font-black leading-[1.1] tracking-tight">
                    Beyond Project Management.
                 </h3>
                 <p className="text-xl text-muted-foreground/80 font-serif leading-relaxed italic">
                    Traditional tools treat tasks as data entries. Mesh treats them as creative spaces. It's the difference between a spreadsheet and a whiteboard.
                 </p>
                 <div className="space-y-4">
                    <div className="flex items-start gap-4">
                       <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1"><BarChart3 size={20} /></div>
                       <div>
                          <h4 className="font-bold text-lg">Visual Progress</h4>
                          <p className="text-muted-foreground text-sm">See the health of your project through the snapshots of your canvas.</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="aspect-video bg-muted/50 rounded-[40px] border border-border/50 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-grid opacity-20 group-hover:opacity-30 transition-opacity" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-12 text-center space-y-4">
                       <div className="font-display font-black text-6xl text-primary/20 group-hover:text-primary/40 transition-all">Spatially Focused</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40">
        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background font-black text-sm">M</div>
                <span className="font-display font-black text-xl tracking-tighter">Mesh.</span>
            </div>
            <p className="text-sm text-muted-foreground font-serif italic">Created with obsession for the craft. &copy; 2026 Mesh Team.</p>
            <div className="flex gap-8">
                <a href="#" className="text-sm font-bold text-muted-foreground hover:text-foreground">GitHub</a>
                <a href="#" className="text-sm font-bold text-muted-foreground hover:text-foreground">Twitter</a>
            </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="p-8 rounded-[32px] bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 group"
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-black mb-3 italic-slnt-0 leading-none">{title}</h3>
      <p className="text-muted-foreground font-serif italic leading-relaxed text-balance">
        {description}
      </p>
    </motion.div>
  );
}
