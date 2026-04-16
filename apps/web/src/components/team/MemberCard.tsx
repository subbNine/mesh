import type { IWorkspaceMember } from '@mesh/shared';
import { Briefcase, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberCardProps {
  member: IWorkspaceMember;
  onClick: (userId: string) => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  const { user, role, activeTaskCount, projects } = member;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onClick(member.userId)}
      className="group relative flex flex-col items-start overflow-hidden rounded-[32px] border border-border/50 bg-card/40 p-5 text-left transition-all hover:border-primary/40 hover:bg-card/70 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]"
    >
      {/* Role Badge */}
      <div className="absolute right-4 top-4">
        <div className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
          role === 'owner' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border/40'
        }`}>
          {role}
        </div>
      </div>

      <div className="flex w-full items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary/20 to-primary/5 text-xl font-black text-primary ring-4 ring-background/50 transition-transform group-hover:scale-110">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.firstName} className="h-full w-full rounded-[24px] object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border/40 shadow-sm">
             <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate font-display text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
            {user.firstName} {user.lastName}
          </h3>
          <p className="truncate text-[11px] font-serif italic text-muted-foreground opacity-70">
            @{user.userName || user.email.split('@')[0]}
          </p>
        </div>
      </div>

      {/* Task Count Activity */}
      <div className="mt-6 flex w-full items-center justify-between rounded-2xl bg-muted/30 p-3 border border-border/40">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1.5">Active Load</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-foreground">{activeTaskCount ?? 0}</span>
            <span className="text-[10px] font-bold text-muted-foreground">tasks queue</span>
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${(activeTaskCount ?? 0) > 5 ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
          <Briefcase size={18} />
        </div>
      </div>

      {/* Project Chips */}
      <div className="mt-5 w-full">
        <div className="flex items-center justify-between mb-2 px-1">
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Contributes to</span>
           <span className="text-[10px] font-black text-primary">{projects?.length ?? 0}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {projects?.slice(0, 3).map((project) => (
            <div
              key={project.id}
              className="rounded-full bg-background/50 border border-border/60 px-2.5 py-1 text-[10px] font-semibold text-foreground whitespace-nowrap"
            >
              {project.name}
            </div>
          ))}
          {projects && projects.length > 3 && (
            <div className="rounded-full bg-muted/50 px-2.5 py-1 text-[10px] font-black text-muted-foreground">
              +{projects.length - 3}
            </div>
          )}
          {(!projects || projects.length === 0) && (
            <div className="text-[10px] italic text-muted-foreground/60 px-1">No active projects</div>
          )}
        </div>
      </div>

      <div className="mt-6 flex w-full items-center justify-between border-t border-border/40 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
          <CheckCircle2 size={12} />
          View Profile
        </div>
        <div className="text-muted-foreground group-hover:text-primary transition-colors">
          <MoreHorizontal size={16} />
        </div>
      </div>
    </motion.button>
  );
}
