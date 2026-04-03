import React from 'react';

export function TaskGrid({ filterStatus, filterAssignee }: { filterStatus: string, filterAssignee: string }) {
  // Placeholder for Task Grid built in Prompt 11
  return (
    <div className="flex items-center justify-center min-h-[300px] border-2 border-dashed border-border rounded-xl bg-card/50">
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground mb-2">No Tasks Found</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Tasks functionalities and grid layout will be completely wired into this container. Filter: {filterStatus || 'All'}, Assignee: {filterAssignee || 'All'}
        </p>
      </div>
    </div>
  );
}
