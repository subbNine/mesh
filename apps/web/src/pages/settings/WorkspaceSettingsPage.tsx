import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const members = useWorkspaceStore(state => state.members);
  const fetchMembers = useWorkspaceStore(state => state.fetchMembers);
  const inviteMember = useWorkspaceStore(state => state.inviteMember);
  const removeMember = useWorkspaceStore(state => state.removeMember);
  const updateWorkspace = useWorkspaceStore(state => state.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore(state => state.deleteWorkspace);
  
  const user = useAuthStore(state => state.user);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState('');

  const currentUserRole = members.find(m => m.userId === user?.id)?.role;
  const isOwner = currentUserRole === 'owner';

  useEffect(() => {
    if (workspaceId) {
      fetchMembers(workspaceId).catch(console.error);
    }
  }, [workspaceId, fetchMembers]);

  useEffect(() => {
    if (currentWorkspace?.name) {
      setEditName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  const handleNameSave = async () => {
    if (editName.trim() === currentWorkspace?.name || !editName.trim()) {
      setIsEditingName(false);
      setEditName(currentWorkspace?.name || '');
      return;
    }
    
    try {
      setIsSavingName(true);
      await updateWorkspace(workspaceId!, { name: editName.trim() });
      setIsEditingName(false);
    } catch (err: any) {
      console.error(err);
      // Revert on error
      setEditName(currentWorkspace?.name || '');
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setError('');
    
    try {
      setIsInviting(true);
      await inviteMember(workspaceId!, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setInviteRole('member');
      setIsInviteModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember(workspaceId!, targetUserId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== currentWorkspace?.name) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkspace(workspaceId!);
      navigate('/workspaces', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete workspace');
      setIsDeleting(false);
    }
  };

  if (!currentWorkspace) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20 w-full">
      <header>
        <p className="text-sm text-muted-foreground mb-1">Settings</p>
        
        {isEditingName && isOwner ? (
          <div className="flex items-center gap-2">
            <Input 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              containerClassName="max-w-md w-full m-0"
              className="text-3xl font-bold h-auto py-1"
              autoFocus
              disabled={isSavingName}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <h1 
              className="text-3xl font-bold text-foreground inline-flex items-center gap-2"
            >
              {currentWorkspace.name}
            </h1>
            {isOwner && (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => setIsEditingName(true)}
                title="Edit Workspace"
                className="px-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Members Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground">Members</h2>
            <p className="text-sm text-muted-foreground">Manage who has access to this workspace</p>
          </div>
          {isOwner && (
            <Button onClick={() => setIsInviteModalOpen(true)}>Invite Member</Button>
          )}
        </div>

        <Card>
          <div className="overflow-x-auto">
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
                      <Badge variant={member.role === 'owner' ? 'primary' : 'secondary'}>
                        {member.role === 'owner' ? 'Owner' : 'Member'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isOwner && member.userId !== user?.id && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Danger Zone */}
      {isOwner && (
        <section className="space-y-4 pt-8">
          <div>
            <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
          </div>
          <Card className="border-destructive/20 bg-destructive/5">
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground">Delete Workspace</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Once you delete a workspace, there is no going back. All projects and tasks will be permanently removed.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="flex-shrink-0">
                Delete Workspace
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* Modals */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Member"
        description="Invite a new user to collaborate in this workspace."
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{error}</div>}
          
          <Input 
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
            autoFocus
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Role</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isInviting} disabled={!inviteEmail.trim()}>Send Invite</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Workspace"
      >
        <form onSubmit={handleDeleteWorkspace} className="space-y-4">
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 mb-4">
            <p className="font-bold mb-1">Warning: This action is permanent.</p>
            <p>This will permanently delete the <strong>{currentWorkspace.name}</strong> workspace, along with all of its projects, tasks, and data.</p>
          </div>
          
          {error && <div className="p-3 mb-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium">{error}</div>}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Please type <span className="font-bold select-all bg-muted px-1 rounded">{currentWorkspace.name}</span> to confirm.
            </label>
            <Input 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={currentWorkspace.name}
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
              disabled={deleteConfirmText !== currentWorkspace.name}
            >
              I understand, delete this workspace
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
