const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

const connectDB = require("./config/db");
const routes = require("./server/routes");
const errorHandler = require("./server/middleware/errorHandler");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = ["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean);
const isLocalViteOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && url.hostname === "localhost" && Number(url.port) >= 5173;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isLocalViteOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to HireTrack API",
  });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use(errorHandler);

const startServer = async () => {
  const jwtSecret = (process.env.JWT_SECRET || "").trim();
  const placeholderSecrets = new Set([
    "your_super_secret_jwt_key_here",
    "change_this_secret_in_production",
  ]);

  if (jwtSecret.length < 32 || placeholderSecrets.has(jwtSecret)) {
    throw new Error("JWT_SECRET must be a private value with at least 32 characters.");
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`HireTrack server is running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Unable to start HireTrack:", error.message);
  process.exitCode = 1;
});
