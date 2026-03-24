# Running Supabase Edge Functions Locally

This guide walks you through the exact steps to test and serve your Supabase Edge Functions on your local machine, fully connected to your Salesforce developer environment.

## 1. Prerequisites
Ensure you have the Supabase CLI installed and Docker Desktop running.

## 2. Setting Up Environment Variables
Your local Edge Functions need access to the Salesforce External Client App credentials to authenticate without a password (using the Client Credentials Flow).

Create a `.env.local` file inside the `supabase/` folder:

```env
# supabase/.env.local
SF_LOGIN_URL=https://your-custom-domain.my.salesforce.com
SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret

# Other required variables
CV_BUCKET=cv-uploads
N8N_WEBHOOK_URL=http://localhost:5678/webhook/test # Leave empty to skip 
ALLOWED_ORIGIN=*
```

## 3. Start the Local Supabase Stack
In your terminal, standing at the root of the project, start the local database, storage, and API gateway:

```bash
supabase start
```
*Note: You can run `supabase status` at any time to see your local `anon` key and URLs.*

## 4. Run the Edge Functions
In a separate terminal tab, tell Supabase to serve the Edge Functions. You must point it to your local environment file and instruct it not to block public requests.

```bash
supabase functions serve --no-verify-jwt --env-file supabase/.env.local
```
*Leave this terminal window open. Changes made to your `.ts` files will trigger hot-reloads automatically.*

## 5. Connecting the Vue Frontend
To make your Vue application talk to your local backend instead of the production Supabase project, edit the `.env` file in the **root** of your Vue project.

Make sure it points to `http://127.0.0.1:54321` and uses the local `anon` key (run `supabase status` to get the key):

```env
# .env (in the root directory)
VUE_APP_SUPABASE_URL=http://127.0.0.1:54321
VUE_APP_SUPABASE_ANON_KEY=eyJhbGci...your_local_key_here
```

Restart your Vue server (`npm run serve`) to apply the new local environment variables.

## 6. Testing with Curl
You can easily test if the Edge Functions and Salesforce connection are working without touching the frontend:

```bash
curl -i -X GET "http://127.0.0.1:54321/functions/v1/get-job-offers"
```
If configured correctly, this will return a JSON array containing all your active `JobOffer__c` records!
