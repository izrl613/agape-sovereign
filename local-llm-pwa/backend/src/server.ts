import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { ai } from './genkit.js';
import { 
  chatFlow, 
  streamChatFlow, 
  listModelsFlow, 
  pullModelFlow, 
  deleteModelFlow, 
  embedFlow,
  healthCheckFlow
} from './flows.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckFlow();
    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: String(error) });
  }
});

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const result = await chatFlow(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await streamChatFlow(req.body);
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
    res.end();
  }
});

app.get('/api/models', async (req: Request, res: Response) => {
  try {
    const models = await listModelsFlow();
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/models/pull', async (req: Request, res: Response) => {
  try {
    const result = await pullModelFlow(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete('/api/models/:name', async (req: Request, res: Response) => {
  try {
    const result = await deleteModelFlow({ name: req.params.name });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/embed', async (req: Request, res: Response) => {
  try {
    const result = await embedFlow(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log('WebSocket client connected');

  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'chat') {
        const stream = await streamChatFlow(message.payload);
        for await (const chunk of stream) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'chunk', data: chunk.text }));
          }
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'done' }));
        }
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', error: String(error) }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});

function broadcast(message: object) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, HOST, () => {
  console.log(`Local LLM Backend running on http://${HOST}:${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Ollama: ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});