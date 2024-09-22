//* NPM Package
const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const http = require("http");

//* MongoDB
const { connectDB } = require("./config/mongoDB");

//* Routes;
const routes = require("./routes");

//* Error Handling Middleware
const { sendError } = require("./services/responseHandler");
//* CORS Configuration
const whiteList = process.env.WHITE_LIST.split(",");
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);

// Quản lý các kết nối SSE
const sseClients = new Map();

//* Middleware
app.use(express.static("public"));
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// SSE endpoint
app.get("/sse/:user_id", (req, res) => {
  const userId = req.params.user_id;
  if (!userId) {
    return res.status(400).send("UserId is required");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };

  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId).add(newClient);

  req.on("close", () => {
    if (sseClients.has(userId)) {
      sseClients.get(userId).delete(newClient);
      if (sseClients.get(userId).size === 0) {
        sseClients.delete(userId);
      }
    }
  });
});

// Hàm gửi thông báo SSE
const sendSSENotification = (userId, data) => {
  if (sseClients.has(userId)) {
    sseClients.get(userId).forEach((client) => {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
};

// Đặt sendSSENotification làm thuộc tính của app
app.set("sendSSENotification", sendSSENotification);

//* API Routes
Object.entries(routes).forEach(([path, router]) => {
  app.use(`/${path}`, router);
});

//* Error Handling Middleware
app.use((err, req, res, next) => {
  sendError(res, err);
});

//* Start Server
const PORT = process.env.PORT || 8083;

// RabbitMQ Consumers
const { runAllConsumers } = require("./queue/consumers");

Promise.all([connectDB(), runAllConsumers()])
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
