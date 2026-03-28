# ── Base image ───────────────────────────────────────
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# ── Install dependencies ─────────────────────────────
# Copy package files first (better caching)
COPY package*.json ./

RUN npm ci

# ── Copy source code ─────────────────────────────────
COPY . .

# ── Expose port ──────────────────────────────────────
EXPOSE 3000

# ── Start command ─────────────────────────────────────
CMD ["npm", "run", "dev"]