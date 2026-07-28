import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { io, Socket } from 'socket.io-client'
import {
  MessageSquare,
  Users,
  Send,
  Paperclip,
  Search,
  UserPlus,
  UserCheck,
  Star,
  Award,
  HelpCircle,
  Check,
  X,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  workExperience: string
  domains: string[]
  isOnline: boolean
  lastSeen?: string
  isFriend?: boolean
}

interface Message {
  _id: string
  chat: string
  content: string
  messageType: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isQuestion: boolean
  isSolved: boolean
  solvedBy?: any
  solvedAt?: string
  sender: {
    _id: string
    username: string
    avatar?: string
  }
  createdAt: string
  readBy: any[]
}

interface Chat {
  _id: string
  participants: User[]
  name: string
  isGroup: boolean
  groupAdmin?: any
  lastMessage?: Message
  unreadCount: Map<string, number>
}

interface CollaborationRequest {
  _id: string
  from: User
  to: User
  status: string
  message: string
  createdAt: string
}

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [activeTab, setActiveTab] = useState<'chats' | 'users' | 'requests'>('chats')
  const [chats, setChats] = useState<Chat[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [pendingRequests, setPendingRequests] = useState<CollaborationRequest[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isQuestion, setIsQuestion] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [userPoints, setUserPoints] = useState<any>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize socket connection - use base URL without /api for Socket.IO
    const socketBaseUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'https://api.cmcloud.online'
    const newSocket = io(socketBaseUrl)
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to socket server')
      const userId = (user as any)?._id || user?.id
      if (userId) {
        newSocket.emit('join', userId)
        // Update online status
        fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/online-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isOnline: true })
        })
      }
    })

    newSocket.on('new-message', (message: Message) => {
      if (selectedChat && message.chat === selectedChat._id) {
        setMessages(prev => {
          // Replace temporary message with real message if it exists
          const tempIndex = prev.findIndex(m => m._id.startsWith('temp-') && m.content === message.content)
          if (tempIndex !== -1) {
            const newMessages = [...prev]
            newMessages[tempIndex] = message
            return newMessages
          }
          return [...prev, message]
        })
        scrollToBottom()
      }
    })

    newSocket.on('new-message-notification', (data: any) => {
      fetchChats()
      toast.success(`New message from ${data.message.sender.username}`)
    })

    newSocket.on('user-online', (data: { userId: string }) => {
      setAllUsers(prev => prev.map(u => 
        u._id === data.userId ? { ...u, isOnline: true } : u
      ))
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => 
          p._id === data.userId ? { ...p, isOnline: true } : p
        )
      })))
    })

    newSocket.on('user-offline', (data: { userId: string }) => {
      setAllUsers(prev => prev.map(u => 
        u._id === data.userId ? { ...u, isOnline: false } : u
      ))
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => 
          p._id === data.userId ? { ...p, isOnline: false } : p
        )
      })))
    })

    newSocket.on('user-typing', (data: { userId: string, chatId: string }) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setTypingUsers(prev => new Set([...prev, data.userId]))
      }
    })

    newSocket.on('user-stop-typing', (data: { userId: string, chatId: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    })

    newSocket.on('question-solved', (message: Message) => {
      if (selectedChat && message._id === selectedChat.lastMessage?._id) {
        setMessages(prev => prev.map(m => 
          m._id === message._id ? message : m
        ))
        toast.success('Question solved! +1 point')
      }
    })

    newSocket.on('new-collaboration-request', (request: CollaborationRequest) => {
      fetchPendingRequests()
      toast.success(`New collaboration request from ${request.from.username}`)
    })

    newSocket.on('collaboration-accepted', () => {
      fetchChats()
      toast.success('Collaboration request accepted!')
    })

    return () => {
      newSocket.disconnect()
      // Update offline status
      const userId = (user as any)?._id || user?.id
      if (userId) {
        fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/online-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isOnline: false })
        })
      }
    }
  }, [user])

  useEffect(() => {
    fetchChats()
    fetchAllUsers()
    fetchPendingRequests()
    fetchUserPoints()
  }, [])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id)
      if (socket) {
        socket.emit('join-chat', selectedChat._id)
      }
    }
  }, [selectedChat])

  const fetchChats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setAllUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/collaboration-requests/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setPendingRequests(data)
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setMessages(data)
      scrollToBottom()
      
      // Mark as read
      await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/${chatId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchUserPoints = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/points`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setUserPoints(data)
    } catch (error) {
      console.error('Error fetching user points:', error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setLeaderboard(data)
      setShowLeaderboard(true)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !socket) return

    const userId = (user as any)?._id || user?.id
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      chat: selectedChat._id,
      content: newMessage,
      messageType: 'text',
      isQuestion,
      isSolved: false,
      sender: {
        _id: userId || '',
        username: (user as any)?.username || 'You',
        avatar: (user as any)?.avatar
      },
      createdAt: new Date().toISOString(),
      readBy: []
    }

    // Optimistically add message to local state
    setMessages(prev => [...prev, tempMessage])
    scrollToBottom()

    const messageData = {
      chatId: selectedChat._id,
      content: newMessage,
      messageType: 'text',
      isQuestion
    }

    socket.emit('send-message', messageData)
    socket.emit('stop-typing', { chatId: selectedChat._id })
    
    setNewMessage('')
    setIsQuestion(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedChat || !socket) return

    // For demo purposes, we'll just send the file info
    // In production, you'd upload to a storage service
    const messageData = {
      chatId: selectedChat._id,
      content: `Shared a file: ${file.name}`,
      messageType: file.type.startsWith('image/') ? 'image' : 'document',
      fileName: file.name,
      fileSize: file.size,
      isQuestion: false
    }

    socket.emit('send-message', messageData)
  }

  const handleSendCollaborationRequest = async (toUserId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/collaboration-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ toUserId, message: 'I would like to collaborate with you!' })
      })

      if (response.ok) {
        toast.success('Collaboration request sent!')
        if (socket) {
          socket.emit('collaboration-request', { toUserId })
        }
      }
    } catch (error) {
      console.error('Error sending collaboration request:', error)
      toast.error('Failed to send collaboration request')
    }
  }

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/collaboration-request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'accepted' })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Collaboration request accepted!')
        if (socket) {
          socket.emit('collaboration-accepted', { fromUserId, chat: data.chat })
        }
        fetchPendingRequests()
        fetchChats()
      }
    } catch (error) {
      console.error('Error accepting collaboration request:', error)
      toast.error('Failed to accept collaboration request')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/collaboration-request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'rejected' })
      })

      if (response.ok) {
        toast.success('Collaboration request rejected')
        fetchPendingRequests()
      }
    } catch (error) {
      console.error('Error rejecting collaboration request:', error)
      toast.error('Failed to reject collaboration request')
    }
  }

  const handleStartChat = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const chat = await response.json()
        setSelectedChat(chat)
        setActiveTab('chats')
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start chat')
    }
  }

  const handleSolveQuestion = async (messageId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/messages/${messageId}/solve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => prev.map(m => 
          m._id === messageId ? data.message : m
        ))
        setUserPoints(data.userPoints)
        if (socket) {
          socket.emit('question-solved', { messageId, solverId: getUserId() })
        }
        toast.success('Question solved! +1 point')
      }
    } catch (error) {
      console.error('Error solving question:', error)
      toast.error('Failed to solve question')
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Please enter a group name and select at least one user')
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'}/chat/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: groupName, participantIds: selectedUsers })
      })

      if (response.ok) {
        const chat = await response.json()
        setChats(prev => [chat, ...prev])
        setShowGroupModal(false)
        setGroupName('')
        setSelectedUsers([])
        toast.success('Group chat created successfully!')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group chat')
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleTyping = () => {
    if (socket && selectedChat) {
      socket.emit('typing', { chatId: selectedChat._id })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredUsers = Array.isArray(allUsers) ? allUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  const getUserId = () => {
    return (user as any)?._id || user?.id
  }

  const getOtherParticipant = (chat: Chat) => {
    const userId = getUserId()
    return chat.participants.find(p => p._id !== userId)
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Collaboration Hub</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchLeaderboard}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Leaderboard"
              >
                <Award className="w-5 h-5 text-yellow-500" />
              </button>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-white" />
                <span className="text-white font-bold">{userPoints?.points || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chats'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1" />
              Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
            >
              <Users className="w-4 h-4 inline mr-1" />
              Group
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <div className="space-y-2 p-4">
              {chats.map(chat => {
                const otherUser = getOtherParticipant(chat)
                if (!otherUser) return null
                const unreadCount = chat.unreadCount instanceof Map 
                  ? (chat.unreadCount.get(getUserId() || '') || 0)
                  : (chat.unreadCount?.[getUserId() || ''] || 0)
                
                return (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat?._id === chat._id
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {otherUser.avatar ? (
                            <img src={otherUser.avatar} alt={otherUser.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            otherUser.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        {otherUser.isOnline ? (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                        ) : (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {otherUser.username}
                          </h3>
                          {unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-2 p-4">
              {filteredUsers.map(userItem => (
                <div
                  key={userItem._id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {userItem.avatar ? (
                          <img src={userItem.avatar} alt={userItem.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          userItem.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      {userItem.isOnline ? (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      ) : (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{userItem.username}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{userItem.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {userItem.workExperience || 'No experience listed'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {userItem.domains.slice(0, 3).map((domain, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleStartChat(userItem._id)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Chat
                    </button>
                    {!userItem.isFriend && (
                      <button
                        onClick={() => handleSendCollaborationRequest(userItem._id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <UserPlus className="w-4 h-4 inline mr-1" />
                        Request
                      </button>
                    )}
                    {userItem.isFriend && (
                      <button
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg cursor-default text-sm"
                        disabled
                      >
                        <UserCheck className="w-4 h-4 inline mr-1" />
                        Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-2 p-4">
              {pendingRequests.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No pending requests
                </p>
              ) : (
                pendingRequests.map(request => (
                  <div key={request._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {request.from.avatar ? (
                          <img src={request.from.avatar} alt={request.from.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          request.from.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{request.from.username}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{request.from.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {request.from.workExperience || 'No experience listed'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {request.from.domains.slice(0, 3).map((domain, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleAcceptRequest(request._id, request.from._id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {getOtherParticipant(selectedChat)?.avatar ? (
                        <img 
                          src={getOtherParticipant(selectedChat)?.avatar} 
                          alt={getOtherParticipant(selectedChat)?.username} 
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        getOtherParticipant(selectedChat)?.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    {getOtherParticipant(selectedChat)?.isOnline ? (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    ) : (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {getOtherParticipant(selectedChat)?.username}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getOtherParticipant(selectedChat)?.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message._id}
                  className={`flex ${message.sender._id === getUserId() ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${
                    message.sender._id === getUserId()
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                  } rounded-2xl p-3 shadow-md`}>
                    {message.messageType === 'image' && message.fileUrl && (
                      <img src={message.fileUrl} alt="Shared image" className="rounded-lg mb-2 max-w-full" />
                    )}
                    {message.messageType === 'document' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm">{message.fileName}</span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    {message.isQuestion && (
                      <div className="mt-2 flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-yellow-300" />
                        <span className="text-xs">Question</span>
                        {message.isSolved ? (
                          <span className="text-xs bg-green-500 px-2 py-1 rounded-full">
                            ✓ Solved by {message.solvedBy?.username}
                          </span>
                        ) : (
                          message.sender._id !== getUserId() && (
                            <button
                              onClick={() => handleSolveQuestion(message._id)}
                              className="text-xs bg-green-500 px-2 py-1 rounded-full hover:bg-green-600"
                            >
                              Solve (+1 pt)
                            </button>
                          )
                        )}
                      </div>
                    )}
                    <p className="text-xs mt-2 opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {typingUsers.size > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Someone is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="question"
                  checked={isQuestion}
                  onChange={(e) => setIsQuestion(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="question" className="text-sm text-gray-700 dark:text-gray-300">
                  Mark as Question
                </label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a chat to start messaging
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Choose from your existing chats or browse users to start a new conversation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leaderboard</h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={entry._id}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      idx === 0 ? 'bg-yellow-100 dark:bg-yellow-900' :
                      idx === 1 ? 'bg-gray-200 dark:bg-gray-700' :
                      idx === 2 ? 'bg-orange-100 dark:bg-orange-900' :
                      'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-900 dark:text-white">
                      {idx + 1}
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {entry.user?.avatar ? (
                        <img src={entry.user.avatar} alt={entry.user.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        entry.user?.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{entry.user?.username}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.questionsSolved} questions solved
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="w-5 h-5" />
                      <span className="font-bold">{entry.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Group Chat</h2>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Members
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredUsers.map(userItem => (
                      <div
                        key={userItem._id}
                        onClick={() => toggleUserSelection(userItem._id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.includes(userItem._id)
                            ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {userItem.avatar ? (
                              <img src={userItem.avatar} alt={userItem.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              userItem.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{userItem.username}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{userItem.email}</p>
                          </div>
                          {selectedUsers.includes(userItem._id) && (
                            <Check className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreateGroup}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
