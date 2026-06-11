const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

// Configuração do CORS: Permite que o Frontend converse com o WS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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

  // Notificações em Grupo (ex: Briefing atualizado)
  const { groupId } = req.body;
  if (event && groupId) {
    io.to(`group_${groupId}`).emit(event, payload);
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Missing event, userId or groupId' });
});

// Conexões via WebSocket (do Frontend)
io.on('connection', (socket) => {
  console.log('Um usuário conectou:', socket.id);

  // O Frontend manda esse evento para dizer "Eu sou o usuário ID 5"
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} entrou na sala user_${userId}`);
    }
  });

  socket.on('join_group', (groupId) => {
    if (groupId) {
      socket.join(`group_${groupId}`);
      console.log(`Socket ${socket.id} entrou na sala group_${groupId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectou:', socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Servidor de WebSockets rodando na porta ${PORT}`);
});
