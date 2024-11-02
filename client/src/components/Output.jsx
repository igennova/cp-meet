import { useEffect, useState } from "react";
import { Box, Button, Text, useToast } from "@chakra-ui/react";
import { executeCode } from "../api";
import axios from "axios";
import { getroute, questionroute } from "@/api/ApiRoutes";
import { language_ID } from "@/constants";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Adjust the URL as needed

const Output = ({ editorRef, language }) => {
  const toast = useToast();
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    socket.on("victory", (data) => {
      toast({
        title: "Victory!",
        description: data.message,
        status: "success",
        duration: 6000,
      });
    });

    socket.on("defeat", (data) => {
      toast({
        title: "Defeat!",
        description: data.message,
        status: "error",
        duration: 6000,
      });
    });

    return () => {
      socket.off("victory");
      socket.off("defeat");
    };
  }, [toast]);

  const runCode = async () => {
    const source_code = editorRef.current.getValue();
    if (!source_code) return;

    const language_id = language_ID[language];

    const response = await axios.get(questionroute);
    const problem_id = response.data.question_id;

    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, source_code);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.log(error);
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to run code",
        status: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box w="50%">
      <Text mb={2} fontSize="lg">Output</Text>
      <Button
        variant="outline"
        colorScheme="green"
        mb={4}
        isLoading={isLoading}
        onClick={runCode}
      >
        Submit
      </Button>
      <Box
        height="75vh"
        p={2}
        color={isError ? "red.400" : ""}
        border="1px solid"
        borderRadius={4}
        borderColor={isError ? "red.500" : "#333"}
      >
        {output
          ? output.map((line, i) => <Text key={i}>{line}</Text>)
          : 'Click "Run Code" to see the output here'}
      </Box>
    </Box>
  );
};

export default Output;
