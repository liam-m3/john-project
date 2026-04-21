# GCSE Math Tutoring - Simplified

A static marketing site for a GCSE maths tutor, with a small Python backend that collects inquiries from the contact form. Built as a client project — iterated with him through requirements and feedback over several rounds before he decided not to launch. The site and infrastructure are complete and deployed.

## Tech Stack

- **Frontend:** vanilla HTML / CSS / JS in `docs/`
- **Backend:** Python 3.13 + Flask on AWS Lambda, fronted by API Gateway (HTTP API)
- **Database:** PostgreSQL on Neon
- **Infrastructure-as-code:** AWS SAM (CloudFormation)
- **Bot protection:** Cloudflare Turnstile (verified server-side)
- **Hosting:** Vercel (frontend), AWS (backend)

## Inquiry Flow

1. User fills out the contact form.
2. Turnstile widget runs in the browser and returns a token proving the submitter is human.
3. Browser posts JSON (`first_name`, `last_name`, `email`, `phone`, `turnstile_token`) to API Gateway.
4. API Gateway routes to the Lambda, which runs the Flask app.
5. Flask validates the input, calls Cloudflare's `siteverify` endpoint to confirm the token is real, then inserts a row into Postgres with a parameterised query.
6. Returns `201 {"ok": true}` — frontend shows the thank-you screen.

## Project Structure

```
docs/                  # static site — deployed on Vercel
├── index.html
├── style.css
├── script.js
├── images/
├── icons/
└── videos/

backend/               # Python API — deployed on AWS Lambda
├── app.py             # Flask app + Lambda handler
├── schema.sql         # inquiries table
├── template.yaml      # SAM CloudFormation template
├── requirements.txt
├── .env.example
└── README.md          # backend-specific setup
```

## Environment Variables (Lambda)

```
DATABASE_URL       Neon Postgres connection string
TURNSTILE_SECRET   Cloudflare Turnstile secret key
ALLOWED_ORIGIN     Frontend origin, e.g. https://tutoring-project-one.vercel.app
```

All three are passed as SAM parameters on deploy. Nothing sensitive is committed.

## Database Schema

One table, `inquiries`:

- `id` (SERIAL PK)
- `first_name`, `last_name`, `email`, `phone` — all `TEXT NOT NULL`
- `created_at` (`TIMESTAMPTZ`, defaults to `NOW()`)

Index on `created_at DESC` for quick "most recent" queries.

## Endpoints

**`POST /inquiry`** — submit an inquiry.

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "07123456789",
  "turnstile_token": "..."
}
```

Returns `201 {"ok": true}` on success, `400 {"error": "..."}` on validation or failed Turnstile. Rate limited to 5 requests per minute per IP.

**`GET /health`** — returns `{"ok": true}`. For monitoring and sanity checks.

## Key Technical Decisions

- **Server-side Turnstile verification.** The widget on its own is theatre — the secret key is what actually verifies the token. Replaces a prior "shared secret" pattern that was hardcoded in public JS and provided zero real security.
- **Parameterised SQL everywhere.** No string concatenation into queries. No SQL injection surface.
- **CORS at API Gateway, not Flask.** The SAM template defines allowed origins, methods, and headers. API Gateway responds to OPTIONS preflights directly — Lambda never runs for those.
- **One Lambda, two routes.** Single Flask app serves both `/inquiry` and `/health`. No reason to split it.
- **Connection per request.** `psycopg2` opens and closes a connection each invocation. Low traffic doesn't justify pooling.
- **In-memory rate limiting.** `Flask-Limiter` with its default store. Resets on Lambda cold start — acceptable for this traffic level; would swap for Redis at scale.
- **ARM64 Lambda.** Cheaper than x86_64, and matches the local Mac build environment so dependency wheels compile in place.
- **Light theme CSS rewrite.** Inherited stylesheet was ~3000 lines with the whole file duplicated twice and `!important` spam. Now ~600 clean lines with CSS variables and one ordered set of media queries.

## Deployment

**Frontend:** push to `main` → Vercel auto-deploys from `docs/`.

**Backend:**
```
cd backend
sam build
sam deploy \
  --stack-name tutoring-backend \
  --region eu-west-2 \
  --parameter-overrides \
    "DatabaseUrl=..." "TurnstileSecret=..." "AllowedOrigin=..."
```

CloudFormation stack is `tutoring-backend` in `eu-west-2`. SAM manages the Lambda, the IAM role, the API Gateway, and the S3 bucket for deployment artifacts.

## Viewing Inquiries

```sql
SELECT * FROM inquiries ORDER BY created_at DESC;
```

Run in Neon's SQL Editor, or with `psql` using the `DATABASE_URL`.

## What This Project Is NOT

- Not multi-tenant — one form, one table, no user accounts.
- No payment processing (the "Book a lesson" button links to a Stripe test URL — the client never moved to live keys).
- No native mobile app, no real-time features.
