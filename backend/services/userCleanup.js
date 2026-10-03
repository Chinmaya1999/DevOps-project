const mongoose = require('mongoose');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const GeneratedFile = require('../models/GeneratedFile');
const UserPoints = require('../models/UserPoints');
const CollaborationRequest = require('../models/CollaborationRequest');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Blog = require('../models/Blog');

/**
 * Delete a user AND the personal data that belongs only to them, so no orphaned records are left behind.
 * Kept on purpose: payment records (financial/accounting history).
 * Returns counts of what was removed.
 */
async function deleteUserCascade(userId) {
  const id = new mongoose.Types.ObjectId(String(userId));
  const removed = {};

  removed.deployments = (await Deployment.deleteMany({ userId: id })).deletedCount;        // includes stored SSH keys
  removed.generatedFiles = (await GeneratedFile.deleteMany({ userId: id })).deletedCount;
  removed.points = (await UserPoints.deleteMany({ user: id })).deletedCount;
  removed.collaborationRequests = (await CollaborationRequest.deleteMany({ $or: [{ from: id }, { to: id }] })).deletedCount;

  // Chats: direct chats with this user are deleted with their messages; in group chats the user is just removed
  const direct = await Chat.find({ participants: id, isGroup: { $ne: true } }).select('_id');
  const directIds = direct.map((c) => c._id);
  removed.messages = (await Message.deleteMany({ $or: [{ chat: { $in: directIds } }, { sender: id }] })).deletedCount;
  removed.chats = (await Chat.deleteMany({ _id: { $in: directIds } })).deletedCount;
  await Chat.updateMany({ participants: id }, { $pull: { participants: id } });
  await Chat.updateMany({ groupAdmin: id }, { $unset: { groupAdmin: '' } });

  // Blogs: their posts go; their comments and likes on other posts are removed
  removed.blogs = (await Blog.deleteMany({ author: id })).deletedCount;
  await Blog.updateMany({ 'comments.user': id }, { $pull: { comments: { user: id } } });
  await Blog.updateMany({ likes: id }, { $pull: { likes: id } });

  await User.updateMany({ friends: id }, { $pull: { friends: id } });
  removed.user = (await User.deleteOne({ _id: id })).deletedCount;
  return removed;
}

module.exports = { deleteUserCascade };
