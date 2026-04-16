import React, { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';

import { useProjectStore } from '../../store/project.store';
import { useTaskStore } from '../../store/task.store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface NewTaskModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (task: any) => void;
}

export function NewTaskModal({ projectId, onClose, onCreated }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const members = useProjectStore((state) => state.members);
  const fetchMembers = useProjectStore((state) => state.fetchMembers);

  useEffect(() => {
    fetchMembers(projectId).catch(console.error);
  }, [projectId, fetchMembers]);

  const selectedCountLabel = useMemo(() => `${assigneeIds.length}/5 selected`, [assigneeIds.length]);

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }

      if (current.length >= 5) {
        return current;
      }

      return [...current, userId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const createTask = useTaskStore.getState().createTask;
      const data = await createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status: status as any,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      });
      onCreated(data);
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message[0] : message || 'Failed to create task.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create New Task"
      description="Spin up a new task and assign up to five collaborators from the start."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g., Design the onboarding empty state"
          required
          autoFocus
          disabled={isLoading}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Description</label>
          <textarea
            className="min-h-[100px] w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline the goal, context, and what good looks like..."
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Status</label>
            <select
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLoading}
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">Assignees</label>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{selectedCountLabel}</span>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-2">
              {members.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-sm text-muted-foreground">
                  No project members available yet.
                </div>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {members.map((member) => {
                    const isSelected = assigneeIds.includes(member.userId);
                    const initials = `${member.user.firstName?.[0] ?? ''}${member.user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
                    const avatarUrl = (member.user as { avatarUrl?: string | null }).avatarUrl;

                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => toggleAssignee(member.userId)}
                        disabled={isLoading || (!isSelected && assigneeIds.length >= 5)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${isSelected
                          ? 'border-primary/40 bg-primary/10 shadow-sm'
                          : 'border-border/60 bg-card hover:border-primary/20 hover:bg-primary/[0.03]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-black ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={`${member.user.firstName} ${member.user.lastName}`} className="h-full w-full rounded-xl object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {member.user.firstName} {member.user.lastName}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {isSelected ? 'Included on this task' : 'Tap to assign'}
                            </div>
                          </div>
                        </div>

                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 text-transparent'}`}>
                          <Check size={12} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between gap-2 px-1">
                <span className="text-[11px] text-muted-foreground">Up to five collaborators can share a task.</span>
                <button
                  type="button"
                  onClick={() => setAssigneeIds([])}
                  disabled={isLoading || assigneeIds.length === 0}
                  className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" loading={isLoading} disabled={!title.trim()}>Create Task</Button>
        </div>
      </form>
    </Modal>
  );
}
