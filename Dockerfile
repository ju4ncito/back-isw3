FROM hayd/alpine-deno:1.30.3
WORKDIR /app
COPY app.bundle.js .
EXPOSE 8080
CMD [ "deno", "run", "--allow-net", "app.bundle.js" ]
