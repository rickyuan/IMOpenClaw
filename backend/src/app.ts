import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import callbackRouter from './routes/callback';
import voiceRouter from './routes/voice';
import modelsRouter from './routes/models';
import googleAuthRouter from './routes/google-auth';

const app = express();
const PORT = process.env.PORT || 3000;

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
  res.json({ status: 'ok' });
});

// Export for Vercel serverless
export default app;

// Only listen when running locally (not in Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}
