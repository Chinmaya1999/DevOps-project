const Message = require('./models/Message');
const Chat = require('./models/Chat');
const User = require('./models/User');

let io;

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their userId
    socket.on('join', async (userId) => {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      
      // Update user online status in database
      await User.findByIdAndUpdate(userId, { 
        isOnline: true,
        lastSeen: new Date()
      });

      // Notify other users that this user is online
      socket.broadcast.emit('user-online', { userId });
    });

    // Join a specific chat room
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Leave a chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, messageType, fileUrl, fileName, fileSize, isQuestion } = data;

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
        const { chatId } = data;

        const chat = await Chat.findById(chatId);
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
      const { chatId } = data;
      socket.to(chatId).emit('user-typing', {
        userId: socket.userId,
        chatId
      });
    });

    socket.on('stop-typing', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user-stop-typing', {
        userId: socket.userId,
        chatId
      });
    });

    // Question solved
    socket.on('question-solved', async (data) => {
      try {
        const { messageId, solverId } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          message.isSolved = true;
          message.solvedBy = solverId;
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
        const { toUserId, request } = data;
        const recipientSocketId = onlineUsers.get(toUserId);
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new-collaboration-request', request);
        }
      } catch (error) {
        console.error('Error handling collaboration request:', error);
      }
    });

    // Collaboration request accepted
    socket.on('collaboration-accepted', async (data) => {
      try {
        const { fromUserId, chat } = data;
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
      console.log('User disconnected:', socket.id);
      
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
