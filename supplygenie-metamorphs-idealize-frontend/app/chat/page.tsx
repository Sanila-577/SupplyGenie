"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import ChatPage from "@/components/chat-page"
import { getSupplierRecommendations, transformSupplierData, SupplyChainApiError } from "@/lib/supply-chain-api"

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

interface UserType {
  name: string
  email: string
  avatar?: string
  uid: string
}

export default function Chat() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [currentMessage, setCurrentMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [search, setSearch] = useState("")
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  const handleViewChange = (newView: "home" | "login" | "signup" | "chat") => {
    if (newView === "home") router.push("/")
    if (newView === "login") router.push("/login")
    if (newView === "signup") router.push("/signup")
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activeChat || !user) return;
    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;
    
    const userQuery = currentMessage;
    const userMessage = {
      id: `${activeChat}_${Date.now()}`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };
    
    // Optimistically update UI
    setChats(prev => prev.map(chat =>
      chat.id === activeChat ? { ...chat, messages: [...chat.messages, userMessage] } : chat
    ));
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    
    // Show typing indicator
    setIsAssistantTyping(true);
    
    // Save user message to DB
    await fetch('/api/chats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.uid,
        chat_id: activeChat,
        message: userMessage,
      }),
    });

    try {
      // Build chat history for the API call
      const chatHistory = chat.messages.map(msg => ({
        role: (msg.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      }));

      // Add the current user message to chat history
      chatHistory.push({
        role: 'user' as const,
        content: userQuery
      });

      // Call the supply chain API using the utility function
      const apiData = await getSupplierRecommendations(userQuery, chatHistory);

      setIsAssistantTyping(false);
      
      // Transform API response to match our internal format
      const transformedSuppliers: Supplier[] = apiData.suppliers?.map((supplier, index) => {
        return transformSupplierData(supplier, index);
      }) || [];

      const assistantMessage = {
        id: `${activeChat}_${Date.now()}_a`,
        type: 'assistant',
        content: transformedSuppliers.length > 0 
          ? `I found ${transformedSuppliers.length} supplier${transformedSuppliers.length > 1 ? 's' : ''} that match your requirements. Here are the top matches:`
          : "I couldn't find any suppliers matching your specific requirements. Please try refining your search criteria.",
        timestamp: new Date(),
        suppliers: transformedSuppliers.length > 0 ? transformedSuppliers : undefined,
      };

      setChats(prev => prev.map(chat =>
        chat.id === activeChat ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat
      ));
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to DB
      await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          chat_id: activeChat,
          message: assistantMessage,
        }),
      });

    } catch (error) {
      setIsAssistantTyping(false);
      console.error('Error getting supplier recommendations:', error);
      
      let errorMessage = "I'm sorry, I encountered an error while searching for suppliers. Please try again later.";
      
      if (error instanceof SupplyChainApiError) {
        if (error.status === 400) {
          errorMessage = "I need more information to help you find suppliers. Could you please provide more details about what you're looking for?";
        } else if (error.status === 429) {
          errorMessage = "I'm currently handling many requests. Please wait a moment and try again.";
        }
      }
      
      const errorMessageObj = {
        id: `${activeChat}_${Date.now()}_error`,
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };

      setChats(prev => prev.map(chat =>
        chat.id === activeChat ? { ...chat, messages: [...chat.messages, errorMessageObj] } : chat
      ));
      setMessages(prev => [...prev, errorMessageObj]);
    }
  }

  const createNewChat = async () => {
    if (!user) return;
    const chatName = "New Supplier Search";
    // Create chat in DB
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.uid,
        chat_name: chatName,
      }),
    });
    const data = await res.json();
    if (data.chat) {
      const newChat: Chat = {
        id: data.chat.chat_id,
        title: data.chat.chat_name,
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat.id);
      setMessages([]);
    }
  }

  const handleStartRename = (chat: Chat) => {
    setRenamingChatId(chat.id)
    setRenameValue(chat.title)
  }

  const handleRenameChange = (value: string) => {
    setRenameValue(value)
  }

  const handleRenameSave = async (chatId: string) => {
    const newName = renameValue.trim();
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newName || chat.title } : chat
      )
    );
    setRenamingChatId(null);
    setRenameValue("");
    // Update in DB
    if (user && newName) {
      await fetch('/api/chats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          chat_id: chatId,
          new_chat_name: newName,
        }),
      });
    }
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === "Enter") {
      handleRenameSave(chatId)
    } else if (e.key === "Escape") {
      setRenamingChatId(null)
      setRenameValue("")
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;
    
    // Remove chat from local state
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    
    // If the deleted chat was active, switch to another chat or clear messages
    if (activeChat === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setActiveChat(remainingChats[0].id);
        setMessages(remainingChats[0].messages);
      } else {
        setActiveChat(null);
        setMessages([]);
      }
    }
    
    // Delete from database
    try {
      await fetch('/api/chats', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          chat_id: chatId,
        }),
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId)
  }

  // Authentication guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || "User",
          email: firebaseUser.email || "",
          uid: firebaseUser.uid,
        })
      } else {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  // Load chats when user is authenticated
  useEffect(() => {
    if (user) {
      fetch(`/api/chats?user_id=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.chats) {
            const loadedChats = data.chats.map((chat: any) => ({
              id: chat.chat_id,
              title: chat.chat_name,
              messages: (chat.messages || []).map((m: any) => {
                // Handle both old format (order, sender, message) and new format (id, type, content, suppliers)
                if (m.id && m.type && m.content !== undefined) {
                  // New format - return as is
                  return {
                    id: m.id,
                    type: m.type,
                    content: m.content,
                    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                    suppliers: m.suppliers || undefined,
                  }
                } else {
                  // Old format - convert to new format
                  return {
                    id: `${chat.chat_id}_${m.order || Date.now()}`,
                    type: m.sender === 'user' ? 'user' : (m.sender === 'bot' ? 'assistant' : m.sender || 'assistant'),
                    content: m.message || m.content || '',
                    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                    suppliers: undefined,
                  }
                }
              })
            }))
            setChats(loadedChats)
            if (!activeChat && loadedChats.length > 0) {
              setActiveChat(loadedChats[0].id)
            }
          }
        })
        .catch(error => {
          console.error('Error loading chats:', error)
        })
    }
  }, [user, activeChat])

  useEffect(() => {
    const chat = chats.find(c => c.id === activeChat)
    setMessages(chat ? chat.messages : [])
  }, [activeChat, chats])

  // Only render chat if user is authenticated
  if (!user) {
    return null
  }

  return (
    <ChatPage
      user={user}
      chats={chats}
      activeChat={activeChat}
      messages={messages}
      currentMessage={currentMessage}
      search={search}
      isAssistantTyping={isAssistantTyping}
      renamingChatId={renamingChatId}
      renameValue={renameValue}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
      onChatSelect={handleChatSelect}
      onCreateNewChat={createNewChat}
      onSendMessage={handleSendMessage}
      onMessageChange={setCurrentMessage}
      onSearchChange={setSearch}
      onStartRename={handleStartRename}
      onRenameChange={handleRenameChange}
      onRenameSave={handleRenameSave}
      onRenameKeyDown={handleRenameKeyDown}
      setRenamingChatId={setRenamingChatId}
      onDeleteChat={handleDeleteChat}
    />
  )
}
