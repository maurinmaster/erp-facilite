const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

// Configuração do CORS: Permite que o Frontend (porta 3000) converse com o WS (porta 3001)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware para receber POST requests JSON do Next.js
app.use(express.json());

// Endpoint interno: O Next.js usa isso para avisar o WS que algo aconteceu
app.post('/emit', (req, res) => {
  const { event, userId, payload } = req.body;
  
  if (event && userId) {
    // Envia o evento apenas para a "sala" do usuário específico
    io.to(`user_${userId}`).emit(event, payload);
    return res.status(200).json({ success: true });
  }
  res.status(400).json({ error: 'Missing parameters' });
});

// Conexão do Socket do lado do Cliente (Navegador)
io.on('connection', (socket) => {
  console.log(`[WS] Novo cliente conectado: ${socket.id}`);

  // Quando o frontend carrega, ele manda o ID do usuário para entrar na sala pessoal
  socket.on('join_user', (userId) => {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`[WS] Cliente ${socket.id} entrou na sala ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.WS_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`[WS] Servidor WebSocket rodando na porta ${PORT}`);
});
