# Cloudflare Workshop

Get started with building applications on the Cloudflare platform. In this workshop, you'll learn how to build a simple web application and deploy it to the Cloudflare platform. You'll also learn how to use Cloudflare's developer tools to monitor and manage your application.

You will build an application that allows users to upload a PDF file to Cloudflare R2. Once the file is uploaded, R2 will send a notification to Cloudflare Queues. Cloudflare Queues will then fetch the file from R2, extract the textual content, use AI to summarize the content, and store the summary back in Cloudflare R2 as a text file.

## Tech Stack
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Hono](https://hono.dev/)

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
  - Make sure you have access to Cloudflare R2 and Cloudflare Queues
- [Node.js](https://nodejs.org) and [npm](https://npmjs.com) installed


## Getting Started

1. Clone the repository

```bash
git clone https://github.com/harshil1712/cloudflare-pdf-summarizer-workshop.git
```

2. Install the dependencies

```bash
cd cloudflare-pdf-summarizer-workshop
npm install
```

3. Update `name` in `wrangler.toml`
- Replace `<FIRST_NAME+LAST_NAME>` with your first name and last name.
> When deploying in the same organisation, this will ensure that there are no conflicts.

4. Run the application

```bash
npm run dev
```

5. Open your browser and navigate to [http://localhost:8787](http://localhost:8787)

## Steps

### Step 1: Configure Workers Static Assets

You can build full-stack applications on Cloudflare Workers. To do that, you need to configure the [Static Assets](https://developers.cloudflare.com/workers/static-assets/). This will server the front-end from directory you mention in the `wrangler.toml` file.

<details>
<summary>Hint</summary>
Add the static assets binding in the wrangler.toml file. Check the <a href="https://developers.cloudflare.com/workers/static-assets/">documnetation</a> to learn more.
</details>

Start the development server and navigate to [http://localhost:8787](http://localhost:8787). You should see the font-end for the application.

### Step 2: Create an R2 Bucket

R2 is an object storage service that you can use to store your objects. In this workshop, you will use R2 objects to store files.

1. Create an R2 bucket using the Cloudflare dashboard or using the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/).

> NOTE: Use the format `<firstname-lastname-bucket>` (replace `<firstname-lastname>` with your first and last name, respectively) to name your R2 bucket. This will prevent conflicts when creating buckets with the same name.

<details>
<summary>Hint</summary>

- <a href="https://developers.cloudflare.com/r2/get-started/#2-create-a-bucket">Dashboard</a>
- <a href="https://developers.cloudflare.com/r2/buckets/create-buckets/#bucket-level-operations">Wrangler CLI</a>

</details>

2. Add the binding to the `wrangler.toml` file.
(The types are already configured for you. Check `worker-configuration.d.ts`.)
3. Update the `/api/upload` endpoint in `src/index.ts` to handle file uploads.

<details>
<summary>Hint</summary>

- Use the <a href="https://developers.cloudflare.com/r2/api/workers/workers-api-usage/#4-access-your-r2-bucket-from-your-worker">Workers API</a>
- Make sure you update the Key Name, and pass the correct body (in this case file).

</details>

- To test this, start the development server:

```bash
npm run dev
```

> When running the app locally, the file gets uploaded to the local instance of R2! This means that you are not storing the file on the cloud when building locally. This is only true if you are using the Workers API. Execute the `npm run dev` command with the `--remote` flag to interact with R2 on the cloud.

### Step 3: Create a Queue

Cloudflare Queues is a flexible messaging queue that allows you to queue messages for asynchronous processing.

1. Create a queue using the [Wrangler CLI](https://developers.cloudflare.com/queues/get-started/#2-create-a-queue).

> NOTE: Use the format `<firstname-lastname>-queue` (replace `<firstname-lastname>` with your first and last name, respectively) to name your Queue. This will prevent conflicts when creating Queues with the same name in an account.

```bash
npx wrangler queues create <firstname-lastname>-queue
```

2. Add the queue consumer binding to the `wrangler.toml` file.

You will be consuming messages from the queue, and not producing (R2 Event notifications will produce the message for you).

<details>
<summary>Hint</summary>

- Check the <a href="https://developers.cloudflare.com/queues/get-started/#connect-the-consumer-worker-to-your-queue">documentation</a> to learn more.
- Make sure to use the correct Queue name.

</details>
   
### Step 4: Configure Event Notifications

Configure the Queue you created in the previous step to receive events from your R2 bucket. 

You can do this on the [Cloudflare R2 dashboard](https://developers.cloudflare.com/r2/buckets/event-notifications/#enable-event-notifications-via-dashboard) or using the [Wrangler CLI](https://developers.cloudflare.com/r2/buckets/event-notifications/#enable-event-notifications-via-wrangler).

> Make sure use the following configuration:
> - Event type: `object-create`
> - Suffix: `pdf`

Event type tells R2 for what events it should trigger a message to the queue. Here, it will trigger notification when an object gets created (uploaded), or overwritten.

Suffix allows you to add a "filter" to the notification. Using suffix you tell R2 to trigger a notification only for the object that ends with `pdf` in their name.

### Step 5: Enable Workers AI

Workers AI allows you to run machine learning models, on the Cloudflare network, from your own code — whether that be from Workers, Pages, or anywhere via the Cloudflare API.

In this workshop you use Workers AI to generate the summary of the text.

1. Update the `wrangler.toml` file to add the Workers AI binding.
2. Update the `handleWorkshopQueue` function in `src/index.ts` to use Workers AI to summarize the content of the PDF file.

<details>
<summary>Hint</summary>

- Use the <a href="https://developers.cloudflare.com/workers-ai/models/bart-large-cnn/">Bart</a> model.
- You can view all the available models on the <a href="https://developers.cloudflare.com/workers-ai/models/">documentation page</a>

</details>

1. Update the `handleWorkshopQueue` function to store the summary back in R2 as a text file. Make sure to append the key name with `-summary.txt`. This will create a text file with the summary generated by AI.

> For development purposes, use the `/api/mock` endpoint to simulate event notifications. If you are using a different PDF file other than `Workshop PDF.pdf`, make sure to update the `sampleMessage` with the correct file name (`key`).

- To test this, start the development server and make a `GET` request to `http://localhost:8787/api/mock`

```bash
npm run dev
```

### Step 6: Handle event notifications

You already have a function (`handleWorkshopQueue`) that takes in the `batch` and `env`. This function handles the messages for you.

Update the `queue` handler in `src/index.ts` to handle event notifications using the `handleWorkshopQueue` function. Make sure to update the name of the queue.

### Step 7: Deploy the application

Deploy the application to Cloudflare Workers using the following command:

```bash
npm run deploy
```

Navigate to the deployed application and upload a PDF file. You should see the uploaded PDF file in the front-end. If you refresh the page, you should see the summary file as file.

## Next Steps

- Add [obervability](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) to the application.
- Push the code to GitHub and connect the repo with the Worker.
- Instead of stroing the summary in R2, store it in a [Cloudflare D1](https://developers.cloudflare.com/d1/) database.
- Create vector embeddings of the PDF file and store them in a [Vectorize](https://developers.cloudflare.com/vectorize/) to create searchable indexes.
- Add a chat interface to allow users to ask questions about the PDF file.

## Contact

If you have any questions, or feedback feel free to open up a new issue on GitHub.

Also, join the [Cloudflare Discord Server](https://discord.cloudflare.com) to interact with the community.

You can also connect with [Harshil Agrawal](https://linkedin.com/in/harshil1712).

