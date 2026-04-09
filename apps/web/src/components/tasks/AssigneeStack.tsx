import { User } from 'lucide-react';

import { getUserColor } from '../../lib/user-color';

type AssigneeLike = {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

type AssigneeStackProps = Readonly<{
  assignees?: AssigneeLike[] | null;
  maxVisible?: number;
  size?: 'sm' | 'md';
  emptyLabel?: string;
}>;

export function AssigneeStack({
  assignees = [],
  maxVisible = 3,
  size = 'sm',
  emptyLabel = 'Unassigned',
}: AssigneeStackProps) {
  const safeAssignees = assignees ?? [];
  const visibleAssignees = safeAssignees.slice(0, maxVisible);
  const extraCount = Math.max(0, safeAssignees.length - maxVisible);
  const avatarSize = size === 'md' ? 'h-8 w-8 text-[10px]' : 'h-6 w-6 text-[9px]';
  const extraSize = size === 'md' ? 'h-8 w-8 text-[10px]' : 'h-6 w-6 text-[9px]';

  if (safeAssignees.length === 0) {
    return (
      <div
        className={`flex ${avatarSize} items-center justify-center rounded-xl border border-dashed border-border/70 text-muted-foreground`}
        title={emptyLabel}
      >
        <User size={size === 'md' ? 14 : 12} />
      </div>
    );
  }

  return (
    <div className="flex items-center -space-x-2">
      {visibleAssignees.map((assignee, index) => {
        const initials = `${assignee.firstName?.[0] ?? ''}${assignee.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

        return (
          <div
            key={assignee.id}
            className={`relative flex ${avatarSize} items-center justify-center overflow-hidden rounded-xl border-2 border-card font-black text-white shadow-sm`}
            style={{
              backgroundColor: getUserColor(assignee.id),
              zIndex: visibleAssignees.length - index,
            }}
            title={`${assignee.firstName} ${assignee.lastName}`}
          >
            {assignee.avatarUrl ? (
              <img src={assignee.avatarUrl} alt={`${assignee.firstName} ${assignee.lastName}`} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
        );
      })}

      {extraCount > 0 && (
        <div
          className={`relative flex ${extraSize} items-center justify-center rounded-xl border-2 border-card bg-muted text-muted-foreground font-black shadow-sm`}
          title={`${extraCount} more assignee${extraCount === 1 ? '' : 's'}`}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
}
