import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import batchRoutes from './routes/batches';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/batches', batchRoutes);
app.use('/api/auth', authRoutes);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
