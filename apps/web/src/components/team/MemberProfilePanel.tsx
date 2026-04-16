import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { IWorkspaceMemberProfile, IActivityEvent } from '@mesh/shared';
import { X, Mail, Calendar, Briefcase, Activity, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';

interface MemberProfilePanelProps {
  workspaceId: string;
  userId: string | null;
  onClose: () => void;
}

export function MemberProfilePanel({ workspaceId, userId, onClose }: MemberProfilePanelProps) {
  const [profile, setProfile] = useState<IWorkspaceMemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId && workspaceId) {
      setIsLoading(true);
      api.get(`/workspaces/${workspaceId}/members/${userId}`)
        .then(res => setProfile(res.data))
        .catch(err => console.error('Failed to fetch member profile', err))
        .finally(() => setIsLoading(false));
    } else {
      setProfile(null);
    }
  }, [userId, workspaceId]);

  if (!userId) return null;

  const getEventDescription = (event: IActivityEvent) => {
     const payload = event.payload as any;
     switch (event.eventType) {
       case 'comment.created': return <span>Commented on <span className="text-foreground font-bold">{payload.taskTitle || 'a task'}</span></span>;
       case 'task.created': return <span>Created task <span className="text-foreground font-bold">{payload.taskTitle || 'a task'}</span></span>;
       case 'task.status_changed': return <span>Moved <span className="text-foreground font-bold">{payload.taskTitle}</span> to <span className="text-primary font-bold uppercase text-[10px]">{payload.newStatus}</span></span>;
       default: return <span>Activity in {payload.projectName || 'workspace'}</span>;
     }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-background/40 backdrop-blur-sm pointer-events-auto"
        />
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-full bg-card border-l border-border/50 shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
        >
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* Header */}
              <div className="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>

                <div className="mt-8 flex items-end gap-6">
                   <div className="h-24 w-24 rounded-[32px] bg-card border-4 border-background shadow-xl flex items-center justify-center text-3xl font-black text-primary overflow-hidden">
                     {profile.user.avatarUrl ? (
                        <img src={profile.user.avatarUrl} alt={profile.user.firstName} className="h-full w-full object-cover" />
                     ) : (
                        `${profile.user.firstName[0]}${profile.user.lastName[0]}`.toUpperCase()
                     )}
                   </div>
                   <div className="mb-2">
                     <h2 className="text-3xl font-black tracking-tighter text-foreground line-clamp-1">{profile.user.firstName} {profile.user.lastName}</h2>
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary mt-1 border border-primary/20">
                       {profile.role}
                     </span>
                   </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-2xl p-4 border border-border/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-1">Active Tasks</span>
                    <span className="text-2xl font-black text-foreground">{profile.activeTaskCount}</span>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-4 border border-border/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-1">Involvement</span>
                    <span className="text-2xl font-black text-foreground">{profile.projects?.length || 0}</span>
                  </div>
                </div>

                {/* Info List */}
                <div className="space-y-4">
                   <div className="flex items-center gap-4 text-sm">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <Mail size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Email Address</span>
                        <span className="font-bold text-foreground">{profile.user.email}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-sm">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <Calendar size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Joined Team</span>
                        <span className="font-bold text-foreground">{profile.joinedAt ? format(new Date(profile.joinedAt), 'MMMM yyyy') : 'Recently'}</span>
                      </div>
                   </div>
                </div>

                {/* Projects Section */}
                <div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 flex items-center gap-2">
                     <Briefcase size={12} />
                     Active Projects
                   </h3>
                   <div className="space-y-2">
                      {profile.projects?.map(project => (
                        <a 
                          key={project.id}
                          href={`/w/${workspaceId}/p/${project.id}`}
                          className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                        >
                          <span className="font-bold text-sm text-foreground">{project.name}</span>
                          <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                      {(!profile.projects || profile.projects.length === 0) && (
                        <p className="text-sm text-muted-foreground italic px-2">No projects assigned yet.</p>
                      )}
                   </div>
                </div>

                {/* Activity Feed */}
                <div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 flex items-center gap-2">
                     <Activity size={12} />
                     Recent Activity
                   </h3>
                   <div className="space-y-6 pl-2 relative">
                      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border/40" />
                      {profile.recentActivity.map((event) => (
                        <div key={event.id} className="relative flex gap-4 pr-2">
                           <div className="absolute left-[3px] top-1 z-10 w-2 h-2 rounded-full bg-primary ring-4 ring-card" />
                           <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {getEventDescription(event)}
                              </p>
                              <span className="text-[10px] text-muted-foreground/50 font-bold mt-1 block">
                                {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                              </span>
                           </div>
                        </div>
                      ))}
                      {profile.recentActivity.length === 0 && (
                        <p className="text-sm text-muted-foreground italic px-2">No recent activity recorded.</p>
                      )}
                   </div>
                </div>
              </div>
            </>
          ) : null}
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
