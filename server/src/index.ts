import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { apiRouter } from './routes/api.js';

// Load environment variables from .env or root .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging in development
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/api/health')) {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(isDev ? { stack: err.stack } : {}),
  });
});

let currentPort = Number(process.env.PORT) || 5001;

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`=======================================================`);
    console.log(` DecisionFlow Backend Server running on port ${port}`);
    console.log(` API Endpoint: http://localhost:${port}/api`);
    console.log(` Health Status: http://localhost:${port}/api/health`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Server Error]:', err);
    }
  });
}

startServer(currentPort);

