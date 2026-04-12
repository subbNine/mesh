import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { IUser } from '@mesh/shared';
import { getUserColor } from '../../lib/user-color';

interface MentionListProps {
  items: IUser[];
  command: (props: { id: string; label: string }) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({ id: item.id, label: `${item.firstName} ${item.lastName}` });
    }
  };

  const upHandler = () => {
    setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-zinc-200 shadow-2xl rounded-2xl p-3 text-sm text-zinc-500 font-medium">
        No members found
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-2xl border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden min-w-[220px] p-1.5 animate-in fade-in zoom-in-95 duration-200">
      <div className="px-3 py-2 border-b border-zinc-50 mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mention member</span>
      </div>
      {props.items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 rounded-xl ${
            index === selectedIndex 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
              : 'hover:bg-zinc-50 text-zinc-700'
          }`}
        >
          <div 
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${index === selectedIndex ? 'bg-white/20 text-white' : 'text-white'}`}
            style={{ backgroundColor: index === selectedIndex ? undefined : getUserColor(item.id) }}
          >
            {item.firstName?.[0]}{item.lastName?.[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate tracking-tight">{item.firstName} {item.lastName}</span>
            <span className={`text-[10px] truncate font-medium ${index === selectedIndex ? 'text-white/70' : 'text-zinc-400'}`}>@{item.userName}</span>
          </div>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';
