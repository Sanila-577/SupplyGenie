import { NextRequest, NextResponse } from "next/server";

// Define types for the API request and response
interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface SupplyChainRequest {
  query: string;
  chat_history: ChatHistoryItem[];
}

interface SupplierResponse {
  company_name: string;
  location?: string;
  rating?: number;
  price_range?: string;
  lead_time?: string;
  moq?: string;
  certifications?: string[];
  specialties?: string[];
  response_time?: string;
  contact?: string;
}

interface SupplyChainResponse {
  suppliers: SupplierResponse[];
}

const BACKEND_API_URL = process.env.NEXT_PUBLIC_SUPPLY_CHAIN_API_URL || "https://supply-genie-api-vfdvezljna-uc.a.run.app/api/v1/supply-chain/recommendations";

export async function POST(req: NextRequest) {
  try {
    const body: SupplyChainRequest = await req.json();
    const { query, chat_history } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Making request to supply chain API:', { 
      query: query.substring(0, 100) + '...', 
      historyLength: chat_history?.length || 0 
    });

    // Make request to the backend API
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        chat_history: chat_history || [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', { 
        status: response.status, 
        statusText: response.statusText, 
        error: errorText 
      });
      return NextResponse.json(
        { error: 'Failed to get recommendations from backend', details: errorText },
        { status: response.status }
      );
    }

    const data: SupplyChainResponse = await response.json();
    console.log('Backend API success:', { suppliersCount: data.suppliers?.length || 0 });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Supply chain API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
