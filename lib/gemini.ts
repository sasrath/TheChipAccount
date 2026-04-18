import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "./log";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(key);
}

export async function streamGemini(
  systemInstruction: string,
  userMessage: string
): Promise<ReadableStream<string>> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
  });

  const start = Date.now();

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
  });

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(text);
          }
        }
        log.info(`Gemini stream completed in ${Date.now() - start}ms`);
      } catch (err) {
        log.error("Gemini stream error:", err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}

export async function streamGeminiChat(
  systemInstruction: string,
  history: Array<{ role: "user" | "model"; content: string }>,
  question: string
): Promise<ReadableStream<string>> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
  });

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });

  const start = Date.now();
  const result = await chat.sendMessageStream(question);

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(text);
          }
        }
        log.info(`Gemini chat stream completed in ${Date.now() - start}ms`);
      } catch (err) {
        log.error("Gemini chat stream error:", err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
