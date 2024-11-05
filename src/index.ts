import { Hono } from "hono";
import { extractText, getDocumentProxy } from "unpdf";

interface QueueMessage {
  account: string;
  bucket: string;
  eventTime: string;
  action: string;
  object: {
    key: string;
    size: number;
    eTag: string;
  };
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

const sampleMessages: MessageBatch<QueueMessage> | any = {
  messages: [
    {
      attempts: 1,
      body: {
        account: "abcd1234",
        bucket: "BUCKET_NAME",
        eventTime: "2024-11-08T12:33:45.296Z",
        action: "PutObject",
        object: {
          key: "Workshop PDF.pdf",
          size: 4384742,
          eTag: "some-etag",
        },
      },
      timestamp: "2024-11-08T12:33:45.296Z",
      id: "123456abcdef",
    },
  ],
};

app.get("/", (c) => {
  return c.text("Hello Nordic DevOps Day!");
});

app.get("/api/files", async (c) => {
  const files = await c.env.MY_BUCKET.list();
  return c.json(files);
});

const clients = new Set<Response>();

app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("pdfFile") as File;

  if (!file) {
    console.log("No file to upload");
    return c.json({ message: "No file to upload" }, 400);
  }

  try {
    // Upload to R2
    await c.env.MY_BUCKET.put(file.name, file);
    return c.json({ message: "File uploaded successfully" }, 201);
  } catch (error) {
    console.error("Error uploading file:", error);
    return c.json({ message: "Error uploading file" }, 500);
  }
});

app.get("/api/mock", async (c) => {
  const batch = sampleMessages;
  try {
    return c.json(await handleWorkshopQueue(batch, c.env));
  } catch (error) {
    console.error("Error processing messages:", error);
    return c.json({ message: "Error processing messages" }, 500);
  }
});

const handleWorkshopQueue = async (
  batch: MessageBatch<QueueMessage>,
  env: CloudflareBindings
) => {
  for (const message of batch.messages) {
    console.log(`Processing message: ${message.id}`);
    const { body } = message;
    const objectKey = body.object.key;

    //fetch the file from R2
    const file = await env.MY_BUCKET.get(objectKey);
    if (!file) {
      console.error("File not found in R2");
      return { message: "File not found in R2" };
    }

    const buffer = await file.arrayBuffer();
    const document = await getDocumentProxy(new Uint8Array(buffer));

    const { text } = await extractText(document, { mergePages: true });
    console.log(`Extracted text: ${text.substring(0, 50)}...`);

    // Implement Workers AI to generate a summary
    const result: AiSummarizationOutput = await env.AI.run(
      "@cf/facebook/bart-large-cnn",
      {
        input_text: text,
      }
    );
    const summary = result.summary;
    console.log(`Summary: ${summary.substring(0, 100)}...`);

    // Store the summary in R2
    try {
      const upload = await env.MY_BUCKET.put(
        `${objectKey}-summary.txt`,
        summary,
        {
          httpMetadata: {
            contentType: "text/plain",
          },
        }
      );
      console.log(`Summary added to the R2 bucket: ${upload.key}`);
      return { message: "Summary added to the R2 bucket" };
    } catch (error) {
      console.error(`Error uploading summary to R2 bucket: ${error}`);
      throw new Error(`Error uploading summary to R2 bucket: ${error}`);
    }
  }
};
export default {
  fetch: app.fetch,
  queue: async (batch: MessageBatch<QueueMessage>, env: CloudflareBindings) => {
    // Handle multiple queues. Add more cases for other queues
    switch (batch.queue) {
      case "devops-workshop":
        await handleWorkshopQueue(batch, env);
        break;
      default:
        console.error("Unknown Queue");
    }
  },
};
