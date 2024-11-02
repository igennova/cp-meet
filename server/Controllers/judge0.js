import Question from "../Models/question.js"; // Adjust path if needed
import fetch from "node-fetch"; // Ensure you have this package installed
import * as dotenv from "dotenv";
import { getactiveRoom } from "../index.js";
dotenv.config();

// const arr = {
//     "C++ (GCC 14.1.0)": 105,
//     "Python (3.12.5)": 100
// };

const getcode = async (req, res) => {
  const { problem_id, source_code, language_id } = req.body;

  const io = req.app.get("io");
  const userSocket = io.sockets.sockets.get(req.sessionID);
  const activeRooms = getactiveRoom();
  console.log(activeRooms)
  console.log(userSocket)

  if (!userSocket) {
    res.status(404).json({ message: "Socket not found" });
    return;
  }

  // Retrieve rooms and exclude user's own socket ID
  const rooms = Array.from(userSocket.rooms);
  const roomId = rooms.find(room => room !== userSocket.id);

  if (!roomId) {
    userSocket.emit("error", { message: "You are not in a room" });
    return;
  }

  // if (!problem_id || !source_code || !language_id) {
  //   userSocket.emit("error", { message: "Missing problem_id, source_code, or language_id" });
  //   return;
  // }

  // try {
  //   const problemData = await Question.findOne({ question_id: problem_id });
  //   if (!problemData) {
  //     userSocket.emit("error", { message: "Problem not found" });
  //     return;
  //   }

  //   const submissions = problemData.test_cases.map(testCase => ({
  //     language_id,
  //     source_code: Buffer.from(source_code).toString("base64"),
  //     stdin: Buffer.from(testCase.input.join("\n")).toString("base64"),
  //   }));

  //   const expectedOutputs = problemData.test_cases.map(testCase => testCase.expected_output);

  //   const results = await Promise.all(
  //     submissions.map((submission, index) =>
  //       submitCodeAndCheckResult(submission, expectedOutputs[index])
  //     )
  //   );

  //   const allPassed = results.every(result => result.status === "Right Answer");

  //   if (allPassed) {
  //     userSocket.emit("gameResult", { status: "win", message: "You win!" });
      
  //     const opponentId = Object.keys(activeRooms).find(id => id !== userSocket.id && activeRooms[id] === roomId);
  //     if (opponentId) {
  //       const opponentSocket = io.sockets.sockets.get(opponentId);
  //       if (opponentSocket) {
  //         opponentSocket.emit("gameResult", { status: "lose", message: "You lost!" });
  //       }
  //     }
  //   }

  //   userSocket.emit("results", {
  //     message: "Submissions processed successfully",
  //     results,
  //   });
  // } catch (error) {
  //   console.error("Error:", error);
  //   userSocket.emit("error", { message: "Server error", error: error.message });
  // }
};



// Modify submitCodeAndCheckResult to accept expectedOutput for comparison
const submitCodeAndCheckResult = async (submission, expectedOutput) => {
  const url =
    "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&fields=*";

  const options = {
    method: "POST",
    headers: {
      "x-rapidapi-key": process.env.JUDGE_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  };

  try {
    // Send the submission
    const response = await fetch(url, options);
    const submissionData = await response.json();

    // Extract submission ID
    const submissionId = submissionData.token;

    // Check the submission result and compare it with the expected output
    return await checkSubmissionResult(submissionId, expectedOutput);
  } catch (error) {
    console.error("Error submitting code:", error);
    return { error: "Error submitting code" };
  }
};

// Modify checkSubmissionResult to accept expectedOutput for comparison
const checkSubmissionResult = async (submissionId, expectedOutput) => {
  const resultUrl = `https://judge0-ce.p.rapidapi.com/submissions/${submissionId}?base64_encoded=true&fields=*`;

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.JUDGE_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
  };

  try {
    let resultData;

    while (true) {
      const response = await fetch(resultUrl, options);
      resultData = await response.json();

      const statusId = resultData.status.id;

      if (statusId === 3) {
        // Compare Judge0 output with expected output
        const decodedOutput = atob(resultData.stdout).trim();
    
        // Trim the expected output as well
        const trimmedExpectedOutput = expectedOutput.trim();
    
        // Compare Judge0 output with expected output
        const isCorrect = decodedOutput === trimmedExpectedOutput;
        console.log(isCorrect ? "Correct" : "Wrong");
        console.log("Expected Output:", trimmedExpectedOutput);
        console.log("Judge0 Output:", decodedOutput);
    
        return {
            status: isCorrect ? "Right Answer" : "Wrong Answer",
            output: decodedOutput,
            expected_output: trimmedExpectedOutput,
        };
      } else if (statusId === 5) {
        return {
          status: "Wrong Answer",
          expected_output: expectedOutput,
          your_output: resultData.stdout,
        };
      } else if (statusId === 6) {
        return { status: "Time Limit Exceeded" };
      } else if (statusId >= 7) {
        return { status: "Error", description: resultData.status.description };
      }

      // If still in queue or running, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("Error checking submission result:", error);
    return { error: "Error checking submission result" };
  }
};


export default getcode;
