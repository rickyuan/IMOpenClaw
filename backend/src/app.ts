import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Validate environment
import { validateEnv, config } from './config';
validateEnv();

// Initialize registries
import './agents/registry';
import { initProviders } from './providers/registry';
initProviders();

// Routes
import authRouter from './routes/auth';
import callbackRouter from './routes/callback';
import voiceRouter from './routes/voice';
import modelsRouter from './routes/models';
import googleAuthRouter from './routes/google-auth';

// Middleware
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use(authRouter);
app.use(callbackRouter);
app.use(voiceRouter);
app.use(modelsRouter);
app.use(googleAuthRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: process.uptime(),
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Export for Vercel serverless
export default app;

// Only listen when running locally (not in Vercel)
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`Backend server running on http://localhost:${config.port}`);
  });
}
