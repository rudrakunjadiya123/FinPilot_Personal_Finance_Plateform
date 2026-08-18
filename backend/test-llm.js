require("dotenv").config();
const { getChatCompletion } = require("./src/services/llm.service.js");

async function run() {
  try {
    const res = await getChatCompletion("hello", "", [], []);
    console.log("SUCCESS:", res);
  } catch (err) {
    console.error("FAILED:", err.message);
    if (err.response) {
      console.error(err.response);
    }
  }
}

run();
