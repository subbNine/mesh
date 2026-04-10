import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { ActivityEventRow } from './ActivityEventRow';
import { useActivityFeedStore } from '../../store/activityFeed.store';
import { Activity, Inbox } from 'lucide-react';

interface ActivityTabProps {
  taskId: string;
}

const EMPTY_ARRAY: any[] = [];

export function ActivityTab({ taskId }: Readonly<ActivityTabProps>) {
  const events = useActivityFeedStore((state) => state.taskEvents[taskId] ?? EMPTY_ARRAY);
  const hasMore = useActivityFeedStore((state) => state.taskHasMore[taskId] ?? false);
  const isLoading = useActivityFeedStore((state) => state.isLoadingTask[taskId] ?? false);
  const fetchTaskActivity = useActivityFeedStore((state) => state.fetchTaskActivity);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    void fetchTaskActivity(taskId, { page: 1, limit: 25 }, false);
  }, [taskId, fetchTaskActivity]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchTaskActivity(taskId, { page: nextPage, limit: 25 }, true);
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-3">
        {['one', 'two', 'three'].map((key) => (
          <div key={key} className="h-20 rounded-[20px] border border-border/50 bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-border/50 bg-card/30 px-5 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-muted/60 text-muted-foreground">
          <Inbox size={24} />
        </div>
        <h4 className="mt-4 font-display text-xl font-black text-foreground">No activity yet</h4>
        <p className="mt-2 text-sm font-serif italic text-muted-foreground">
          Status changes, comments, and other task events will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        <Activity size={12} />
        Task history
      </div>

      {events.map((event) => (
        <ActivityEventRow key={event.id} event={event} showProject={false} />
      ))}

      {hasMore && (
        <div className="pt-2">
          <Button size="sm" variant="outline" onClick={() => void handleLoadMore()} loading={isLoading}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
