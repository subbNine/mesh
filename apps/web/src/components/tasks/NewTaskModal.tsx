import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { useProjectStore } from '../../store/project.store';

interface NewTaskModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (task: any) => void;
}

export function NewTaskModal({ projectId, onClose, onCreated }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [assigneeId, setAssigneeId] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const members = useProjectStore(state => state.members);
  const fetchMembers = useProjectStore(state => state.fetchMembers);

  useEffect(() => {
    fetchMembers(projectId).catch(console.error);
  }, [projectId, fetchMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await api.post(`/projects/${projectId}/tasks`, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        assigneeId: assigneeId || undefined
      });
      onCreated(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task. Make sure tasks API module exists.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create New Task"
      description="Add a new actionable item to this project."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{error}</div>}
        
        <Input 
          label="Task Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="E.g., Implement login form"
          required
          autoFocus
          disabled={isLoading}
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] resize-y"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add details..."
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Status</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <label className="block text-sm font-medium text-foreground">Assignee</label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={isLoading || members.length === 0}
            >
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.userId} value={m.userId}>
                  {m.user.firstName} {m.user.lastName}
                </option>
              ))}
            </select>
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
