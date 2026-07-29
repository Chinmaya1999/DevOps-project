import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Save, Eye, X, Image as ImageIcon, Tag as TagIcon, Upload, FileText, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateBlog = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    coverImage: '',
    status: 'published'
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const categories = ['DevOps', 'CI/CD', 'Kubernetes', 'Docker', 'AWS', 'Terraform', 'General', 'Tutorial'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...files]);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedPdfs(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removePdf = (index: number) => {
    setSelectedPdfs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', JSON.stringify(tagsArray));
      formDataToSend.append('coverImage', formData.coverImage);
      formDataToSend.append('status', formData.status);

      selectedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      selectedPdfs.forEach((pdf) => {
        formDataToSend.append('pdfs', pdf);
      });

      await api.post('/blogs', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Blog created successfully!');
      navigate('/blogs');
    } catch (error) {
      console.error('Error creating blog:', error);
      toast.error('Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', JSON.stringify(tagsArray));
      formDataToSend.append('coverImage', formData.coverImage);
      formDataToSend.append('status', 'draft');

      selectedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      selectedPdfs.forEach((pdf) => {
        formDataToSend.append('pdfs', pdf);
      });

      await api.post('/blogs', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Draft saved successfully!');
      navigate('/blogs/my-blogs');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Blog</h1>
            <p className="text-gray-600 dark:text-gray-400">Share your DevOps knowledge with the community</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {previewMode ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-500 rounded-lg text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          </div>
        </div>

        {previewMode ? (
          /* Preview Mode */
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
            <div className="mb-4">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {formData.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{formData.title || 'Untitled'}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {formData.tags.split(',').map((tag, index) => (
                tag.trim() && (
                  <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm">
                    #{tag.trim()}
                  </span>
                )
              ))}
            </div>
            {formData.coverImage && (
              <img src={formData.coverImage} alt="Cover" className="w-full h-64 object-cover rounded-lg mb-6" />
            )}
            <div className="prose max-w-none">
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{formData.content || 'No content...'}</div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter an engaging title for your blog..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">Cover Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formData.coverImage && (
                <img
                  src={formData.coverImage}
                  alt="Preview"
                  className="mt-2 w-full h-48 object-cover rounded-lg"
                  onError={() => setFormData({ ...formData, coverImage: '' })}
                />
              )}
            </div>

            {/* Multiple Images Upload */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">Additional Images (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Click to upload images or drag and drop
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    PNG, JPG, GIF up to 10MB each (max 10 images)
                  </span>
                </label>
              </div>
              {selectedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Multiple PDFs Upload */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">PDF Files (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="pdfs"
                  multiple
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                />
                <label
                  htmlFor="pdfs"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FileText className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Click to upload PDFs or drag and drop
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    PDF files up to 10MB each (max 5 PDFs)
                  </span>
                </label>
              </div>
              {selectedPdfs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedPdfs.map((pdf, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                          {pdf.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePdf(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">Tags (comma-separated)</label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="devops, kubernetes, docker, aws"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your blog content here... You can use markdown formatting."
                rows={15}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Publish Blog
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/blogs')}
                className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateBlog;
