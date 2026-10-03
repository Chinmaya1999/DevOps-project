const Message = require('./models/Message');
const Chat = require('./models/Chat');
const User = require('./models/User');
const CollaborationRequest = require('./models/CollaborationRequest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const MAX_MESSAGE_LENGTH = 5000;

let io;

const initializeSocket = (server) => {
  const allowedOrigins = [
    'https://cmcloud.online',
    'https://www.cmcloud.online',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ];
  
  io = require('socket.io')(server, {
    maxHttpBufferSize: 1e5, // 100 KB per event
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store online users
  const onlineUsers = new Map();

  // Authenticate every connection: identity comes from a verified JWT, never from client-supplied ids
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      const user = await User.findById(decoded.userId).select('_id isActive passwordChangedAt');
      if (!user || !user.isActive) return next(new Error('Authentication failed'));
      if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        return next(new Error('Session expired'));
      }
      socket.userId = String(user._id);
      next();
    } catch (e) {
      next(new Error('Authentication failed'));
    }
  });

  // Only members of a chat may read from / write to its room
  const getMemberChat = async (chatId, userId) => {
    if (!isId(chatId)) return null;
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.some((p) => p.toString() === userId)) return null;
    return chat;
  };

  io.on('connection', (socket) => {
    // simple per-socket flood protection
    let budget = 30;
    const refill = setInterval(() => { budget = 30; }, 10000);
    socket.use((packet, next) => (budget-- > 0 ? next() : next(new Error('Rate limit exceeded'))));

    // User joins with their userId
    socket.on('join', async () => {
      const userId = socket.userId; // ignore any id sent by the client
      onlineUsers.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      socket.broadcast.emit('user-online', { userId });
    });

    // Join a specific chat room
    socket.on('join-chat', async (chatId) => {
      if (await getMemberChat(chatId, socket.userId)) socket.join(String(chatId));
    });

    // Leave a chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(String(chatId));
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, messageType, fileUrl, fileName, fileSize, isQuestion } = data || {};
        if (typeof content !== 'string' || content.length > MAX_MESSAGE_LENGTH) return;
        // fileUrl must point at our own uploads — block javascript:/external URLs injected by a client
        if (fileUrl && !/^\/uploads\/[\w./-]+$/.test(String(fileUrl))) return;
        if (!(await getMemberChat(chatId, socket.userId))) return;

        const message = new Message({
          chat: chatId,
          sender: socket.userId,
          content,
          messageType: messageType || 'text',
          fileUrl,
          fileName,
          fileSize,
          isQuestion: isQuestion || false
        });

        await message.save();
        await message.populate('sender', 'username avatar');

        // Update chat's last message
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.lastMessage = message._id;
          chat.updatedAt = new Date();
          
          // Update unread count for other participants
          chat.participants.forEach(participantId => {
            if (participantId.toString() !== socket.userId) {
              const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
              chat.unreadCount.set(participantId.toString(), currentCount + 1);
            }
          });
          
          await chat.save();
        }

        // Emit to all users in the chat room
        io.to(chatId).emit('new-message', message);

        // Emit notification to users not in the chat room
        if (chat) {
          chat.participants.forEach(participantId => {
            if (participantId.toString() !== socket.userId) {
              const participantSocketId = onlineUsers.get(participantId.toString());
              if (participantSocketId) {
                io.to(participantSocketId).emit('new-message-notification', {
                  chatId,
                  message,
                  unreadCount: chat.unreadCount.get(participantId.toString()) || 0
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark-read', async (data) => {
      try {
        const { chatId } = data || {};

        const chat = await getMemberChat(chatId, socket.userId);
        if (chat) {
          chat.unreadCount.set(socket.userId, 0);
          await chat.save();

          // Notify other participants
          chat.participants.forEach(participantId => {
            if (participantId.toString() !== socket.userId) {
              const participantSocketId = onlineUsers.get(participantId.toString());
              if (participantSocketId) {
                io.to(participantSocketId).emit('messages-read', {
                  chatId,
                  userId: socket.userId
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { chatId } = data || {};
      if (!socket.rooms.has(String(chatId))) return;
      socket.to(String(chatId)).emit('user-typing', {
        userId: socket.userId,
        chatId
      });
    });

    socket.on('stop-typing', (data) => {
      const { chatId } = data || {};
      if (!socket.rooms.has(String(chatId))) return;
      socket.to(String(chatId)).emit('user-stop-typing', {
        userId: socket.userId,
        chatId
      });
    });

    // Question solved
    socket.on('question-solved', async (data) => {
      try {
        const { messageId } = data || {};
        if (!isId(messageId)) return;

        const message = await Message.findById(messageId);
        // Only a member of the chat can mark it solved, and the solver is always the authenticated user
        if (message && (await getMemberChat(message.chat, socket.userId))) {
          message.isSolved = true;
          message.solvedBy = socket.userId;
          message.solvedAt = new Date();
          await message.save();
          await message.populate('solvedBy', 'username avatar');

          // Notify chat room
          io.to(message.chat.toString()).emit('question-solved', message);
        }
      } catch (error) {
        console.error('Error handling question solved:', error);
      }
    });

    // Collaboration request sent
    socket.on('collaboration-request', async (data) => {
      try {
        const { toUserId } = data || {};
        if (!isId(toUserId)) return;
        // Relay the stored request, not client-supplied content
        const stored = await CollaborationRequest.findOne({ from: socket.userId, to: toUserId, status: 'pending' })
          .sort({ createdAt: -1 }).populate('from', 'username avatar');
        const recipientSocketId = onlineUsers.get(toUserId);
        if (stored && recipientSocketId) {
          io.to(recipientSocketId).emit('new-collaboration-request', stored);
        }
      } catch (error) {
        console.error('Error handling collaboration request:', error);
      }
    });

    // Collaboration request accepted
    socket.on('collaboration-accepted', async (data) => {
      try {
        const { fromUserId, chat } = data || {};
        if (!isId(fromUserId) || !chat || !(await getMemberChat(chat._id, socket.userId))) return;
        const senderSocketId = onlineUsers.get(fromUserId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('collaboration-accepted', chat);
        }
      } catch (error) {
        console.error('Error handling collaboration accepted:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      clearInterval(refill);
      
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        // Update user offline status in database
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false,
          lastSeen: new Date()
        });

        // Notify other users that this user is offline
        socket.broadcast.emit('user-offline', { userId: socket.userId });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
