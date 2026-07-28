const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 8942);
const root = path.resolve(__dirname, "..", "..");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function respond(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": type
  });
  response.end(body);
}

function createStaticServer() {
  return http.createServer((request, response) => {
    let requestPath;
    try {
      requestPath = decodeURIComponent(
        new URL(request.url, `http://${host}:${port}`).pathname
      );
    } catch {
      respond(response, 400, "Bad request");
      return;
    }

    const relative = requestPath.replace(/^[/\\]+/, "");
    let target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      respond(response, 403, "Forbidden");
      return;
    }

    try {
      if (fs.statSync(target).isDirectory()) {
        target = path.join(target, "index.html");
      }
      const body = fs.readFileSync(target);
      const type = contentTypes[path.extname(target).toLowerCase()]
        || "application/octet-stream";
      respond(response, 200, request.method === "HEAD" ? "" : body, type);
    } catch {
      respond(response, 404, "Not found");
    }
  });
}

function startStaticServer() {
  const server = createStaticServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}

function stopStaticServer(server) {
  return new Promise((resolve) => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    server.close(resolve);
  });
}

module.exports = {
  startStaticServer,
  stopStaticServer
};

if (require.main === module) {
  startStaticServer().then((server) => {
    process.stdout.write(`Serving ${root} at http://${host}:${port}\n`);
    function close() {
      stopStaticServer(server).then(() => process.exit(0));
    }
    process.on("SIGINT", close);
    process.on("SIGTERM", close);
  });
}
