import { useEffect, useState } from 'react';
import { connectSocket } from './socket';

export function useRoomState(roomId) {
  const [roomState, setRoomState] = useState(null);

  useEffect(() => {
    // Request snapshot
    connectSocket.emit('join_room', { roomId }, (res) => {
      if (res.ok) {
        setRoomState(res.snapshot);
      }
    });

    // Listen for view changes
    connectSocket.on('state:viewChanged', (delta) => {
      setRoomState((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          viewIndex: delta.viewIndex,
        }
      }));
    });

    return () => {
      connectSocket.off('state:viewChanged');
      connectSocket.emit('leave_room', { roomId });
    };
  }, [roomId]);

  return roomState;
}
