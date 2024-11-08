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
      timestamp: "2024-11-08T12:33:45.399Z",
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

app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("pdfFile") as File;

  if (!file) {
    console.log("No file to upload");
    return c.json({ message: "No file to upload" }, 400);
  }

  try {
    // TODO: Upload file to R2

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
    console.log("Processing Message");
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

    // TODO: Implement Workers AI to generate a summary
    const result: AiSummarizationOutput = {
      summary: "Summary of the document",
    };
    const summary = result.summary;
    console.log(`Summary: ${summary.substring(0, 100)}...`);

    try {
      // TODO: Create a new objectKey-summary.txt file and store it in R2

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
      // TODO: Update the queue name
      case "your-queue":
        // TODO: Handle the incoming batch
        break;
      default:
        console.error("Unknown Queue");
    }
  },
};
