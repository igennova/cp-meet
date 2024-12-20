import React, { useEffect, useState } from "react";
import axios from "axios";
import { routes, language_ID } from "@/constants";
import { Box, Text, Button } from "@chakra-ui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RandomQuestion = ({ editorRef, language, socket, roomId, userName }) => {
  const [question, setQuestion] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [problem_id, setProblem_id] = useState(null);
  const [fetchError, setFetchError] = useState(false); // New state to track fetch error
  const toastOptions = {
    position: "bottom-right",
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };
  useEffect(() => {
    const fetchQuestion = async (roomId) => {
      try {
        const problemId = (roomId%5)+1;
        const response = await axios.get(routes.questionroute,{
          params: { problemId },
        });
        console.log(problemId)
        setProblem_id(response.data.question_id);
        setQuestion(response.data);
      } catch (error) {
        console.error("Error fetching question:", error);
        toast.error("Error fetching question. Please try again.", toastOptions);
        setFetchError(true);
      }
    };

    fetchQuestion(roomId);
  }, []);

  useEffect(() => {
    socket.on("gameResult", (data) => {
      if (data.winner && data.winner.name === userName) {
        setGameResult("You won the game!");
        toast.success("Congratulations! You won the game!", toastOptions);
      } else {
        setGameResult("You lost the game.");
        toast.info("You lost the game.");
      }
    });
    socket.on("results", (data) => {
      if (data.message === "Hidden test case failed") {
        toast.warning("Hidden test case failed.",toastOptions);
      } else if (data.message === "Time Limit Exceeded on some test cases") {
        toast.error("Time Limit Exceeded on some test cases.",toastOptions);
      }
    });


    return () => {
      socket.off("results");
      socket.off("gameResult");
    };
  }, [socket, userName]);

  const runCode = () => {
    const source_code = editorRef.current.getValue();
    if (!source_code) {
      toast.error("Please enter your code to submit.", toastOptions);
      return;
    }
    const language_id = language_ID[language];

    socket.emit("submitCode", {
      roomId,
      userName,
      problem_id: problem_id,
      source_code,
      language_id,
    });
  };

  return (
    <Box w="50%">
      <Text mb={2} fontSize="lg">
        Random Question Hello {userName}
      </Text>
      <Button
        variant="outline"
        colorScheme="green"
        mb={4}
        onClick={runCode}
        disabled={!!gameResult} // Disable button if game is over
      >
        Submit
      </Button>
      <Box
        height="75vh"
        p={2}
        color={fetchError ? "red.400" : ""} // Use fetchError to set color
        border="1px solid"
        borderRadius={4}
        borderColor={fetchError ? "red.500" : "#333"} // Use fetchError to set borderColor
      >
        {gameResult ? ( // Display game result message
          <Text fontSize="xl" color="green.500" textAlign="center">
            {gameResult}
          </Text>
        ) : question ? (
          <div>
            <Text className="text-close-to-white" mb={4} fontSize="2xl">
              {question.question_id}. {question.title}
            </Text>
            <Text className="text-white" mb={3}>
              {question.description}
            </Text>
            <Text className="text-white">Example:</Text>
            <Text className="text-white" ml="5">
              Input:
            </Text>
            {question.example.input.map((line, index) => (
              <Text className="text-white" mb="3" key={index} ml="10">
                {line}
              </Text>
            ))}
            <Text className="text-white" ml="5">
              Output:
            </Text>
            <Text className="text-white" mb="3" ml="10">
              {question.example.output}
            </Text>
            <Text className="text-white">Sample Input:</Text>
            {question.input_format.map((line, index) => (
              <Text className="text-white" mb="3" key={index} ml="5">
                {line}
              </Text>
            ))}

            <Text className="text-white">Sample Output:</Text>
            <Text className="text-white" mb="3" ml="5">
              {question.output_format}
            </Text>

            <Text className="text-white">Constraints:</Text>
            <Text className="text-white" ml="5">
              n: [{question.constraints.n_min}, {question.constraints.n_max}]
            </Text>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Box>
      <ToastContainer />
    </Box>
  );
};

export default RandomQuestion;
