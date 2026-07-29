import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Calendar, 
  User, 
  ArrowLeft, 
  Edit, 
  Trash2,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  authorName: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  coverImage?: string;
  likes: string[];
  likeCount: number;
  comments: Comment[];
  commentCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/blogs/${id}`);
      setBlog(response.data.blog);
      setLiked(response.data.blog.likes.includes(user?.id || ''));
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Failed to load blog');
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like blogs');
      return;
    }

    try {
      const response = await api.put(`/blogs/${id}/like`);
      setLiked(response.data.liked);
      setBlog(prev => prev ? { ...prev, likeCount: response.data.likeCount } : null);
    } catch (error) {
      console.error('Error liking blog:', error);
      toast.error('Failed to like blog');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await api.post(`/blogs/${id}/comments`, {
        content: commentText
      });

      setBlog(prev => prev ? {
        ...prev,
        comments: [...prev.comments, response.data.comment],
        commentCount: prev.commentCount + 1
      } : null);

      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      await api.delete(`/blogs/${id}/comments/${commentId}`);
      setBlog(prev => prev ? {
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId),
        commentCount: Math.max(0, prev.commentCount - 1)
      } : null);
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleDeleteBlog = async () => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Blog deleted successfully');
      navigate('/blogs');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white text-xl">Blog not found</p>
      </div>
    );
  }

  const isAuthor = user?.id === blog.author._id || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/blogs')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Blogs
        </button>

        {/* Blog Header */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-8 shadow-sm">
          {blog.coverImage && (
            <div className="h-64 md:h-96 overflow-hidden">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                {blog.category}
              </span>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">{blog.title}</h1>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {blog.authorAvatar ? (
                  <img
                    src={blog.authorAvatar}
                    alt={blog.authorName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">{blog.authorName}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Author</p>
                </div>
              </div>

              {isAuthor && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/blogs/${id}/edit`)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 border border-blue-500 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteBlog}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900 border border-red-500 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400 text-sm mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{blog.views} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{blog.likeCount} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{blog.commentCount} comments</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="prose max-w-none">
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {blog.content}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  liked
                    ? 'bg-red-100 dark:bg-red-900 border border-red-500 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                <span>{liked ? 'Liked' : 'Like'}</span>
                <span>({blog.likeCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comments ({blog.commentCount})</h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submittingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Comment
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-2">Please login to leave a comment</p>
              <Link to="/login" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
                Login here
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {blog.comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              blog.comments.map((comment) => (
                <div key={comment._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                  <div className="flex items-start gap-4">
                    {comment.userAvatar ? (
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium">{comment.userName}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">{formatDate(comment.createdAt)}</span>
                        </div>
                        {(user?.id === comment.user._id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
