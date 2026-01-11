FROM node:20-slim
# cache
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install Python 3 and pip for homr
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment and install homr
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir homr

# Copy package files and install Node dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the app
COPY . .

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]