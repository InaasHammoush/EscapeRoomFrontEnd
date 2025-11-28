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
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RoomView from "./pages/RoomView";

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
        <video
                autoPlay
                loop
                muted
                playsInline
                className="fixed inset-0 w-full h-full object-cover -z-10"
              >
                <source src="/Loop door.mp4" type="video/mp4" />
        </video>
        <div className="fixed inset-0 bg-black/50 -z-10"></div>

      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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
        <Route path="/solo/:sessionId/room/:roomId" element={<RoomView mode="solo" />} />
        {/* <Route path="/solo/:sessionId/room/:roomId/view" element={<RoomView />} /> */}

        {/* Multiplayer Mode */}
        <Route path="/coop/:sessionId/room/:roomId/role/:role" element={<RoomPage mode="coop" />} />
      </Routes>
    </div>
  );
}
