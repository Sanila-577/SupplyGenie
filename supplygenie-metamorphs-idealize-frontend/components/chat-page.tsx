"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Send,
  Plus,
  Clock,
  MapPin,
  Star,
  Mic,
  Phone,
  Globe,
  Building,
  Mail,
  LogOut,
  Menu,
  X,
  Trash2,
} from "lucide-react"
import { useSpeechToText } from "@/hooks/useSpeechToText"
import { useIsMobile } from "@/hooks/use-mobile"

interface UserType {
  name: string
  email: string
  avatar?: string
  uid: string
}

interface SupplierField {
  label: string
  value: string
  type: "text" | "badge" | "rating" | "price" | "location" | "time"
}

interface Message {
  id: string
  type: string
  content: string
  timestamp: Date
  suppliers?: Supplier[]
}

interface Supplier {
  id: string
  name: string
  fields: SupplierField[]
}

interface Chat {
  id: string
  title: string
  messages: Message[]
}

interface ChatPageProps {
  user: UserType
  chats: Chat[]
  activeChat: string | null
  messages: Message[]
  currentMessage: string
  search: string
  isAssistantTyping: boolean
  renamingChatId: string | null
  renameValue: string
  onViewChange: (view: "home" | "login" | "signup" | "chat") => void
  onLogout: () => void
  onChatSelect: (chatId: string) => void
  onCreateNewChat: () => void
  onSendMessage: () => void
  onMessageChange: (message: string) => void
  onSearchChange: (search: string) => void
  onStartRename: (chat: Chat) => void
  onRenameChange: (value: string) => void
  onRenameSave: (chatId: string) => void
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => void
  setRenamingChatId: (id: string | null) => void
  onDeleteChat: (chatId: string) => void
}

// Reusable style constants
const STYLE_CONSTANTS = {
  avatarBase: "w-10 h-10 bg-zinc-800 border border-zinc-700",
  dropdownBase: "bg-zinc-900 border-zinc-800",
}

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 px-2 py-1">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
)

// User Avatar Dropdown component
const UserAvatarDropdown = ({ user, onLogout }: { user: UserType; onLogout: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className={STYLE_CONSTANTS.avatarBase}>
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className={STYLE_CONSTANTS.dropdownBase} align="end" forceMount>
      <div className="flex flex-col space-y-1 p-2">
        <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
        <p className="text-xs leading-none text-zinc-400">{user?.email}</p>
      </div>
      <DropdownMenuSeparator className="bg-zinc-800" />
      <DropdownMenuItem onClick={onLogout} className="text-white hover:bg-zinc-800 cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

interface ContactButtonProps {
  type: 'email' | 'phone' | 'website'
  value: string
}

const ContactButton = ({ type, value }: ContactButtonProps) => {
  const getIcon = () => {
    switch (type) {
      case 'email':
        return Mail
      case 'phone':
        return Phone
      case 'website':
        return Globe
      default:
        return Mail
    }
  }

  const getHref = () => {
    const cleanValue = value.trim()
    switch (type) {
      case 'email':
        if (cleanValue.includes('@')) {
          return `mailto:${cleanValue}`
        }
        return '#'
      case 'phone':
        const phoneNumber = cleanValue.replace(/[^\d+()-]/g, '')
        if (phoneNumber) {
          return `tel:${phoneNumber}`
        }
        return '#'
      case 'website':
        if (cleanValue.startsWith('http://') || cleanValue.startsWith('https://')) {
          return cleanValue
        } else if (cleanValue.includes('.')) {
          return `https://${cleanValue}`
        }
        return '#'
      default:
        return '#'
    }
  }

  const getTitle = () => {
    const cleanValue = value.trim()
    switch (type) {
      case 'email':
        return `Send email to ${cleanValue}`
      case 'phone':
        return `Call ${cleanValue}`
      case 'website':
        return `Visit website: ${cleanValue}`
      default:
        return ''
    }
  }

  const handleClick = () => {
    try {
      const href = getHref()
      if (href && href !== '#') {
        window.open(href, '_blank')
      }
    } catch (error) {
      console.error('Error opening contact link:', error)
    }
  }

  const Icon = getIcon()

  return (
    <Button 
      size="sm" 
      variant="ghost" 
      className="p-2 h-8 w-8 bg-secondary border border-border text-accent-foreground hover:text-primary-foreground hover:bg-accent hover:border-accent transition-all duration-200 rounded-lg"
      onClick={handleClick}
      title={getTitle()}
    >
      <Icon className="w-4 h-4" />
    </Button>
  )
}

const renderFieldValue = (field: SupplierField) => {
  // Ensure the value is always a string
  const safeValue = typeof field.value === 'string' ? field.value : JSON.stringify(field.value);
  
  switch (field.type) {
    case "badge":
      if (safeValue === "N/A") {
        return <span className="text-xs md:text-sm text-muted-foreground">N/A</span>
      }
      return (
        <div className="flex flex-wrap gap-1">
          {safeValue.split(",").map((item, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs bg-secondary border border-border text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 px-1.5 md:px-2 py-0.5 md:py-1 break-words"
            >
              {item.trim()}
            </Badge>
          ))}
        </div>
      )
    case "rating":
      if (safeValue === "N/A") {
        return <span className="text-xs md:text-sm text-muted-foreground">N/A</span>
      }
      return (
        <div className="flex items-center space-x-1">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
          <span className="text-xs md:text-sm font-medium text-foreground">{safeValue}</span>
        </div>
      )
    case "location":
      return (
        <div className="flex items-center space-x-1 min-w-0">
          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs md:text-sm truncate text-card-foreground">{safeValue}</span>
        </div>
      )
    case "time":
      return (
        <div className="flex items-center space-x-1 min-w-0">
          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs md:text-sm truncate text-card-foreground">{safeValue}</span>
        </div>
      )
    case "price":
      return <span className="text-xs md:text-sm font-medium text-green-500 break-words">{safeValue}</span>
    default:
      return <span className="text-xs md:text-sm break-words text-card-foreground">{safeValue}</span>
  }
}

export default function ChatPage({
  user,
  chats,
  activeChat,
  messages,
  currentMessage,
  search,
  isAssistantTyping,
  renamingChatId,
  renameValue,
  onViewChange,
  onLogout,
  onChatSelect,
  onCreateNewChat,
  onSendMessage,
  onMessageChange,
  onSearchChange,
  onStartRename,
  onRenameChange,
  onRenameSave,
  onRenameKeyDown,
  setRenamingChatId,
  onDeleteChat,
}: ChatPageProps) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null)
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [contextMenuChat, setContextMenuChat] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const renameInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    isSupported: isSpeechSupported,
    isRecording,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    setTranscript,
  } = useSpeechToText()

  // Update currentMessage when transcript changes (only if recording and not assistant typing)
  useEffect(() => {
    if (isRecording && !isAssistantTyping) {
      onMessageChange(transcript)
    }
  }, [transcript, isRecording, isAssistantTyping, onMessageChange])

  // Optionally clear transcript when message is sent
  useEffect(() => {
    if (!currentMessage && !isRecording) {
      setTranscript("")
    }
  }, [currentMessage, isRecording, setTranscript])

  // When recording ends and transcript is available, set it as the message and focus input (only if not assistant typing)
  useEffect(() => {
    if (!isRecording && transcript && !isAssistantTyping) {
      onMessageChange(transcript)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [isRecording, transcript, isAssistantTyping, onMessageChange])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeChat, isAssistantTyping])

  useEffect(() => {
    if (renamingChatId && renameInputRef.current) {
      renameInputRef.current.focus()
    }
  }, [renamingChatId])

  // Filter chats for display:
  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()))

  // Mobile chat selection handler
  const handleMobileChatSelect = (chatId: string) => {
    onChatSelect(chatId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  // Swipe handlers for chat deletion
  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    if (renamingChatId) return // Don't allow swipe during rename
    setSwipeStartX(e.touches[0].clientX)
    setSwipedChatId(chatId)
    setSwipeDistance(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipedChatId || renamingChatId) return
    const currentX = e.touches[0].clientX
    const distance = swipeStartX - currentX
    
    // Only allow left swipe (positive distance)
    if (distance > 0) {
      setSwipeDistance(Math.min(distance, 80)) // Max swipe distance of 80px
    } else {
      setSwipeDistance(0)
    }
  }

  const handleTouchEnd = () => {
    if (!swipedChatId || renamingChatId) return
    
    // If swipe distance is less than 40px, reset
    if (swipeDistance < 40) {
      setSwipeDistance(0)
      setSwipedChatId(null)
    }
    // If swipe distance is more than 40px, keep it swiped
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteChat(chatId)
    setSwipedChatId(null)
    setSwipeDistance(0)
  }

  const resetSwipe = () => {
    setSwipedChatId(null)
    setSwipeDistance(0)
  }

  // Handle right-click context menu for desktop
  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    if (!isMobile) {
      e.preventDefault()
      setContextMenuChat(chatId)
      
      // Calculate position to ensure menu doesn't go off-screen
      const menuWidth = 120
      const menuHeight = 40
      const x = e.clientX + menuWidth > window.innerWidth 
        ? e.clientX - menuWidth 
        : e.clientX
      const y = e.clientY + menuHeight > window.innerHeight 
        ? e.clientY - menuHeight 
        : e.clientY
        
      setContextMenuPosition({ x, y })
    }
  }

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const handleOutsideClick = () => setSidebarOpen(false)
      document.addEventListener('click', handleOutsideClick)
      return () => document.removeEventListener('click', handleOutsideClick)
    }
  }, [isMobile, sidebarOpen])

  // Reset swipe when renaming starts
  useEffect(() => {
    if (renamingChatId) {
      resetSwipe()
    }
  }, [renamingChatId])

  // Reset swipe when search changes
  useEffect(() => {
    resetSwipe()
  }, [search])

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      if (activeChat && (e.key === 'Delete' || e.key === 'Backspace') && !renamingChatId) {
        // Only delete if we're not editing a chat name and there's an active chat
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          onDeleteChat(activeChat)
        }
      }
      if (e.key === 'Escape') {
        setContextMenuChat(null)
      }
    }

    const handleClickOutsideWrapper = (e: MouseEvent) => {
      if (contextMenuChat) {
        setContextMenuChat(null)
      }
    }

    document.addEventListener('keydown', handleKeyDownWrapper)
    document.addEventListener('click', handleClickOutsideWrapper)
    return () => {
      document.removeEventListener('keydown', handleKeyDownWrapper)
      document.removeEventListener('click', handleClickOutsideWrapper)
    }
  }, [activeChat, renamingChatId, contextMenuChat, onDeleteChat])

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={() => onViewChange('home')}
            className="focus:outline-none"
            aria-label="Go to home page"
            type="button"
          >
            <img 
              src="/logo.png" 
              alt="SupplyGenie Logo" 
              className="h-6 md:h-8 w-auto cursor-pointer"
            />
          </button>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {isMobile && activeChat && (
            <h1 className="text-sm md:text-xl font-semibold truncate max-w-32">
              {chats.find(c => c.id === activeChat)?.title || "Chat"}
            </h1>
          )}
          <UserAvatarDropdown user={user} onLogout={onLogout} />
        </div>
      </header>
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`
          ${isMobile 
            ? `fixed left-0 top-0 h-full w-80 bg-zinc-900 border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }` 
            : 'w-[340px] bg-zinc-900 border-r border-zinc-800'
          } flex flex-col
        `}>
          {isMobile && (
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">My Chats</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          {!isMobile && (
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-lg font-semibold">My Chats</h2>
              <div className="flex items-center space-x-2">
                <Button size="icon" className="bg-zinc-800 rounded-full p-0 w-8 h-8 flex items-center justify-center text-white" onClick={onCreateNewChat}>
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Mobile new chat button */}
          {isMobile && (
            <div className="px-4 py-2">
              <Button 
                className="w-full bg-zinc-800 text-white rounded-lg flex items-center justify-center space-x-2" 
                onClick={() => {
                  onCreateNewChat()
                  setSidebarOpen(false)
                }}
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </Button>
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex items-center px-4 md:px-6 space-x-2 mb-3">
            <Button size="sm" className="bg-zinc-800 text-white rounded-full px-4 py-1 text-xs font-semibold">
              CHATS <span className="ml-2 bg-zinc-800 rounded px-2">{chats.length}</span>
            </Button>
          </div>
          
          {/* Search and filter */}
          <div className="flex items-center px-4 md:px-6 mb-3 space-x-2">
            <div className="flex-1 relative">
              <input
                className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm border-none outline-none placeholder-zinc-400"
                placeholder="Search..."
                value={search}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
            {/* Hamburger menu - only show on mobile */}
            <Button size="icon" className="bg-zinc-800 rounded-lg p-0 w-8 h-8 flex items-center justify-center text-white md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Button>
          </div>
          
          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className="mb-2 relative overflow-hidden rounded-xl"
                onTouchStart={(e) => handleTouchStart(e, chat.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Delete button background */}
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-red-500 flex items-center justify-center transition-all duration-200 ease-out"
                  style={{ 
                    width: swipedChatId === chat.id ? '80px' : '0px',
                    opacity: swipedChatId === chat.id ? 1 : 0
                  }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-red-600 h-8 w-8"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Chat content */}
                <div
                  className={`rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 ease-out ${
                    activeChat === chat.id ? "bg-zinc-800" : "hover:bg-zinc-800/70"
                  }`}
                  style={{
                    transform: swipedChatId === chat.id ? `translateX(-${swipeDistance}px)` : 'translateX(0)',
                  }}
                  onClick={() => {
                    if (swipedChatId === chat.id && swipeDistance > 0) {
                      resetSwipe()
                    } else {
                      handleMobileChatSelect(chat.id)
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(e, chat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {renamingChatId === chat.id ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => onRenameChange(e.target.value)}
                          onBlur={() => onRenameSave(chat.id)}
                          onKeyDown={e => onRenameKeyDown(e, chat.id)}
                          className="font-medium text-sm truncate text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-32 outline-none"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center group/chat-title">
                          <span
                            className="font-medium text-sm truncate text-white group-hover:text-white cursor-pointer"
                            onClick={e => { 
                              e.stopPropagation(); 
                              if (swipedChatId !== chat.id || swipeDistance === 0) {
                                onStartRename(chat);
                              }
                            }}
                            title="Click to rename"
                          >
                            {chat.title}
                          </span>
                          <button
                            className="ml-1 opacity-0 group-hover/chat-title:opacity-100 text-zinc-400 hover:text-white transition"
                            onClick={e => { 
                              e.stopPropagation(); 
                              if (swipedChatId !== chat.id || swipeDistance === 0) {
                                onStartRename(chat);
                              }
                            }}
                            tabIndex={-1}
                            title="Rename"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3zm0 0v3h3" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400">{chat.messages.length} messages</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
        
        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-zinc-950">
          {/* Chat Title Bar */}
          {!isMobile && (
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
              <h1 className="text-xl font-semibold">{chats.find(c => c.id === activeChat)?.title || "Select a chat"}</h1>
            </div>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 flex flex-col px-4 md:px-8 py-4 md:py-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
                No messages yet.
              </div>
            ) : (
              <>
                {messages.map((message, idx) => (
                  <div
                    key={`${message.id}_${message.type}_${message.timestamp?.toString() || ''}_${idx}`}
                    className={`mb-4 md:mb-6 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type !== 'user' && (
                      <div className="flex-shrink-0 mr-2 md:mr-3 flex items-start">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border border-zinc-700 shadow-md">
                          {/* AI Robot Icon */}
                          <svg className="w-4 h-4 md:w-6 md:h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path 
                              d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" 
                              fill="currentColor"
                            />
                            <circle cx="9" cy="12" r="1" fill="currentColor"/>
                            <circle cx="15" cy="12" r="1" fill="currentColor"/>
                            <path 
                              d="M8 19C8 17.5 9.5 16 12 16C14.5 16 16 17.5 16 19" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round"
                              fill="none"
                            />
                            <rect 
                              x="6" 
                              y="8" 
                              width="12" 
                              height="8" 
                              rx="4" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              fill="none"
                            />
                            <path 
                              d="M9 8V6C9 5.5 9.5 5 10 5H14C14.5 5 15 5.5 15 6V8" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              fill="none"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className={`flex flex-col ${message.type === 'user' ? 'items-end max-w-xs md:max-w-xl' : 'items-start max-w-full'}`}>
                      <div
                        className={`rounded-2xl px-3 md:px-5 py-3 md:py-4 text-sm md:text-base shadow-lg transition-colors duration-150 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white self-end border border-blue-700 hover:shadow-blue-700/30'
                            : 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-white self-start border border-zinc-700 hover:shadow-black/20'
                        } hover:brightness-105`}
                      >
                        {message.content}
                      </div>
                      
                      {/* Supplier Results Section */}
                      {message.suppliers && message.suppliers.length > 0 && (
                        <div className="mt-4 w-full max-w-full">
                          {/* Header */}
                          <div className="bg-card border border-border rounded-xl p-3 md:p-4 mb-4 md:mb-6">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                                <Building className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground leading-tight">
                                  Top Supplier Matches
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                  Found <span className="font-semibold text-foreground">{message.suppliers.length}</span> suppliers matching your criteria
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Supplier Cards Grid - Mobile responsive */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                            {message.suppliers.map((supplier) => (
                              <Card
                                key={supplier.id}
                                className="group bg-card border border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
                              >
                                <CardHeader className="pb-2 md:pb-3 relative flex-shrink-0">
                                  {/* Background gradient accent */}
                                  <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-accent/10 rounded-bl-3xl" />
                                  
                                  <div className="flex items-start justify-between relative z-10 gap-2">
                                    <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                                      <div className="flex items-start gap-2">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                                          <Building className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <CardTitle className="text-sm md:text-base lg:text-lg font-bold text-card-foreground mb-1 leading-tight group-hover:text-foreground transition-colors overflow-hidden"
                                            style={{
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              wordBreak: 'break-word'
                                            }}
                                          >
                                            {supplier.name}
                                          </CardTitle>
                                          {supplier.fields.find((f: SupplierField) => f.label === "Location") && (
                                            <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                                              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-accent-foreground flex-shrink-0" />
                                              <span className="truncate text-xs md:text-sm">{supplier.fields.find((f: SupplierField) => f.label === "Location")?.value}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {supplier.fields.find((f: SupplierField) => f.label === "Rating") && (
                                      <div className="flex items-center gap-1 md:gap-1.5 bg-secondary border border-border px-2 md:px-3 py-1 md:py-1.5 rounded-full flex-shrink-0">
                                        <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs md:text-sm font-semibold text-secondary-foreground">
                                          {supplier.fields.find((f: SupplierField) => f.label === "Rating")?.value}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3 md:space-y-4 pt-0 flex-1 flex flex-col">
                                  {/* Key Information Section */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                    {/* Price Range */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "Price Range") && (
                                      <div className="bg-secondary/50 border border-border rounded-lg p-2 md:p-3 space-y-1 min-w-0">
                                        <div className="flex items-center gap-1 md:gap-1.5 text-accent-foreground">
                                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-accent-foreground flex-shrink-0" />
                                          <span className="text-xs font-medium uppercase tracking-wide">Price Range</span>
                                        </div>
                                        <p className="text-xs md:text-sm font-semibold text-green-500 break-words">
                                          {supplier.fields.find((f: SupplierField) => f.label === "Price Range")?.value}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* MOQ */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "MOQ") && (
                                      <div className="bg-secondary/50 border border-border rounded-lg p-2 md:p-3 space-y-1 min-w-0">
                                        <div className="flex items-center gap-1 md:gap-1.5 text-accent-foreground">
                                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-accent-foreground flex-shrink-0" />
                                          <span className="text-xs font-medium uppercase tracking-wide">MOQ</span>
                                        </div>
                                        <p className="text-xs md:text-sm font-semibold text-foreground break-words">
                                          {supplier.fields.find((f: SupplierField) => f.label === "MOQ")?.value}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Timing Information */}
                                  <div className="space-y-2 md:space-y-3">
                                    {/* Lead Time */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "Lead Time") && (
                                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border gap-2 min-w-0">
                                        <div className="flex items-center gap-1 md:gap-2 text-muted-foreground min-w-0">
                                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-accent-foreground flex-shrink-0" />
                                          <span className="text-xs md:text-sm font-medium truncate">Lead Time</span>
                                        </div>
                                        <span className="text-xs md:text-sm font-semibold text-foreground flex-shrink-0">
                                          {supplier.fields.find((f: SupplierField) => f.label === "Lead Time")?.value}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Response Time */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "Response Time") && (
                                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border gap-2 min-w-0">
                                        <div className="flex items-center gap-1 md:gap-2 text-muted-foreground min-w-0">
                                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-accent-foreground flex-shrink-0" />
                                          <span className="text-xs md:text-sm font-medium truncate">Response Time</span>
                                        </div>
                                        <span className="text-xs md:text-sm font-semibold text-foreground flex-shrink-0">
                                          {supplier.fields.find((f: SupplierField) => f.label === "Response Time")?.value}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Additional Information */}
                                  <div className="space-y-2 md:space-y-3">
                                    {/* Stock */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "Stock") && 
                                     supplier.fields.find((f: SupplierField) => f.label === "Stock")?.value !== "N/A" && (
                                      <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 gap-2 min-w-0">
                                        <span className="text-xs md:text-sm text-muted-foreground truncate">Stock Level</span>
                                        <span className="text-xs md:text-sm font-medium text-card-foreground flex-shrink-0">
                                          {supplier.fields.find((f: SupplierField) => f.label === "Stock")?.value}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Time Zone */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "Time Zone") && 
                                     supplier.fields.find((f: SupplierField) => f.label === "Time Zone")?.value !== "N/A" && (
                                      <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 gap-2 min-w-0">
                                        <span className="text-xs md:text-sm text-muted-foreground truncate">Time Zone</span>
                                        <span className="text-xs md:text-sm font-medium text-card-foreground flex-shrink-0">
                                          {supplier.fields.find((f: SupplierField) => f.label === "Time Zone")?.value}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Certifications & Specialties */}
                                  <div className="space-y-2 md:space-y-3">
                                    {/* Certifications */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "Certifications") && 
                                     supplier.fields.find((f: SupplierField) => f.label === "Certifications")?.value !== "N/A" && (
                                      <div className="space-y-1 md:space-y-2">
                                        <div className="flex items-center gap-1 md:gap-2">
                                          <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-accent-foreground flex-shrink-0" />
                                          <span className="text-xs md:text-sm font-medium text-accent-foreground">Certifications</span>
                                        </div>
                                        <div className="pl-2 md:pl-3">
                                          {renderFieldValue(supplier.fields.find((f: SupplierField) => f.label === "Certifications")!)}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Specialties */}
                                    {supplier.fields.find((f: SupplierField) => f.label === "Specialties") && 
                                     supplier.fields.find((f: SupplierField) => f.label === "Specialties")?.value !== "N/A" && (
                                      <div className="space-y-1 md:space-y-2">
                                        <div className="flex items-center gap-1 md:gap-2">
                                          <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-accent-foreground flex-shrink-0" />
                                          <span className="text-xs md:text-sm font-medium text-accent-foreground">Specialties</span>
                                        </div>
                                        <div className="pl-2 md:pl-3">
                                          {renderFieldValue(supplier.fields.find((f: SupplierField) => f.label === "Specialties")!)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Other Fields */}
                                  <div className="flex-1">
                                    {supplier.fields
                                      .filter((f: SupplierField) => !["Location", "Rating", "Price Range", "Lead Time", "Response Time", "MOQ", "Stock", "Time Zone", "Certifications", "Specialties", "Email", "Phone", "Website"].includes(f.label))
                                      .length > 0 && (
                                      <div className="space-y-2 pt-2 border-t border-border">
                                        {supplier.fields
                                          .filter((f: SupplierField) => !["Location", "Rating", "Price Range", "Lead Time", "Response Time", "MOQ", "Stock", "Time Zone", "Certifications", "Specialties", "Email", "Phone", "Website"].includes(f.label))
                                          .map((field: SupplierField, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 gap-2 min-w-0">
                                              <span className="text-xs md:text-sm text-muted-foreground truncate">{field.label}</span>
                                              <div className="text-right flex-shrink-0">
                                                {renderFieldValue(field)}
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Contact Information - Always at the bottom */}
                                  {supplier.fields.find((f: SupplierField) => f.label === "Website") && (
                                    <div className="pt-3 md:pt-4 mt-auto border-t border-border">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 md:gap-2 min-w-0">
                                          <Globe className="w-3 h-3 md:w-4 md:h-4 text-accent-foreground flex-shrink-0" />
                                          <span className="text-xs md:text-sm font-medium text-accent-foreground">Contact</span>
                                        </div>
                                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                                          {supplier.fields
                                            .filter((f: SupplierField) => f.label === "Website")
                                            .map((field: SupplierField, index: number) => (
                                              <ContactButton 
                                                key={index}
                                                type="website" 
                                                value={typeof field.value === 'string' ? field.value : ''} 
                                              />
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 ml-2 md:ml-3 flex items-start">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-blue-700 shadow-md">
                          {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isAssistantTyping && (
                  <div className="mb-4 md:mb-6 flex justify-start">
                    <div className="flex-shrink-0 mr-2 md:mr-3 flex items-start">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border border-zinc-700 shadow-md">
                        {/* AI Robot Icon */}
                        <svg className="w-4 h-4 md:w-6 md:h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path 
                            d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" 
                            fill="currentColor"
                          />
                          <circle cx="9" cy="12" r="1" fill="currentColor"/>
                          <circle cx="15" cy="12" r="1" fill="currentColor"/>
                          <path 
                            d="M8 19C8 17.5 9.5 16 12 16C14.5 16 16 17.5 16 19" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeLinecap="round"
                            fill="none"
                          />
                          <rect 
                            x="6" 
                            y="8" 
                            width="12" 
                            height="8" 
                            rx="4" 
                            stroke="currentColor" 
                            strokeWidth="1.5"
                            fill="none"
                          />
                          <path 
                            d="M9 8V6C9 5.5 9.5 5 10 5H14C14.5 5 15 5.5 15 6V8" 
                            stroke="currentColor" 
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col items-start max-w-full">
                      <div className="rounded-2xl px-3 md:px-5 py-3 md:py-4 text-sm md:text-base shadow-lg transition-colors duration-150 bg-gradient-to-br from-zinc-800 to-zinc-900 text-white self-start border border-zinc-700 hover:shadow-black/20 hover:brightness-105">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Input Bar */}
          <div className="px-4 md:px-8 py-4 md:py-6 border-t border-zinc-800 bg-zinc-900">
            <div className="flex items-center space-x-2 md:space-x-3">
              <input
                ref={inputRef}
                className={`flex-1 h-10 md:h-12 bg-zinc-800 border-none rounded-lg px-3 md:px-4 text-sm md:text-base text-white placeholder-zinc-400 outline-none ${
                  isAssistantTyping ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder={isAssistantTyping ? "Assistant is typing..." : "Ask questions"}
                value={currentMessage}
                onChange={e => onMessageChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !isAssistantTyping) onSendMessage() }}
                disabled={isAssistantTyping}
              />
              <Button
                size="icon"
                className={`bg-zinc-800 rounded-lg p-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white ${
                  isRecording ? 'animate-pulse bg-blue-700' : ''
                } ${isAssistantTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={isRecording ? stopListening : startListening}
                type="button"
                title={isRecording ? "Stop recording" : "Start voice input"}
                disabled={!isSpeechSupported || isAssistantTyping}
              >
                <Mic className={`w-4 h-4 md:w-5 md:h-5 ${isRecording ? 'text-blue-400' : 'text-white'}`} />
              </Button>
              <Button 
                size="icon" 
                className={`bg-zinc-800 rounded-lg p-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white ${
                  isAssistantTyping ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={onSendMessage}
                disabled={isAssistantTyping || !currentMessage.trim()}
              >
                <Send className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </Button>
            </div>
            {!isSpeechSupported && (
              <div className="text-xs text-red-400 mt-2">Voice input is not supported in this browser.</div>
            )}
            {speechError && (
              <div className="text-xs text-red-400 mt-2">{speechError}</div>
            )}
          </div>
        </main>
      </div>
      
      {/* Desktop Context Menu */}
      {contextMenuChat && !isMobile && (
        <div
          className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700 flex items-center space-x-2"
            onClick={() => {
              onDeleteChat(contextMenuChat)
              setContextMenuChat(null)
            }}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Delete Chat</span>
          </button>
        </div>
      )}
    </div>
  )
}
