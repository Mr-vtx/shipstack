# skiiyo

A production-ready Fastify backend starter built for real-world APIs.

JWT auth, MongoDB, Redis, rate limiting, file uploads — everything you end up rebuilding anyway.

---

## Why this exists

I got tired of setting up the same backend structure for every project.

Auth. Database. Caching. File uploads. Security.

Most starters look nice, but break down when things get real.

This one doesn’t try to be fancy — it’s just a base I actually use.

---

## What’s inside

- Fastify (fast and minimal)
- MongoDB (Mongoose)
- Redis (Upstash)
- JWT authentication (access + refresh)
- Rate limiting
- File uploads (Cloudinary)
- Optional email support
- Clean, scalable structure

---

## Project structure

```
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
```

Simple and predictable. Easy to extend.

---

## Getting started

```bash
git clone https://github.com/Mr-vtx/skiiyo.git
cd skiiyo
npm install
cp .env.example .env
npm run dev
```

---

## Environment variables

```
PORT=8000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
```

Optional:
- Cloudinary (file uploads)
- Resend (emails)

---

## What this is for

- SaaS backends
- side projects
- APIs that need to scale
- anything you don’t want to rebuild from scratch

---

## What this is NOT

- not a framework
- not plug-and-play magic
- not beginner-friendly without backend basics

---

## Author

Vans (Chukwubuikem Wisdom)

Full-stack developer focused on systems, infrastructure, and practical tools.

---

## Note

Still evolving.

I only add what I actually need in real projects.

If you use it and improve something, feel free to open a PR.
