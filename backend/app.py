import os
import re
import psycopg2
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from apig_wsgi import make_lambda_handler

app = Flask(__name__)
CORS(app, origins=os.environ.get("ALLOWED_ORIGIN", "*"))

limiter = Limiter(app=app, key_func=get_remote_address)

DATABASE_URL = os.environ["DATABASE_URL"]
TURNSTILE_SECRET = os.environ["TURNSTILE_SECRET"]
TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

email_re = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
phone_re = re.compile(r"^[0-9+\-\s]{7,20}$")


def verify_turnstile(token, ip):
    r = requests.post(
        TURNSTILE_URL,
        data={"secret": TURNSTILE_SECRET, "response": token, "remoteip": ip},
        timeout=5,
    )
    return r.json().get("success") is True


def validate(data):
    for field in ("first_name", "last_name", "email", "phone", "turnstile_token"):
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            return f"missing {field}"

    if len(data["first_name"]) > 100 or len(data["last_name"]) > 100:
        return "name too long"
    if not email_re.match(data["email"]) or len(data["email"]) > 255:
        return "invalid email"
    if not phone_re.match(data["phone"]):
        return "invalid phone"
    return None


@app.post("/inquiry")
@limiter.limit("5 per minute")
def inquiry():
    data = request.get_json(silent=True) or {}

    error = validate(data)
    if error:
        return jsonify({"error": error}), 400

    if not verify_turnstile(data["turnstile_token"], request.remote_addr):
        return jsonify({"error": "verification failed"}), 400

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO inquiries (first_name, last_name, email, phone) "
                "VALUES (%s, %s, %s, %s)",
                (
                    data["first_name"].strip(),
                    data["last_name"].strip(),
                    data["email"].strip().lower(),
                    data["phone"].strip(),
                ),
            )
        conn.commit()
    finally:
        conn.close()

    return jsonify({"ok": True}), 201


@app.get("/health")
def health():
    return {"ok": True}


handler = make_lambda_handler(app)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
