# Cloudflare Workshop

Get started with building applications on the Cloudflare platform. In this workshop, you'll learn how to build a simple web application and deploy it to the Cloudflare platform. You'll also learn how to use Cloudflare's developer tools to monitor and manage your application.

The application allows users to upload a PDF file to Cloudflare R2. Once the file is uploaded, R2 will send a notification to Cloudflare Queues. Cloudflare Queues will then fetch the file from R2, extract the textual content, use AI to summarize the content, and store the summary back in Cloudflare R2 as a text file.

## Tech Stack
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Hono](https://hono.dev/)

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
  - Make sure you have access to [Cloudflare R2]() and [Cloudflare Queues]()
- [Node.js](https://nodejs.org) and [npm](https://npmjs.com) installed


## Getting Started

1. Clone the repository

```bash
git clone https://github.com/harshil1712/
```

2. Install the dependencies

```bash
npm install
```

3. Run the application

```bash
npm run dev
```

4. Open your browser and navigate to [http://localhost:8787](http://localhost:8787)

## Steps

### Step 1: Configure Workers Static Assets

<details>
<summary>Hint</summary>
Add the static assets binding in the `wrangler.toml` file.
</details>

Start the development server and navigate to [http://localhost:8787](http://localhost:8787). You should see the UI for the application.

### Step 2: Create an R2 Bucket

1. Create an R2 bucket using the Cloudflare dashboard or using the [Wrangler CLI]().

<details>
<summary>Hint</summary>

- <a href="https://developers.cloudflare.com/r2/get-started/#2-create-a-bucket">Dashboard</a>
- <a href="https://developers.cloudflare.com/r2/buckets/create-buckets/#bucket-level-operations">Wrangler CLI</a>

</details>

2. Add the binding to the `wrangler.toml` file.
3. Update `worker-configuration.ts` with the R2 type.
4. Update the `/api/upload` endpoint in `src/index.ts` to handle file uploads.

### Step 3: Create a Queue

1. Create a queue using the using the [Wrangler CLI](https://developers.cloudflare.com/queues/get-started/#2-create-a-queue).

```bash
npx wrangler queues create <queue-name>
```

2. Add the queue consumer binding to the `wrangler.toml` file.
   
### Step 4: Configure Event Notifications

Configure the Queue you created in the previous step to receive events from your R2 bucket.

You can do this on the [Cloudflare R2 dashboard](https://developers.cloudflare.com/r2/buckets/event-notifications/#enable-event-notifications-via-dashboard) or using the [Wrangler CLI](https://developers.cloudflare.com/r2/buckets/event-notifications/#enable-event-notifications-via-wrangler).

> Make sure use the following configuration:
> - Event type: `object-create`
> - Suffix: `pdf`

### Step 5: Enable Workers AI

1. Update the `wrangler.toml` file to add the Workers AI binding.
2. Update the `handleWorkshopQueue` function in `src/index.ts` to use Wokres AI to summarize the content of the PDF file.
3. Add the functionality to store the summary back in R2 as a text file.

> For development purposes, use the `/api/mock` endpoint to simulate event notifications. Update `sampleMessages` with the name of the PDF file you uploaded to local instance of R2.

### Step 6: Handle event notifications

Update the `queue` handler in `src/index.ts` to handle event notifications from the queue.

### Step 7: Deploy the application

Deploy the application to Cloudflare Workers using the following command:

```bash
npm run deploy
```

Navigate to the deployed application and upload a PDF file. You should see the summary of the PDF file in the UI.

## Next Steps

- Add obervability to the application.
- Push the code to GitHub and connect the repo with the Worker.
- Instead of stroing the summary in R2, store it in a [Cloudflare D1](https://developers.cloudflare.com/d1/) database.
- Create vector embeddings of the PDF file and store them in a [Vectorize](https://developers.cloudflare.com/vectorize/) to create searchable indexes.
- Add a chat interface to allow users to ask questions about the PDF file.

