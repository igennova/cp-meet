import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Matchmaking = ({ setSocketInfo }) => { // Accept setSocketInfo as a prop
  const [isMatched, setIsMatched] = useState(false);
  const [opponentId, setOpponentId] = useState(null); // State to track opponent ID

  useEffect(() => {
    // Join the matchmaking queue when the component mounts
    socket.emit("joinQueue");

    // Listen for matchFound event
    socket.on("matchFound", ({ roomId, opponentId }) => {
      alert(
        `You have been matched with user: ${opponentId} in room: ${roomId}`
      );
      setIsMatched(true); // Update state to indicate match found
      setOpponentId(opponentId); // Store opponent ID
      setSocketInfo({ myId: socket.id, opponentId }); // Pass socket IDs up to the parent
    });

    // Cleanup on unmount
    return () => {
      socket.off("matchFound"); // Remove the event listener
    };
  }, []);

  return (
    <div className="p-5">
      {isMatched ? (
        <h1>Done! You are matched!</h1>
      ) : (
        <>
          <h1>Welcome to CP Buddy!</h1>
          <p>Waiting for a match...</p>
        </>
      )}
    </div>
  );
};

export default Matchmaking;
