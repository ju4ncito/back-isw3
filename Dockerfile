FROM lukechannings/deno:v1.30.3
WORKDIR /app
COPY . /app/
CMD ["run", "-A", "main.ts"]