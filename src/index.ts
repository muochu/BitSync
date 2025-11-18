import 'dotenv/config';
import express, { Request, Response } from 'express';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import addressesRouter from './routes/addresses';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'BitSync API is running' });
});

// API routes
app.use('/api/addresses', addressesRouter);

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'BitSync API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      addresses: '/api/addresses',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info(`BitSync server running on port ${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    } else {
      logger.error('Server error:', err);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
}

export default app;

