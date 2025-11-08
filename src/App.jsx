import { Routes, Route, Navigate } from "react-router-dom";
import TopBar from "./components/Layout/TopBar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import StartPage from "./pages/StartPage";
import Join from "./pages/Join";
import RoomSelection from "./pages/RoomSelection";
import Waiting from "./pages/Waiting";
import Room from "./pages/Room";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import React, { useEffect } from "react";
import { socket } from "./state/socket";

export default function App() {
    useEffect(() => {
            const onWelcome = (msg) => console.log("server welcome:", msg);
            socket.on("welcome", onWelcome);

            return () => {
              socket.off("welcome", onWelcome);
            };
          }, []);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-green-950 via-green-900 to-black" />
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/join" element={<Join />} />
        <Route path="/rooms" element={<RoomSelection />} />
        <Route path="/waiting/:lobbyId" element={<Waiting />} />
        <Route path="/room/:id" element={<Room />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  );
}
