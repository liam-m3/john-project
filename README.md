# GCSE Math Tutoring - Simplified

Marketing site for a GCSE maths tutor I worked with as a client. Went through several rounds of requirements and feedback before he decided not to launch. Site and backend are complete and deployed.

The contact form on the site verifies visitors with Cloudflare Turnstile, posts to a Python api on AWS Lambda, and saves the inquiry in Postgres.

## Stack

- Static HTML / CSS / JS in `docs/`, hosted on Vercel
- Python 3.13 + Flask on AWS Lambda, fronted by API Gateway
- PostgreSQL on Neon
- Cloudflare Turnstile for bot protection (verified server-side)
- AWS SAM for the backend deploy

## Repo layout

    docs/      # static site
    backend/   # flask api + SAM template

## Backend

See [backend/README.md](backend/README.md) for setup and deploy.

## Frontend

Vercel serves `docs/` as the output directory. Push to `main` and it redeploys.

## Notes

- Server-side Turnstile verification. The previous version had a hardcoded "shared secret" in public JS — removed.
- Parameterised SQL throughout.
- CORS handled at API Gateway (in the SAM template), not in Flask.
- In-memory rate limiting on the Lambda; fine for the traffic.
