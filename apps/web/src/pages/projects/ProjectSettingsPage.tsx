import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

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

  // Workspace properties for generic lookups (exclusion mapping requires knowing overall workspace members)
  const wpMembers = useWorkspaceStore(state => state.members);
  const fetchWpMembers = useWorkspaceStore(state => state.fetchMembers);
  
  // State 
  const [isEditingContent, setIsEditingContent] = useState(false);
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
    if (editName.trim() === currentProject?.name && editDesc.trim() === (currentProject?.description || '')) {
      setIsEditingContent(false);
      return;
    }
    try {
      setIsSavingContent(true);
      await updateProject(projectId!, { name: editName.trim(), description: editDesc.trim() || undefined });
      setIsEditingContent(false);
    } catch (err: any) {
      console.error(err);
      setEditName(currentProject?.name || '');
      setEditDesc(currentProject?.description || '');
      setIsEditingContent(false);
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

  // Build eligible user lists 
  const potentialInvites = wpMembers.filter(wpm => 
    !members.some(pm => pm.userId === wpm.userId) &&
    !exclusions.some(ex => ex.userId === wpm.userId)
  );

  const potentialExclusions = wpMembers.filter(wpm => 
    wpm.role !== 'owner' && // Typically owners shouldn't be excluded from projects easily
    !exclusions.some(ex => ex.userId === wpm.userId)
  );

  if (!currentProject) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20 w-full">
      <header>
        <p className="text-sm text-muted-foreground mb-1">Project Settings</p>
        
        {isEditingContent && isProjAdmin ? (
          <div className="space-y-3 bg-card p-4 rounded-xl border border-border shadow-sm">
            <Input 
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              disabled={isSavingContent}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                disabled={isSavingContent}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleContentSave} loading={isSavingContent}>Save Changes</Button>
              <Button size="sm" variant="secondary" onClick={() => setIsEditingContent(false)} disabled={isSavingContent}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div 
            className={`group inline-block ${isProjAdmin ? 'cursor-pointer hover:bg-card/50 p-2 -m-2 rounded-xl border border-transparent hover:border-border transition-colors' : ''}`}
            onClick={() => isProjAdmin && setIsEditingContent(true)}
            title={isProjAdmin ? "Click to edit" : undefined}
          >
            <h1 className="text-3xl font-bold text-foreground inline-flex items-center gap-2">
              {currentProject.name}
              {isProjAdmin && (
                <svg className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              )}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{currentProject.description || 'No description provided.'}</p>
          </div>
        )}
      </header>

      {/* Explicit Members Section */}
      <section className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground">Explicit Project Members</h2>
            <p className="text-sm text-muted-foreground max-w-lg">Workspace members automatically have access unless explicitly excluded. This table tracks specifically assigned direct access parameters.</p>
          </div>
          {isProjAdmin && (
            <Button onClick={() => setIsInviteModalOpen(true)}>Add Member</Button>
          )}
        </div>

        <Card>
          <div className="overflow-x-auto">
            {members.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No explicitly scoped members. Workspace members inherit standard bounds securely.</div>
            ) : (
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member: any) => (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${member.user.firstName} ${member.user.lastName}`} />
                          <div>
                            <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                            <p className="text-muted-foreground text-xs">{member.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={member.role === 'admin' ? 'primary' : 'secondary'}>
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isProjAdmin && member.userId !== user?.id && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => window.confirm('Revoke explicit project role?') && removeMember(projectId!, member.userId)}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </section>

      {/* Exclusions Section */}
      <section className="space-y-4 pt-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground">Workspace Exclusions</h2>
            <p className="text-sm text-muted-foreground max-w-md">Deny Workspace members default access to this Project.</p>
          </div>
          {isProjAdmin && (
            <Button variant="secondary" onClick={() => setIsExcludeModalOpen(true)}>Add Exclusion</Button>
          )}
        </div>

        <Card>
          <div className="overflow-x-auto">
            {exclusions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No workspace exclusions currently mapped natively.</div>
            ) : (
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Excluded User</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exclusions.map((exclusion: any) => (
                    <tr key={exclusion.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${exclusion.user.firstName} ${exclusion.user.lastName}`} />
                          <div>
                            <p className="font-medium text-destructive">{exclusion.user.firstName} {exclusion.user.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isProjAdmin && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => removeExclusion(projectId!, exclusion.userId)}
                          >
                            Repeal Exclusion
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </section>

      {/* Danger Zone */}
      {isProjAdmin && (
        <section className="space-y-4 pt-12">
          <div>
            <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
          </div>
          <Card className="border-destructive/20 bg-destructive/5">
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground">Delete Project</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Once you delete a project, there is no going back. All tasks and nested features will be permanently erased.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="flex-shrink-0">
                Delete Project
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* Modals */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Add Explicit Member"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{error}</div>}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Workspace User</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              required
            >
              <option value="" disabled>Select a user</option>
              {potentialInvites.map(wpm => (
                 <option key={wpm.userId} value={wpm.userId}>{wpm.user?.firstName} {wpm.user?.lastName} ({wpm.user?.email})</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Role</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isInviting} disabled={!inviteUserId}>Assign Role</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExcludeModalOpen}
        onClose={() => setIsExcludeModalOpen(false)}
        title="Exclude Workspace Member"
        description="Select a user to explicitly completely cut off from locating this project entirely globally."
      >
        <form onSubmit={handleExcludeSubmit} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{error}</div>}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Workspace User to Hide From</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={excludeUserId}
              onChange={(e) => setExcludeUserId(e.target.value)}
              required
            >
              <option value="" disabled>Select a user</option>
              {potentialExclusions.map(wpm => (
                 <option key={wpm.userId} value={wpm.userId}>{wpm.user?.firstName} {wpm.user?.lastName} ({wpm.user?.email})</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsExcludeModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" loading={isExcluding} disabled={!excludeUserId}>Hide Project entirely</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
      >
        <form onSubmit={handleDeleteProject} className="space-y-4">
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 mb-4">
            <p className="font-bold mb-1">Warning: This action is permanent.</p>
            <p>This will permanently delete the <strong>{currentProject.name}</strong> project, along with all internal dependencies natively embedded forever.</p>
          </div>
          
          {error && <div className="p-3 mb-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium">{error}</div>}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Please type <span className="font-bold select-all bg-muted px-1 rounded">{currentProject.name}</span> to confirm.
            </label>
            <Input 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={currentProject.name}
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="destructive" 
              loading={isDeleting} 
              disabled={deleteConfirmText !== currentProject.name}
            >
              I understand, delete this project
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
