# Backend

Flask api for the tutoring site contact form. Takes inquiries from the form, verifies Cloudflare Turnstile, and writes them to Postgres. Runs on AWS Lambda behind API Gateway.

## Stack

- Python 3.12 + Flask
- PostgreSQL (AWS RDS or any hosted Postgres)
- AWS Lambda + API Gateway, deployed with SAM

## Setup

Install deps:

    pip install -r requirements.txt

Create the table:

    psql "$DATABASE_URL" -f schema.sql

Set env vars (or copy `.env.example` to `.env` and source it):

    export DATABASE_URL=postgres://user:pass@host:5432/tutoring
    export TURNSTILE_SECRET=0x...
    export ALLOWED_ORIGIN=https://yourdomain.com

Run locally:

    python app.py

## Deploy

Needs the AWS SAM CLI.

    sam build
    sam deploy --guided

Fill in `DatabaseUrl`, `TurnstileSecret`, `AllowedOrigin` at the prompts. The api base url is printed at the end — append `/inquiry` and put it in `docs/script.js` as `CONFIG.apiURL`.

## Endpoint

    POST /inquiry
    Content-Type: application/json

    {
      "first_name": "Jane",
      "last_name":  "Smith",
      "email":      "jane@example.com",
      "phone":      "07123456789",
      "turnstile_token": "..."
    }

Returns `201 {"ok": true}` on success, `400 {"error": "..."}` on bad input or failed Turnstile. Rate limited to 5 requests per minute per IP.

## Notes

- Rate limiter uses in-memory storage, which resets on Lambda cold starts. Fine for low traffic; swap for Redis if this ever matters.
- New psycopg2 connection per request. Lambda concurrency is low so connection pooling isn't worth the code.
- Parameterised queries throughout. No string concat into SQL.
