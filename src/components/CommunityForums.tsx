import React, { useState, useEffect, useCallback } from 'react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    type: 'brand' | 'creator';
    avatar?: string;
  };
  category: 'tips' | 'networking' | 'support' | 'general';
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastReply?: {
    author: string;
    timestamp: string;
  };
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    type: 'brand' | 'creator';
    avatar?: string;
  };
  likes: number;
  createdAt: string;
  isSolution: boolean;
}

interface CommunityForumsProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommunityForums: React.FC<CommunityForumsProps> = ({ isOpen, onClose }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'tips' | 'networking' | 'support' | 'general'>('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general' as const,
    tags: ''
  });
  const [newReply, setNewReply] = useState('');

  // Mock data for when database is empty
  const getMockPosts = (): ForumPost[] => [
    {
      id: 'mock-post-1',
      title: 'Best Practices for Brand-Creator Collaborations',
      content: 'I\'ve been working with brands for over 3 years and wanted to share some key insights that have helped me build lasting partnerships...',
      author: {
        id: 'author-1',
        name: 'Sarah Johnson',
        type: 'creator',
        avatar: '/icons/Green_icons/UserProfile1.png'
      },
      category: 'tips',
      tags: ['collaboration', 'brands', 'best-practices'],
      likes: 24,
      replies: 8,
      views: 156,
      isPinned: true,
      isLocked: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastReply: {
        author: 'Mike Chen',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'mock-post-2',
      title: 'Looking for Creative Collaborators in NYC',
      content: 'Hey everyone! I\'m a brand manager looking to connect with talented creators in the New York area for upcoming campaigns...',
      author: {
        id: 'author-2',
        name: 'Creative Brands Co.',
        type: 'brand',
        avatar: '/icons/Green_icons/Brief1.png'
      },
      category: 'networking',
      tags: ['networking', 'nyc', 'collaboration'],
      likes: 12,
      replies: 15,
      views: 89,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      lastReply: {
        author: 'Lisa Rodriguez',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'mock-post-3',
      title: 'Payment Issues - Need Help!',
      content: 'I completed a project 2 weeks ago but haven\'t received payment yet. The brand said they sent it but I don\'t see it in my account...',
      author: {
        id: 'author-3',
        name: 'Alex Thompson',
        type: 'creator',
        avatar: '/icons/Green_icons/UserProfile1.png'
      },
      category: 'support',
      tags: ['payment', 'help', 'urgent'],
      likes: 5,
      replies: 12,
      views: 67,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastReply: {
        author: 'DraftBoard Support',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    }
  ];

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = activeCategory === 'all' 
        ? '/api/forums/posts' 
        : `/api/forums/posts?category=${activeCategory}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // If no posts returned, use mock data
        if (data.length === 0) {
          setPosts(getMockPosts());
        } else {
          setPosts(data);
        }
      } else {
        // If API fails, use mock data
        setPosts(getMockPosts());
      }
    } catch (error) {
      // Error fetching posts - use mock data as fallback
      setPosts(getMockPosts());
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen, activeCategory, fetchPosts]);

  useEffect(() => {
    if (selectedPost) {
      fetchReplies(selectedPost.id);
    }
  }, [selectedPost]);

  const fetchReplies = async (postId: string) => {
    try {
      const response = await fetch(`/api/forums/posts/${postId}/replies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReplies(data);
      }
    } catch (error) {
      // Error fetching replies - could implement proper error handling here
    }
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      const response = await fetch('/api/forums/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newPost,
          tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      });

      if (response.ok) {
        setNewPost({ title: '', content: '', category: 'general', tags: '' });
        setShowNewPost(false);
        fetchPosts();
      }
    } catch (error) {
      // Error creating post - could implement proper error handling here
    }
  };

  const createReply = async () => {
    if (!newReply.trim() || !selectedPost) return;

    try {
      const response = await fetch(`/api/forums/posts/${selectedPost.id}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newReply.trim() })
      });

      if (response.ok) {
        setNewReply('');
        fetchReplies(selectedPost.id);
        fetchPosts(); // Update reply count
      }
    } catch (error) {
      // Error creating reply - could implement proper error handling here
    }
  };

  const likePost = async (postId: string) => {
    try {
      await fetch(`/api/forums/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchPosts();
    } catch (error) {
      // Error liking post - could implement proper error handling here
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tips': return '/icons/Green_icons/Target1.png';
      case 'networking': return '/icons/Green_icons/UserProfile1.png';
      case 'support': return '/icons/Green_icons/NotificationBell.png';
      case 'general': return '/icons/Green_icons/Dashboard1.png';
      default: return '/icons/Green_icons/Clipboard1.png';
    }
  };


  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredPosts = posts.filter(post => 
    activeCategory === 'all' || post.category === activeCategory
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex">
        {/* Posts List */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Community Forums</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex space-x-1 mt-3">
              {[
                { key: 'all', label: 'All' },
                { key: 'tips', label: 'Tips' },
                { key: 'networking', label: 'Networking' },
                { key: 'support', label: 'Support' },
                { key: 'general', label: 'General' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key as 'all' | 'tips' | 'networking' | 'support' | 'general')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    activeCategory === key
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* New Post Button */}
            <button
              onClick={() => setShowNewPost(true)}
              className="mt-3 w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
            >
              + New Post
            </button>
          </div>

          {/* Posts List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-400">Loading posts...</div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-4xl mb-4">💬</div>
                <p>No posts found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-4 cursor-pointer hover:bg-gray-800 transition-colors ${
                      selectedPost?.id === post.id ? 'bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <img 
                        src={getCategoryIcon(post.category)} 
                        alt={post.category}
                        className="w-6 h-6 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-white font-medium truncate">{post.title}</h3>
                          {post.isPinned && <span className="text-yellow-400">📌</span>}
                          {post.isLocked && <span className="text-red-400">🔒</span>}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>by {post.author.name}</span>
                          <span>{formatTimestamp(post.createdAt)}</span>
                          <span>👁 {post.views}</span>
                          <span>💬 {post.replies}</span>
                          <span>❤️ {post.likes}</span>
                        </div>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Post Details */}
        <div className="w-1/2 flex flex-col">
          {selectedPost ? (
            <>
              {/* Post Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <img 
                    src={getCategoryIcon(selectedPost.category)} 
                    alt={selectedPost.category}
                    className="w-6 h-6"
                  />
                  <h2 className="text-lg font-bold text-white">{selectedPost.title}</h2>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>by {selectedPost.author.name}</span>
                  <span>{formatTimestamp(selectedPost.createdAt)}</span>
                  <button
                    onClick={() => likePost(selectedPost.id)}
                    className="flex items-center space-x-1 hover:text-red-400"
                  >
                    <span>❤️</span>
                    <span>{selectedPost.likes}</span>
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4 border-b border-gray-700">
                <div className="text-gray-300 whitespace-pre-wrap">{selectedPost.content}</div>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-white font-medium mb-4">Replies ({replies.length})</h3>
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {reply.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-white font-medium">{reply.author.name}</span>
                            <div className="flex items-center space-x-2">
                              {reply.isSolution && (
                                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                  ✓ Solution
                                </span>
                              )}
                              <span className="text-gray-400 text-sm">
                                {formatTimestamp(reply.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-300">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={createReply}
                    disabled={!newReply.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-4">💬</div>
                <p>Select a post to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Create New Post</h3>
              <button
                onClick={() => setShowNewPost(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter post title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({...newPost, category: e.target.value as 'general' | 'tips' | 'networking' | 'support'})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="general">General</option>
                  <option value="tips">Tips & Tricks</option>
                  <option value="networking">Networking</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={6}
                  placeholder="Write your post content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., design, marketing, tips"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewPost(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPost}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Create Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityForums;
