# GCSE Math Tutoring - Simplified

Marketing site for a GCSE maths tutor. I built it as a client project. We went through a few rounds of requirements and feedback before he decided not to launch. The site and backend are still complete and deployed.

When someone submits the contact form, Cloudflare Turnstile checks they're not a bot. The form data then gets posted to a Python Flask API on AWS Lambda. The API writes the inquiry into Postgres.

## Stack

- Static HTML / CSS / JS in `docs/`, hosted on Vercel
- Python 3.13 + Flask on AWS Lambda with API Gateway in front
- PostgreSQL on Neon
- Cloudflare Turnstile for bot protection
- AWS SAM to deploy the backend

## Repo layout

    docs/      # static site
    backend/   # flask api + SAM template

## Backend

See [backend/README.md](backend/README.md) for setup and deploy steps.

## Frontend

Vercel serves `docs/` as the output directory. Pushing to `main` triggers a redeploy.

## Notes

- Turnstile is checked on the server. An earlier version had a shared secret hardcoded in the public JS, which was pointless. That is gone.
- All SQL uses parameters. No string concat.
- CORS is set up in the SAM template so API Gateway handles the preflight, not Flask.
- Rate limiting is in-memory on the Lambda. It resets on cold start but that is fine at this traffic level.
