import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Heart, MessageCircle, Eye, User, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Blog {
  _id: string;
  title: string;
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
  likeCount: number;
  commentCount: number;
  views: number;
  createdAt: string;
}

const BlogList = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastBlogElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreBlogs();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  const categories = ['All', 'DevOps', 'CI/CD', 'Kubernetes', 'Docker', 'AWS', 'Terraform', 'General', 'Tutorial'];

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, searchQuery]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
      const params: any = {
        page: 1,
        limit: 10
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/blogs', { params });
      setBlogs(response.data.blogs);
      setAllBlogs(response.data.blogs);
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreBlogs = async () => {
    if (!hasMore && allBlogs.length > 0) {
      // Repeat blogs when reaching the end (infinite loop)
      setBlogs(prev => [...prev, ...allBlogs]);
      setHasMore(true);
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const params: any = {
        page: nextPage,
        limit: 10
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/blogs', { params });
      
      if (response.data.blogs.length > 0) {
        setBlogs(prev => [...prev, ...response.data.blogs]);
        setCurrentPage(nextPage);
        setHasMore(response.data.hasMore);
      } else {
        // No more blogs, start repeating
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more blogs:', error);
      toast.error('Failed to load more blogs');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBlogs();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">DevOps Blog</h1>
          <p className="text-gray-600 dark:text-gray-300">Latest DevOps insights and tutorials</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Blog Feed - LinkedIn/Instagram Style */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : !blogs || blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No blogs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog, index) => (
              <div
                key={`${blog._id}-${index}`}
                ref={index === blogs.length - 1 ? lastBlogElementRef : null}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <Link to={`/blogs/${blog._id}`}>
                  {/* Author Header */}
                  <div className="p-4 flex items-center gap-3">
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
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{blog.authorName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(blog.createdAt)}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      {blog.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {blog.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>

                  {/* Cover Image */}
                  {blog.coverImage && (
                    <div className="w-full">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full max-h-96 object-cover"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {blog.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Engagement Bar */}
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                        <Heart className="w-5 h-5" />
                        <span>{blog.likeCount}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>{blog.commentCount}</span>
                      </button>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Eye className="w-5 h-5" />
                        <span>{blog.views}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
