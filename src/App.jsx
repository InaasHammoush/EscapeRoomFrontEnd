import { Routes, Route, Navigate } from "react-router-dom";
import TopBar from "./components/Layout/TopBar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import StartPage from "./pages/StartPage";
import Join from "./pages/Join";
import RoomSelection from "./pages/RoomSelection";
import Waiting from "./pages/Waiting";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import React, { useEffect } from "react";
import { getSocket } from "./state/socket";
import SoloRound from "./pages/SoloRound";
import RoomPage from "./pages/RoomPage";
import SoloSelect from "./pages/SoloSelect";

export default function App() {
    useEffect(() => {
      const s = getSocket();
      if (!s) return; // RoomPage/Waiting will connect
      const onWelcome = (msg) => console.log("server welcome:", msg);
      s.on("welcome", onWelcome);
      return () => s.off("welcome", onWelcome);
    }, []);


  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-green-950 via-green-900 to-black" />
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/join" element={<Join />} />
        <Route path="/rooms" element={<RoomSelection />} />
        <Route path="/waiting/:lobbyId" element={<Waiting />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/404" element={<NotFound />} />


        {/* Single Player Mode */}
        <Route path="/solo/select" element={<SoloSelect />} />
        <Route path="/solo" element={<SoloRound />} />
        <Route path="/solo/:sessionId/room/:roomId" element={<RoomPage mode="solo" />} />

        {/* Multiplayer Mode */}
        <Route path="/coop/:sessionId/room/:roomId/role/:role" element={<RoomPage mode="coop" />} />
      </Routes>
    </div>
  );
}
