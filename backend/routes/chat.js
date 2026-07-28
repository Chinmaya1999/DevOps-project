const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const CollaborationRequest = require('../models/CollaborationRequest');
const UserPoints = require('../models/UserPoints');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all users for collaboration
router.get('/users', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('friends');
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      isActive: true 
    }).select('username email workExperience domains isOnline lastSeen avatar');
    
    // Add isFriend flag to each user
    const usersWithFriendStatus = users.map(user => ({
      ...user.toObject(),
      isFriend: currentUser.friends?.includes(user._id) || false
    }));
    
    res.json(usersWithFriendStatus);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all chats for current user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ 
      participants: req.user._id 
    })
    .populate('participants', 'username email avatar isOnline lastSeen workExperience domains')
    .populate('lastMessage')
    .populate('groupAdmin', 'username')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'username avatar')
      .populate('solvedBy', 'username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new chat (direct message)
router.post('/direct', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId] },
      isGroup: false
    }).populate('participants', 'username email avatar isOnline lastSeen workExperience domains');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
      participants: [req.user._id, userId],
      isGroup: false
    });

    await chat.save();
    await chat.populate('participants', 'username email avatar isOnline lastSeen workExperience domains');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Create a group chat
router.post('/group', auth, async (req, res) => {
  try {
    const { name, participantIds } = req.body;

    const chat = new Chat({
      participants: [req.user._id, ...participantIds],
      name,
      isGroup: true,
      groupAdmin: req.user._id
    });

    await chat.save();
    await chat.populate('participants', 'username email avatar isOnline lastSeen workExperience domains');
    await chat.populate('groupAdmin', 'username');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ error: 'Failed to create group chat' });
  }
});

// Send a message
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { content, messageType, fileUrl, fileName, fileSize, isQuestion } = req.body;

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = new Message({
      chat: req.params.chatId,
      sender: req.user._id,
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
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    
    // Update unread count for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    // If it's a question, update user points
    if (isQuestion) {
      await UserPoints.findOneAndUpdate(
        { user: req.user._id },
        { $inc: { questionsAsked: 1 } },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:chatId/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Reset unread count for current user
    chat.unreadCount.set(req.user._id.toString(), 0);
    await chat.save();

    // Mark messages as read
    await Message.updateMany(
      { 
        chat: req.params.chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Send collaboration request
router.post('/collaboration-request', auth, async (req, res) => {
  try {
    const { toUserId, message } = req.body;

    // Check if request already exists
    const existingRequest = await CollaborationRequest.findOne({
      from: req.user._id,
      to: toUserId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Collaboration request already pending' });
    }

    const collaborationRequest = new CollaborationRequest({
      from: req.user._id,
      to: toUserId,
      message: message || ''
    });

    await collaborationRequest.save();
    await collaborationRequest.populate('from', 'username email avatar');
    await collaborationRequest.populate('to', 'username email avatar');

    res.status(201).json(collaborationRequest);
  } catch (error) {
    console.error('Error sending collaboration request:', error);
    res.status(500).json({ error: 'Failed to send collaboration request' });
  }
});

// Get pending collaboration requests
router.get('/collaboration-requests/pending', auth, async (req, res) => {
  try {
    const requests = await CollaborationRequest.find({
      to: req.user._id,
      status: 'pending'
    })
    .populate('from', 'username email avatar workExperience domains isOnline lastSeen')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching collaboration requests:', error);
    res.status(500).json({ error: 'Failed to fetch collaboration requests' });
  }
});

// Get sent collaboration requests
router.get('/collaboration-requests/sent', auth, async (req, res) => {
  try {
    const requests = await CollaborationRequest.find({
      from: req.user._id
    })
    .populate('to', 'username email avatar workExperience domains isOnline lastSeen')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching sent collaboration requests:', error);
    res.status(500).json({ error: 'Failed to fetch sent collaboration requests' });
  }
});

// Accept/Reject collaboration request
router.put('/collaboration-request/:requestId', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await CollaborationRequest.findOne({
      _id: req.params.requestId,
      to: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ error: 'Collaboration request not found' });
    }

    request.status = status;
    await request.save();

    // If accepted, create a chat and add to friends list
    if (status === 'accepted') {
      let chat = await Chat.findOne({
        participants: { $all: [request.from, request.to] },
        isGroup: false
      });

      if (!chat) {
        chat = new Chat({
          participants: [request.from, request.to],
          isGroup: false
        });
        await chat.save();
      }

      // Add users to each other's friends list
      await User.findByIdAndUpdate(request.from, {
        $addToSet: { friends: request.to }
      });
      await User.findByIdAndUpdate(request.to, {
        $addToSet: { friends: request.from }
      });

      await chat.populate('participants', 'username email avatar isOnline lastSeen workExperience domains');
      return res.json({ request, chat });
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating collaboration request:', error);
    res.status(500).json({ error: 'Failed to update collaboration request' });
  }
});

// Get accepted collaborators
router.get('/collaborators', auth, async (req, res) => {
  try {
    const acceptedRequests = await CollaborationRequest.find({
      $or: [
        { from: req.user._id, status: 'accepted' },
        { to: req.user._id, status: 'accepted' }
      ]
    })
    .populate('from', 'username email avatar workExperience domains isOnline lastSeen')
    .populate('to', 'username email avatar workExperience domains isOnline lastSeen');

    const collaborators = acceptedRequests.map(req => {
      return req.from._id.toString() === req.user._id.toString() ? req.to : req.from;
    });

    res.json(collaborators);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

// Solve a question
router.put('/messages/:messageId/solve', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.isQuestion) {
      return res.status(400).json({ error: 'This message is not a question' });
    }

    if (message.isSolved) {
      return res.status(400).json({ error: 'This question is already solved' });
    }

    message.isSolved = true;
    message.solvedBy = req.user._id;
    message.solvedAt = new Date();
    await message.save();

    // Award points to solver
    const userPoints = await UserPoints.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: { points: 1, questionsSolved: 1 },
        $push: {
          history: {
            action: 'question_solved',
            points: 1,
            description: `Solved a question in chat`,
            timestamp: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );

    await message.populate('solvedBy', 'username avatar');

    res.json({ message, userPoints });
  } catch (error) {
    console.error('Error solving question:', error);
    res.status(500).json({ error: 'Failed to solve question' });
  }
});

// Get user points
router.get('/points', auth, async (req, res) => {
  try {
    const userPoints = await UserPoints.findOne({ user: req.user._id })
      .populate('user', 'username');

    if (!userPoints) {
      return res.json({
        points: 0,
        questionsSolved: 0,
        questionsAsked: 0,
        history: []
      });
    }

    res.json(userPoints);
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({ error: 'Failed to fetch user points' });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await UserPoints.find()
      .populate('user', 'username avatar workExperience domains')
      .sort({ points: -1 })
      .limit(10);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Admin: Get chat statistics
router.get('/admin/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalQuestions = await Message.countDocuments({ isQuestion: true });
    const solvedQuestions = await Message.countDocuments({ isQuestion: true, isSolved: true });
    const totalCollaborationRequests = await CollaborationRequest.countDocuments();
    const acceptedCollaborations = await CollaborationRequest.countDocuments({ status: 'accepted' });
    const activeUsers = await User.countDocuments({ isOnline: true });
    const totalUsers = await User.countDocuments();

    // Get top contributors
    const topContributors = await UserPoints.find()
      .populate('user', 'username email')
      .sort({ points: -1 })
      .limit(10);

    // Get recent messages
    const recentMessages = await Message.find()
      .populate('sender', 'username')
      .populate('chat', 'participants')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      totalChats,
      totalMessages,
      totalQuestions,
      solvedQuestions,
      totalCollaborationRequests,
      acceptedCollaborations,
      activeUsers,
      totalUsers,
      topContributors,
      recentMessages
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ error: 'Failed to fetch chat statistics' });
  }
});

// Update online status
router.put('/online-status', auth, async (req, res) => {
  try {
    const { isOnline } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      isOnline,
      lastSeen: isOnline ? new Date() : new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({ error: 'Failed to update online status' });
  }
});

module.exports = router;
