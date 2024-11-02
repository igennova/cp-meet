import React, { useEffect, useState } from "react";
import axios from "axios";
import { getroute, questionroute } from "@/api/ApiRoutes";
import { Box, Text, Button } from "@chakra-ui/react";
import { language_ID } from "@/constants";
import { io } from "socket.io-client";

const RandomQuestion = ({ editorRef, language, socketInfo }) => {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Establish socket connection and set up listeners
  useEffect(() => {
    const newSocket = io("http://localhost:5000"); // Adjust to your server's address
    setSocket(newSocket);

    // Handle incoming events
    newSocket.on("results", (data) => {
      console.log("Received results from server:", data);
      // You can set the results in the state to display to the user
    });

    newSocket.on("gameResult", (data) => {
      console.log("Game result:", data);
      // Update UI with the game result message
    });

    newSocket.on("error", (data) => {
      console.error("Error from server:", data);
      setError(data.message);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch random question from the backend
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log("Question route:", questionroute); // Check the API route
        const response = await axios.get(questionroute);
        console.log("API Response:", response.data); // Log the response
        setQuestion(response.data);
      } catch (error) {
        setError("Error fetching question. Please try again.");
        console.error("Error fetching question:", error);
      }
    };

    fetchQuestion();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  const runCode = async () => {
    const source_code = editorRef.current.getValue();
    if (!source_code) return;

    const language_id = language_ID[language];
    const problem_id = question?.question_id; // Assuming question ID is in the question state

    try {
      // Emit code submission event via socket
      socket.emit("codeSubmission", {
        myId: socketInfo.myId,
        opponentId: socketInfo.opponentId,
        source_code,
        language_id,
        problem_id,
      });

      const response = await axios.post(getroute, {
        problem_id,
        source_code,
        language_id,
      });
      console.log("Response from backend:", response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Box w="50%">
      <Text mb={2} fontSize="lg">
        Random Question
      </Text>
      <Button variant="outline" colorScheme="green" mb={4} onClick={runCode}>
        Submit
      </Button>
      <Box
        height="75vh"
        p={2}
        color={error ? "red.400" : ""}
        border="1px solid"
        borderRadius={4}
        borderColor={error ? "red.500" : "#333"}
      >
        {question ? (
          <div>
            <h3>{question.title}</h3>
            <p>{question.description}</p>
            <pre>Sample Input: {JSON.stringify(question.input_format, null, 2)}</pre>
            <pre>Sample Output: {JSON.stringify(question.output_format, null, 2)}</pre>
            <pre>Constraints: {JSON.stringify(question.constraints, null, 2)}</pre>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Box>
    </Box>
  );
};

export default RandomQuestion;
