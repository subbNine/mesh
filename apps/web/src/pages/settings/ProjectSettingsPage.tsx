import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../store/project.store';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Settings, 
  Users, 
  UserX, 
  Trash2, 
  ChevronRight, 
  ArrowLeft,
  Layout,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  History,
  Fingerprint
} from 'lucide-react';

type SettingsTab = 'general' | 'members' | 'exclusions' | 'danger';

export default function ProjectSettingsPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  
  const user = useAuthStore(state => state.user);
  
  // Project properties
  const currentProject = useProjectStore(state => state.currentProject);
  const updateProject = useProjectStore(state => state.updateProject);
  const deleteProject = useProjectStore(state => state.deleteProject);
  
  const members = useProjectStore(state => state.members);
  const exclusions = useProjectStore(state => state.exclusions);
  const fetchMembers = useProjectStore(state => state.fetchMembers);
  const addMember = useProjectStore(state => state.addMember);
  const removeMember = useProjectStore(state => state.removeMember);
  const excludeWorkspaceMember = useProjectStore(state => state.excludeWorkspaceMember);
  const removeExclusion = useProjectStore(state => state.removeExclusion);

  // Workspace properties
  const wpMembers = useWorkspaceStore(state => state.members);
  const fetchWpMembers = useWorkspaceStore(state => state.fetchMembers);
  
  // State 
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  const [isExcludeModalOpen, setIsExcludeModalOpen] = useState(false);
  const [excludeUserId, setExcludeUserId] = useState('');
  const [isExcluding, setIsExcluding] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState('');

  // Determine admin rights natively
  const isWpOwner = wpMembers.find(m => m.userId === user?.id)?.role === 'owner';
  const isProjAdmin = members.find(m => m.userId === user?.id)?.role === 'admin' || isWpOwner;

  useEffect(() => {
    if (projectId) fetchMembers(projectId).catch(console.error);
    if (workspaceId) fetchWpMembers(workspaceId).catch(console.error);
  }, [projectId, workspaceId, fetchMembers, fetchWpMembers]);

  useEffect(() => {
    if (currentProject) {
      setEditName(currentProject.name);
      setEditDesc(currentProject.description || '');
    }
  }, [currentProject]);

  const handleContentSave = async () => {
    if (!editName.trim() || (editName.trim() === currentProject?.name && editDesc.trim() === (currentProject?.description || ''))) {
      return;
    }
    try {
      setIsSavingContent(true);
      await updateProject(projectId!, { name: editName.trim(), description: editDesc.trim() || undefined });
    } catch (err: any) {
      setError('System rejection: Configuration sync failed.');
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId) return;
    setError('');
    
    try {
      setIsInviting(true);
      await addMember(projectId!, inviteUserId, inviteRole);
      setInviteUserId('');
      setInviteRole('member');
      setIsInviteModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add project member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleExcludeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excludeUserId) return;
    setError('');
    
    try {
      setIsExcluding(true);
      await excludeWorkspaceMember(projectId!, excludeUserId);
      setExcludeUserId('');
      setIsExcludeModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to configure explicit exclusion');
    } finally {
      setIsExcluding(false);
    }
  };

  const handleDeleteProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== currentProject?.name) return;
    try {
      setIsDeleting(true);
      await deleteProject(projectId!);
      navigate(`/w/${workspaceId}/projects`, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  const potentialInvites = wpMembers.filter(wpm => 
    !members.some(pm => pm.userId === wpm.userId) &&
    !exclusions.some(ex => ex.userId === wpm.userId)
  );

  const potentialExclusions = wpMembers.filter(wpm => 
    wpm.role !== 'owner' && 
    !exclusions.some(ex => ex.userId === wpm.userId) &&
    !members.some(pm => pm.userId === wpm.userId)
  );

  if (!currentProject) return null;

  const sidebarItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Team & Access', icon: Users },
    { id: 'exclusions', label: 'Exclusions', icon: UserX },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-500 relative overflow-x-hidden">
      {/* Background Underlay */}
      <div className="fixed inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Modern High-End Header */}
      <header className="h-20 border-b border-border/40 bg-background/80 backdrop-blur-xl px-10 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link 
            to={`/w/${workspaceId}/p/${projectId}`} 
            className="p-2.5 hover:bg-muted/40 rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border/40"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">
              <span>Blueprint</span>
              <ChevronRight size={10} className="opacity-40" />
              <span>Settings</span>
            </div>
            <h1 className="font-display font-black text-xl tracking-tight text-foreground flex items-center gap-3">
              {currentProject.name}
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to={`/w/${workspaceId}/p/${projectId}`} className="text-[10px] font-black uppercase tracking-widest text-primary px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-full transition-all flex items-center gap-2">
            View Output <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] w-full mx-auto p-12 gap-16 relative z-10">
        {/* Navigation Sidebar - Refined Design */}
        <aside className="w-72 flex-shrink-0 space-y-8">
          <section>
            <h2 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] px-4 mb-6">Configuration Stack</h2>
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as SettingsTab)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all group relative overflow-hidden ${
                    activeTab === item.id 
                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-primary' : 'opacity-40 group-hover:opacity-100'}`} />
                  {item.label}
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-muted/20 border border-border/40 relative">
             <div className="absolute inset-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-background border border-border/60 flex items-center justify-center text-primary">
                   <History size={16} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Sync Stats</h4>
             </div>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                Project last synchronized at 12:40 PM UTC.
             </p>
          </section>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 max-w-4xl">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-4 text-destructive"
              >
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest flex-1">{error}</p>
                <button 
                  onClick={() => setError('')} 
                  className="px-3 py-1 bg-destructive/5 hover:bg-destructive/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Clear Status
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'general' && (
              <div className="space-y-12">
                <section>
                  <div className="mb-10">
                    <h2 className="text-3xl font-black tracking-tight text-foreground">General Protocol</h2>
                    <p className="text-muted-foreground text-sm font-serif italic mt-2 opacity-60">Architectural metadata and descriptive identity for this project canvas.</p>
                  </div>

                  <Card className="glass border-border/40 rounded-[48px] overflow-hidden shadow-2xl relative">
                    <div className="absolute inset-0 bg-dot-grid opacity-[0.02] pointer-events-none" />
                    <CardContent className="p-12 space-y-10">
                      <Input 
                        id="project-name"
                        label="Project Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g., Marketing Campaign"
                        disabled={!isProjAdmin}
                        className="rounded-2xl"
                      />

                      <div className="space-y-3">
                        <label htmlFor="project-desc" className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Project Description</label>
                        <textarea
                          id="project-desc"
                          className="w-full px-5 py-4 border border-border/40 rounded-[28px] text-[15px] bg-muted/20 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 min-h-[160px] resize-none placeholder:text-muted-foreground/30 leading-relaxed disabled:opacity-50"
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          placeholder="What is this project about?"
                          disabled={!isProjAdmin}
                        />
                      </div>

                      {isProjAdmin && (
                        <div className="pt-8 flex justify-end">
                          <Button 
                            variant="primary"
                            size="xl"
                            onClick={handleContentSave} 
                            loading={isSavingContent}
                            disabled={!editName.trim() || (editName.trim() === currentProject.name && editDesc.trim() === (currentProject.description || ''))}
                            className="px-12 rounded-[22px] shadow-2xl shadow-primary/20"
                          >
                            Update Project
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* Identity Metadata Section - Redesigned as architectural stamp */}
                <section className="p-10 rounded-[40px] bg-muted/10 border border-dashed border-border/60 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none -mr-8 -mt-8 grayscale select-none">
                    <Fingerprint size={160} />
                  </div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors duration-500 shadow-xl">
                      <Layout size={28} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-1">Architectural Identity</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono opacity-60">Created {new Date(currentProject.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 px-1">Registry Sequence</div>
                    <code className="text-[11px] font-mono text-primary bg-primary/5 px-4 py-2 rounded-xl border border-primary/20 shadow-sm">{currentProject.id}</code>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-10">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">Team Hierarchy</h2>
                    <p className="text-muted-foreground text-sm font-serif italic mt-2 opacity-60 font-medium leading-relaxed max-w-lg">Manage explicit access controls. Global workspace members maintain baseline collaborative rights by default.</p>
                  </div>
                  {isProjAdmin && (
                    <Button variant="secondary" size="lg" onClick={() => setIsInviteModalOpen(true)} className="rounded-[18px] gap-3 px-6 shadow-xl border-border/40">
                      <Users size={16} /> Assign Identity
                    </Button>
                  )}
                </div>

                <Card className="glass border-border/40 rounded-[40px] overflow-hidden shadow-2xl">
                  {members.length === 0 ? (
                    <div className="p-24 text-center">
                      <div className="w-20 h-20 bg-muted/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-border/40 text-primary/30">
                        <ShieldCheck size={32} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Standard Inheritance Protocol Active</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {members.map((member: any) => (
                        <div key={member.id} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-all group">
                          <div className="flex items-center gap-6">
                            <Avatar 
                              name={`${member.user.firstName} ${member.user.lastName}`} 
                              className="w-12 h-12 rounded-[18px] shadow-xl border border-border/60" 
                            />
                            <div>
                               <div className="flex items-center gap-3">
                                  <p className="font-black text-base text-foreground tracking-tight">{member.user.firstName} {member.user.lastName}</p>
                                  {member.userId === user?.id && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-2 font-black uppercase tracking-widest">Self</Badge>}
                               </div>
                               <p className="text-muted-foreground text-[11px] font-mono tracking-tighter opacity-60">{member.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                               <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mb-1">Clearance</div>
                               <Badge 
                                  variant={member.role === 'admin' ? 'primary' : 'secondary'} 
                                  className="px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black"
                               >
                                {member.role === 'admin' ? 'Administrator' : 'Contributor'}
                               </Badge>
                            </div>
                            {isProjAdmin && member.userId !== user?.id && (
                              <button 
                                onClick={() => window.confirm(`Revoke explicit access for ${member.user.firstName}?`) && removeMember(projectId!, member.userId)}
                                className="p-3 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all border border-transparent hover:border-destructive/20"
                                title="Revoke Role"
                              >
                                <UserX size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <div className="p-8 rounded-[32px] bg-muted/10 border border-border/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-2">Access Inheritance Logic</h4>
                      <p className="text-[13px] text-muted-foreground leading-relaxed italic font-serif">Workspace members carry inherited permissions. Adding them here explicitly verifies their role as a "Project Administrator" or "Dedicated Contributor," overriding baseline restrictions.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'exclusions' && (
              <div className="space-y-10">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-destructive">Dark Exclusions</h2>
                    <p className="text-muted-foreground text-sm font-serif italic mt-2 opacity-60 font-medium leading-relaxed max-w-lg">Identify users to be explicitly purged from the project discovery and access context.</p>
                  </div>
                  {isProjAdmin && (
                    <Button variant="secondary" size="lg" onClick={() => setIsExcludeModalOpen(true)} className="rounded-[18px] gap-3 px-6 shadow-xl border-destructive/20 text-destructive hover:bg-destructive/5">
                      <UserX size={16} /> Exclude Entity
                    </Button>
                  )}
                </div>

                <Card className="glass border-destructive/20 rounded-[40px] overflow-hidden shadow-2xl">
                  {exclusions.length === 0 ? (
                    <div className="p-24 text-center">
                      <div className="w-20 h-20 bg-destructive/5 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-destructive/10 text-destructive/30">
                        <ShieldAlert size={32} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Zero Explicit Restrictions</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-destructive/10">
                      {exclusions.map((ex: any) => (
                        <div key={ex.id} className="p-8 flex items-center justify-between hover:bg-destructive/[0.03] transition-all group">
                          <div className="flex items-center gap-6">
                            <Avatar name={`${ex.user.firstName} ${ex.user.lastName}`} className="w-12 h-12 grayscale brightness-75 rounded-[18px] border border-border/40" />
                            <div>
                              <p className="font-black text-base text-destructive tracking-tight uppercase">{ex.user.firstName} {ex.user.lastName}</p>
                              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-40 italic">Expelled from active canvas</p>
                            </div>
                          </div>
                          {isProjAdmin && (
                            <button 
                              onClick={() => removeExclusion(projectId!, ex.userId)}
                              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground bg-muted/40 hover:bg-muted/60 rounded-full transition-all border border-border/40"
                            >
                              Restore Permissions
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <div className="p-8 rounded-[32px] bg-destructive/[0.02] border border-destructive/10 relative overflow-hidden group">
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive flex-shrink-0">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-destructive uppercase tracking-widest mb-2">Blacklist Severity</h4>
                      <p className="text-[13px] text-destructive/60 leading-relaxed italic font-serif">Exclusions act as higher-order overrides. An entity identified here cannot participate in communication, task-drawing, or discovery workflows within this project context.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-10">
                <div className="mb-6">
                  <h2 className="text-3xl font-black tracking-tight text-foreground">Project Finality</h2>
                  <p className="text-muted-foreground text-sm font-serif italic mt-2 opacity-60 font-medium leading-relaxed">System-critical operations with immediate and total permanence.</p>
                </div>

                <Card className="border-destructive/40 bg-destructive/[0.03] rounded-[48px] overflow-hidden shadow-2xl relative group">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent)] pointer-events-none" />
                  <div className="p-12 space-y-10">
                    <div className="flex items-start gap-8">
                      <div className="w-20 h-20 rounded-[32px] bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500 border border-destructive/20">
                        <Trash2 size={32} />
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-black text-3xl text-foreground uppercase tracking-tighter">Total Deletion</h3>
                        <p className="text-base text-muted-foreground/80 leading-relaxed font-serif max-w-xl">This action will purge the <strong>{currentProject.name}</strong> identity from the Mesh universe. All task hashes, canvas states, and historical data will be definitively neutralized.</p>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-destructive/10 flex items-center justify-between">
                      <div className="text-[11px] text-destructive/60 font-black uppercase tracking-widest max-w-sm italic opacity-70">"Deletion is the last step to nothing." — Core Logic</div>
                      <Button 
                        variant="destructive" 
                        size="xl"
                        onClick={() => setIsDeleteModalOpen(true)} 
                        className="px-12 rounded-[22px] shadow-2xl shadow-destructive/20 group-hover:bg-destructive transition-colors duration-300"
                      >
                        Execute Deletion
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="p-10 rounded-[40px] bg-zinc-900 border border-white/10 shadow-3xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-dot-grid opacity-[0.05] pointer-events-none" />
                   <div className="flex items-start gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-black flex-shrink-0 mt-0.5 animate-pulse shadow-2xl shadow-amber-400/20">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-3">Wait — Preservation Strategy?</h4>
                      <p className="text-[13px] text-zinc-400 leading-relaxed italic font-serif">Consider archiving if the project data holds historical value. Total deletion is irreversible. Mesh Support can only restore data within a 24-hour buffer window (Premium Feature).</p>
                    </div>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modals - Architectural Refinement */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Assign Explicit Identity"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-8 p-6">
          <div className="p-5 bg-primary/5 rounded-[24px] border border-primary/20 flex items-start gap-4 mb-4">
            <Users className="w-6 h-6 text-primary mt-1" />
            <p className="text-xs text-muted-foreground/80 leading-relaxed italic font-serif">Mapping workspace entities to specific project clearance levels. Higher roles provide administrative configuration access.</p>
          </div>

          <div className="space-y-3">
            <label htmlFor="invite-user" className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Target Identity</label>
            <select 
              id="invite-user"
              className="w-full px-5 py-4 border border-border/40 rounded-2xl text-[15px] bg-muted/20 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%233b82f6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:24px_24px] bg-[position:right_12px_center] bg-no-repeat"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              required
            >
              <option value="" disabled className="bg-background">Select Identification...</option>
              {potentialInvites.map(wpm => (
                 <option key={wpm.userId} value={wpm.userId} className="bg-background">{wpm.user?.firstName} {wpm.user?.lastName}</option>
              ))}
            </select>
            {potentialInvites.length === 0 && <p className="text-[10px] text-muted-foreground/40 italic mt-1 ml-1">Universal workspace coverage — no unassigned members available.</p>}
          </div>
          
          <div className="space-y-4">
            <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Clearance Tier</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setInviteRole('member')}
                className={`p-5 rounded-3xl border transition-all text-left group relative overflow-hidden ${inviteRole === 'member' ? 'bg-primary/5 border-primary shadow-xl ring-1 ring-primary/20' : 'bg-muted/10 border-border/40 hover:border-border'}`}
              >
                <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors ${inviteRole === 'member' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted/40 text-muted-foreground/40'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-black text-[13px] text-foreground uppercase tracking-widest mb-1">Contributor</div>
                <div className="text-[11px] text-muted-foreground font-serif italic">Full canvas drawing rights.</div>
              </button>
              <button
                type="button"
                onClick={() => setInviteRole('admin')}
                className={`p-5 rounded-3xl border transition-all text-left group relative overflow-hidden ${inviteRole === 'admin' ? 'bg-primary/5 border-primary shadow-xl ring-1 ring-primary/20' : 'bg-muted/10 border-border/40 hover:border-border'}`}
              >
                <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors ${inviteRole === 'admin' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted/40 text-muted-foreground/40'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="font-black text-[13px] text-foreground uppercase tracking-widest mb-1">Archon</div>
                <div className="text-[11px] text-muted-foreground font-serif italic">Full config permission.</div>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-8 border-t border-border/40">
            <Button type="button" variant="tertiary" onClick={() => setIsInviteModalOpen(false)} className="rounded-full px-8">Discard</Button>
            <Button type="submit" variant="primary" loading={isInviting} disabled={!inviteUserId} className="rounded-full px-10 shadow-2xl shadow-primary/20">Secure Role</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExcludeModalOpen}
        onClose={() => setIsExcludeModalOpen(false)}
        title="Exclude Identity"
      >
        <form onSubmit={handleExcludeSubmit} className="space-y-6 p-6">
          <div className="p-5 bg-destructive/5 rounded-[24px] border border-destructive/20 flex items-start gap-4 mb-4">
            <ShieldAlert className="w-6 h-6 text-destructive mt-1" />
            <p className="text-xs text-destructive/80 leading-relaxed font-serif italic">Blacklisting a specific entity permanently removes this project from their network discovery. They will be met with a 403 Access Denied state.</p>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="exclude-user" className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Selection for Purge</label>
            <select 
              id="exclude-user"
              className="w-full px-5 py-4 border border-border/40 rounded-2xl text-[15px] bg-muted/20 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all pr-12 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23ef4444%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:24px_24px] bg-[position:right_12px_center] bg-no-repeat"
              value={excludeUserId}
              onChange={(e) => setExcludeUserId(e.target.value)}
              required
            >
              <option value="" disabled className="bg-background">Search Registry...</option>
              {potentialExclusions.map(wpm => (
                 <option key={wpm.userId} value={wpm.userId} className="bg-background">{wpm.user?.firstName} {wpm.user?.lastName}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-8 border-t border-border/40">
            <Button type="button" variant="tertiary" onClick={() => setIsExcludeModalOpen(false)} className="rounded-full px-8">Cancel</Button>
            <Button type="submit" variant="destructive" loading={isExcluding} disabled={!excludeUserId} className="rounded-full shadow-2xl shadow-destructive/20 px-10">Purge Entity</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Destroy Canvas State"
      >
        <form onSubmit={handleDeleteProject} className="space-y-8 p-6">
          <div className="p-6 bg-destructive/10 text-destructive text-sm rounded-[32px] border border-destructive/20 relative overflow-hidden group">
             <div className="absolute right-0 top-0 opacity-[0.05] p-2 rotate-12">
                <Trash2 size={80} />
             </div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-pulse" />
              <p className="font-black uppercase tracking-widest text-base">Warning: Total Purge</p>
            </div>
            <p className="text-sm leading-relaxed opacity-90 font-serif italic relative z-10">This protocol will permanently neutralize <strong>{currentProject.name}</strong>. All task history, canvas snapshots, and project hashes will be definitively erased across the global Mesh indexing system.</p>
          </div>
          
          <div className="space-y-4">
            <label htmlFor="delete-confirm" className="block text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">
              Verify destruction by typing <span className="text-destructive font-mono select-none underline decoration-2 underline-offset-4">{currentProject.name}</span>
            </label>
            <Input 
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="System confirmation..."
              required
              autoFocus
              className="border-destructive/30 focus:ring-destructive/20 focus:border-destructive rounded-[20px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-8 border-t border-border/40">
            <Button type="button" variant="tertiary" onClick={() => setIsDeleteModalOpen(false)} className="rounded-full px-8">Abort</Button>
            <Button 
              type="submit" 
              variant="destructive" 
              loading={isDeleting} 
              disabled={deleteConfirmText !== currentProject.name}
              className="rounded-full shadow-2xl shadow-destructive/20 px-12 h-14 uppercase tracking-[0.2em] font-black"
            >
              Destroy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
