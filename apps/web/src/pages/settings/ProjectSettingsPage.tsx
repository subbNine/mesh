import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
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
  AlertTriangle
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
      console.error(err);
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
    <div className="min-h-full flex flex-col animate-in fade-in duration-500">
      {/* Header Bar */}
      <header className="h-16 border-b border-zinc-200/60 bg-white/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={`/w/${workspaceId}/p/${projectId}`} className="p-2 hover:bg-zinc-100/80 rounded-lg transition-colors text-zinc-500">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400">Projects</span>
            <ChevronRight className="w-3 h-3 text-zinc-300" />
            <span className="text-zinc-400 truncate max-w-[150px]">{currentProject.name}</span>
            <ChevronRight className="w-3 h-3 text-zinc-300" />
            <span className="font-semibold text-zinc-900">Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/w/${workspaceId}/p/${projectId}`} className="text-xs font-bold text-primary px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors inline-flex items-center gap-2">
            View Project <ExternalLink className="w-3 h-3 "/>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto p-8 gap-12">
        {/* Navigation Sidebar */}
        <aside className="w-64 flex-shrink-0 space-y-1">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-4">Project Settings</h2>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SettingsTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                activeTab === item.id 
                ? 'bg-primary/10 text-primary shadow-sm' 
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
              {item.label}
              {activeTab === item.id && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 max-w-3xl animate-fade-in">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive animate-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-xs font-bold hover:underline">Dismiss</button>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-8">
              <section>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-zinc-900">General Settings</h1>
                  <p className="text-zinc-500 text-sm mt-1">Manage basic information for your project.</p>
                </div>

                <Card className="p-8 space-y-6 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(0,0,0,0.04)] border-zinc-200/60 rounded-2xl">
                  <div className="space-y-2">
                    <label htmlFor="project-name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Project Name</label>
                    <Input 
                      id="project-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g., Marketing Campaign"
                      disabled={!isProjAdmin}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="project-desc" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                    <textarea
                      id="project-desc"
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/30 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] resize-none"
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="What is this project about?"
                      disabled={!isProjAdmin}
                    />
                  </div>

                  {isProjAdmin && (
                    <div className="pt-4 flex justify-end border-t border-zinc-100">
                      <Button 
                        onClick={handleContentSave} 
                        loading={isSavingContent}
                        disabled={!editName.trim() || (editName.trim() === currentProject.name && editDesc.trim() === (currentProject.description || ''))}
                        className="px-8 rounded-full"
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </Card>
              </section>

              <section className="p-6 bg-secondary/30 rounded-2xl border border-zinc-200/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
                    <Layout className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Project Identity</h3>
                    <p className="text-xs text-zinc-500">Created on {new Date(currentProject.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">ID</div>
                  <code className="text-xs font-mono text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200">{currentProject.id.substring(0, 8)}...</code>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">Team & Access</h1>
                  <p className="text-zinc-500 text-sm mt-1">Workspace members have access by default. Explicitly added members appear here.</p>
                </div>
                {isProjAdmin && (
                  <Button size="sm" onClick={() => setIsInviteModalOpen(true)} className="rounded-full gap-2">
                    <Users className="w-3.5 h-3.5" /> Add Member
                  </Button>
                )}
              </div>

              <Card className="overflow-hidden bg-white shadow-sm border-zinc-200/60 rounded-2xl">
                {members.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                      <ShieldCheck className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-zinc-500 text-sm">No explicit members. Standard inheritance rules apply.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {members.map((member: any) => (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${member.user.firstName} ${member.user.lastName}`} className="shadow-sm" />
                          <div>
                            <p className="font-bold text-sm text-zinc-900">{member.user.firstName} {member.user.lastName}</p>
                            <p className="text-zinc-500 text-xs tracking-tight">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={member.role === 'admin' ? 'primary' : 'secondary'} className="px-2.5 py-0.5 rounded-full uppercase text-[9px] tracking-widest font-black">
                            {member.role === 'admin' ? 'Admin' : 'Member'}
                          </Badge>
                          {isProjAdmin && member.userId !== user?.id && (
                            <button 
                              onClick={() => window.confirm(`Revoke explicit access for ${member.user.firstName}?`) && removeMember(projectId!, member.userId)}
                              className="p-2 text-zinc-400 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                              title="Revoke Role"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/50">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest mb-1">Access Logic</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">By default, all workspace members can view and collaborate. Assigning someone as an "Admin" here grants them permission to manage settings for this specific project regardless of their global workspace role.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exclusions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 text-destructive">Exclusions</h1>
                  <p className="text-zinc-500 text-sm mt-1">Specify users who are strictly forbidden from discovering or viewing this project.</p>
                </div>
                {isProjAdmin && (
                  <Button variant="secondary" size="sm" onClick={() => setIsExcludeModalOpen(true)} className="rounded-full gap-2 border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10">
                    <UserX className="w-3.5 h-3.5" /> Exclude User
                  </Button>
                )}
              </div>

              <Card className="overflow-hidden bg-white shadow-sm border-zinc-200/60 rounded-2xl">
                {exclusions.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 text-zinc-400">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <p className="text-zinc-500 text-sm">No explicit exclusions. This project is semi-public to all workspace members.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {exclusions.map((ex: any) => (
                      <div key={ex.id} className="p-4 flex items-center justify-between hover:bg-destructive/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${ex.user.firstName} ${ex.user.lastName}`} className="grayscale brightness-90 shadow-sm" />
                          <div>
                            <p className="font-bold text-sm text-destructive">{ex.user.firstName} {ex.user.lastName}</p>
                            <p className="text-zinc-400 text-xs font-medium">Bannished from project context</p>
                          </div>
                        </div>
                        {isProjAdmin && (
                          <button 
                            onClick={() => removeExclusion(projectId!, ex.userId)}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-zinc-200/50"
                          >
                            Restore Access
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="p-6 bg-destructive/5 rounded-2xl border border-destructive/10">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-destructive uppercase tracking-widest mb-1">Bannishment Rules</h4>
                    <p className="text-xs text-destructive/80 leading-relaxed">Exclusions override workspace inheritance. An excluded user will not see the project in their dashboard and will receive a 403 Forbidden even if they have a direct link.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-zinc-900">Danger Zone</h1>
                <p className="text-zinc-500 text-sm mt-1">Actions that are permanent and irreversible.</p>
              </div>

              <Card className="border-destructive/20 bg-destructive/[0.02] rounded-2xl overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-lg text-zinc-900 uppercase tracking-tighter">Delete Project</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">Deleting a project will permanently remove it from the workspace. All tasks, canvas elements, and communication history will be erased forever.</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-destructive/10 flex items-center justify-between">
                    <div className="text-xs text-destructive/60 font-medium max-w-sm">This action cannot be undone. Please be certain before proceeding.</div>
                    <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="px-8 rounded-full shadow-lg shadow-destructive/20">
                      Delete this project
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="p-6 bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl">
                 <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-black flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Archiving Logic</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">"Measurement is the first step to everything. Deletion is the last step to nothing." — Mesh Core. If you want to keep the data but clear the dashboard, consider archiving instead (Coming Soon).</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals - Enhanced styling */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Add Explicit Member"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-start gap-3 mb-2">
            <Users className="w-5 h-5 text-zinc-400 mt-1" />
            <p className="text-xs text-zinc-500 leading-relaxed">Adding a member grant them explicit rights. Admins can manage settings, Members can participate in all tasks.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-user" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Workspace User</label>
            <select 
              id="invite-user"
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[position:right_10px_center] bg-no-repeat"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              required
            >
              <option value="" disabled>Select from workspace...</option>
              {potentialInvites.map(wpm => (
                 <option key={wpm.userId} value={wpm.userId}>{wpm.user?.firstName} {wpm.user?.lastName}</option>
              ))}
            </select>
            {potentialInvites.length === 0 && <p className="text-[10px] text-zinc-400 italic mt-1 ml-1">No other workspace members available to add.</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Role Assignment</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInviteRole('member')}
                className={`p-4 rounded-xl border transition-all text-left group ${inviteRole === 'member' ? 'bg-primary/5 border-primary shadow-[0_0_15px_-5px_rgba(12,163,186,0.3)]' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
              >
                <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center transition-colors ${inviteRole === 'member' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-zinc-900">Member</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Can draw, comment and manage tasks.</div>
              </button>
              <button
                type="button"
                onClick={() => setInviteRole('admin')}
                className={`p-4 rounded-xl border transition-all text-left group ${inviteRole === 'admin' ? 'bg-primary/5 border-primary shadow-[0_0_15px_-5px_rgba(12,163,186,0.3)]' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
              >
                <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center transition-colors ${inviteRole === 'admin' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-zinc-900">Admin</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Full control over project settings.</div>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)} className="rounded-full px-6">Cancel</Button>
            <Button type="submit" loading={isInviting} disabled={!inviteUserId} className="rounded-full px-8">Assign Role</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExcludeModalOpen}
        onClose={() => setIsExcludeModalOpen(false)}
        title="Exclude Workspace Member"
      >
        <form onSubmit={handleExcludeSubmit} className="space-y-4">
          <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/10 flex items-start gap-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-destructive mt-1" />
            <p className="text-xs text-destructive/80 leading-relaxed">Selecting a user for exclusion will hide this project from them entirely. They will not be able to locate it in the workspace or access it via URL.</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="exclude-user" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Target User</label>
            <select 
              id="exclude-user"
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23EF4444%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[position:right_10px_center] bg-no-repeat"
              value={excludeUserId}
              onChange={(e) => setExcludeUserId(e.target.value)}
              required
            >
              <option value="" disabled>Select user to restrict...</option>
              {potentialExclusions.map(wpm => (
                 <option key={wpm.userId} value={wpm.userId}>{wpm.user?.firstName} {wpm.user?.lastName}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button type="button" variant="secondary" onClick={() => setIsExcludeModalOpen(false)} className="rounded-full">Cancel</Button>
            <Button type="submit" variant="destructive" loading={isExcluding} disabled={!excludeUserId} className="rounded-full shadow-lg shadow-destructive/20">Hide Project</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
      >
        <form onSubmit={handleDeleteProject} className="space-y-6">
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="font-black uppercase tracking-tight">Warning: Absolute Destruction</p>
            </div>
            <p className="text-xs leading-relaxed opacity-90 font-medium">This will permanently delete <strong>{currentProject.name}</strong>, all associated tasks, canvas history, and project-specific assets. This cannot be undone.</p>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="delete-confirm" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              Confirm by typing <span className="text-destructive font-mono select-none pointer-events-none">{currentProject.name}</span>
            </label>
            <Input 
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type project name here..."
              required
              autoFocus
              className="border-destructive/30 focus:ring-destructive/20 focus:border-destructive rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="rounded-full">Cancel</Button>
            <Button 
              type="submit" 
              variant="destructive" 
              loading={isDeleting} 
              disabled={deleteConfirmText !== currentProject.name}
              className="rounded-full shadow-xl shadow-destructive/20 px-8"
            >
              Destroy Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
