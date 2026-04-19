import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { IWorkspaceMember } from '@mesh/shared';
import { api } from '../../lib/api';
import { MemberCard } from '../../components/team/MemberCard';
import { MemberProfilePanel } from '../../components/team/MemberProfilePanel';
import { Search, Users, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeamPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [members, setMembers] = useState<IWorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      setIsLoading(true);
      api.get(`/workspaces/${workspaceId}/members`)
        .then(res => setMembers(res.data))
        .catch(err => console.error('Failed to fetch workspace members', err))
        .finally(() => setIsLoading(false));
    }
  }, [workspaceId]);

  const filteredMembers = useMemo(() => {
    let result = members.filter(m => {
      const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || m.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Sort: Owners first, then alphabetical
    return result.sort((a, b) => {
      if (a.role === 'owner' && b.role !== 'owner') return -1;
      if (a.role !== 'owner' && b.role === 'owner') return 1;
      return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
    });
  }, [members, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-background/30 backdrop-blur-md relative overflow-hidden">
      {/* Search & Header Section */}
      <div className="p-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
             <h1 className="text-4xl font-black tracking-tighter text-foreground mb-1">Workspace Team</h1>
             <p className="text-muted-foreground font-serif italic text-sm opacity-70">
               Browsing members of your creative workspace
             </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-10 px-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-primary">
                <Users size={16} />
                <span className="text-sm font-black">{members.length} Members</span>
             </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-[24px] bg-card/50 border border-border/50 focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium placeholder:text-muted-foreground/50"
          />
          <div className="absolute right-4 inset-y-0 flex items-center gap-2">
             <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all" title="Filter options">
               <Filter size={18} />
             </button>
             <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all" title="Sort options">
               <ArrowUpDown size={18} />
             </button>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-none pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-[32px] bg-muted/30 animate-pulse border border-border/20" />
            ))}
          </div>
        ) : filteredMembers.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredMembers.map(member => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  onClick={() => setSelectedUserId(member.userId)} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground mb-4">
               <Search size={32} />
             </div>
             <h3 className="text-xl font-black text-foreground mb-1">No results found</h3>
             <p className="text-muted-foreground text-sm max-w-xs">We couldn't find any team members matching "{searchQuery}"</p>
             <button 
               onClick={() => setSearchQuery('')}
               className="mt-6 px-6 py-2 rounded-full border border-primary/20 text-primary font-bold text-sm hover:bg-primary/10 transition-all"
             >
               Clear search
             </button>
          </div>
        )}
      </div>

      {/* Side Profile Panel */}
      <MemberProfilePanel 
        workspaceId={workspaceId!}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
