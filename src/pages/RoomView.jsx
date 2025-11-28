import { useParams } from 'react-router-dom';
import { useRoomState } from '../state/useRoomState';
import RoomScene from '../state/pixi/RoomScene';
import { connectSocket } from '../state/socket';

export default function RoomView() {
  const { roomId } = useParams();
  const room = useRoomState(roomId);

  if (!room) return <div>Loading room...</div>;

  const handleTurn = (dir) => {
    connectSocket.emit('intent:turn', { roomId, direction: dir });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <RoomScene
        views={room.state.views}
        viewIndex={room.state.viewIndex}
      />

      {/* Controls */}
      <button
        onClick={() => handleTurn("LEFT")}
        style={{
          position: "absolute", left: 20, top: "50%",
          padding: 10, fontSize: 18
        }}
      >
        ⟵ Left
      </button>

      <button
        onClick={() => handleTurn("RIGHT")}
        style={{
          position: "absolute", right: 20, top: "50%",
          padding: 10, fontSize: 18
        }}
      >
        Right ⟶
      </button>
    </div>
  );
}
