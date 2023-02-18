FROM lukechannings/deno:v1.30.3
ARG DATABASE_URL
WORKDIR /app
COPY . /app/
CMD ["run", "-A", "main.ts"]
