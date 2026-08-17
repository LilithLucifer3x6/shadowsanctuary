require('dotenv').config();
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function run() {
  console.log("Testing replicate with google/nano-banana-pro...");
  try {
    const output = await replicate.run(
      "google/nano-banana-pro",
      {
        input: {
          prompt: "test"
        }
      }
    );
    if (output && output[Symbol.asyncIterator]) {
        let text = '';
        for await (const chunk of output) {
            text += chunk;
        }
        console.log("Stream Output:", text);
    } else {
        console.log("Output:", output);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
