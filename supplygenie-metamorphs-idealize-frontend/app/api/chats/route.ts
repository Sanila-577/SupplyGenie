import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Define types for better type safety
interface SupplierField {
  label: string;
  value: string;
  type: "text" | "badge" | "rating" | "price" | "location" | "time";
}

interface Supplier {
  id: string;
  name: string;
  fields: SupplierField[];
}

interface ChatMessage {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  suppliers?: Supplier[];
  // Legacy fields for backward compatibility
  role?: string;
  message?: string;
  order?: number;
  sender?: string;
}

interface Chat {
  chat_id: string;
  chat_name: string;
  messages: ChatMessage[];
}

interface UserChats {
  user_id: string;
  chat_history: Chat[];
}

export async function GET(req: NextRequest) {
  try {
    // Extract user_id from query parameters
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("userchats");
    const userDoc = await db.collection<UserChats>("chats").findOne({ user_id });
    if (!userDoc) return NextResponse.json({ chats: [] });
    return NextResponse.json({ chats: userDoc.chat_history || [] });
  } catch (e) {
    console.error("GET /api/chats error:", e);
    return NextResponse.json({ error: "Failed to fetch chats", details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_id, message } = body;
    if (!user_id || !chat_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('userchats');
    // Find the user document and the correct chat in chat_history
    const result = await db.collection<UserChats>('chats').findOneAndUpdate(
      { user_id, 'chat_history.chat_id': chat_id },
      { $push: { 'chat_history.$.messages': message } },
      { returnDocument: 'after' }
    );
    if (!result) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    // Return the updated chat
    const updatedChat = result.chat_history.find((c: Chat) => c.chat_id === chat_id);
    return NextResponse.json({ chat: updatedChat });
  } catch (e) {
    console.error("PATCH /api/chats error:", e);
    return NextResponse.json({ error: 'Failed to update chat', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_name } = body;
    if (!user_id || !chat_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('userchats');
    const newChat: Chat = {
      chat_id: `chat_${Date.now()}`,
      chat_name,
      messages: [],
    };
    // Try to add to existing user document
    const result = await db.collection<UserChats>('chats').findOneAndUpdate(
      { user_id },
      { $push: { chat_history: newChat } },
      { upsert: true, returnDocument: 'after' }
    );
    return NextResponse.json({ chat: newChat });
  } catch (e) {
    console.error("POST /api/chats error:", e);
    return NextResponse.json({ error: 'Failed to create chat', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_id, new_chat_name } = body;
    if (!user_id || !chat_id || !new_chat_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('userchats');
    // Update the chat_name for the correct chat in chat_history
    const result = await db.collection<UserChats>('chats').findOneAndUpdate(
      { user_id, 'chat_history.chat_id': chat_id },
      { $set: { 'chat_history.$.chat_name': new_chat_name } },
      { returnDocument: 'after' }
    );
    if (!result) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const updatedChat = result.chat_history.find((c: Chat) => c.chat_id === chat_id);
    return NextResponse.json({ chat: updatedChat });
  } catch (e) {
    console.error("PUT /api/chats error:", e);
    return NextResponse.json({ error: 'Failed to update chat name', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_id } = body;
    
    if (!user_id || !chat_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('userchats');
    
    // Remove the chat from the user's chat_history
    const result = await db.collection<UserChats>('chats').findOneAndUpdate(
      { user_id },
      { $pull: { chat_history: { chat_id } } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Chat deleted successfully' });
  } catch (e) {
    console.error("DELETE /api/chats error:", e);
    return NextResponse.json({ error: 'Failed to delete chat', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}