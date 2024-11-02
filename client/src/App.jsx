import React, { useState } from "react"; // Make sure to import useState
import { Navbar, Footer } from "./components";
import Matchmaking from "./components/sockets/usermatch";
import { Box } from "@chakra-ui/react";
import { CodeEditor } from "./components";
import RandomQuestion from "./components/questions/question";

const App = () => {
  const [socketInfo, setSocketInfo] = useState({ myId: null, opponentId: null });

  return (
    <>
      <div>
        <Navbar />
        <Matchmaking setSocketInfo={setSocketInfo} />
        {/* <RandomQuestion /> */}
        <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
        {socketInfo.myId && socketInfo.opponentId && (
        <div>
          <h2>Your Socket ID: {socketInfo.myId}</h2>
          <h2>Opponent Socket ID: {socketInfo.opponentId}</h2>
        </div>
      )}
          <CodeEditor />
        </Box>
      </div>
      <Footer />
    </>
  );
};

export default App;
