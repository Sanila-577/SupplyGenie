// API utility functions for supply chain operations

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface SupplierApiResponse {
  company_name: string;
  location?: string;
  rating?: number;
  price_range?: string;
  lead_time?: string;
  moq?: string;
  certifications?: string[];
  specialties?: string[];
  response_time?: string;
  stock?: string;
  time_zone?: string;
  contact?: string | { website?: string; phone?: string; email?: string } | any;
}

export interface SupplyChainApiResponse {
  suppliers: SupplierApiResponse[];
}

export interface SupplyChainRequest {
  query: string;
  chat_history: ChatHistoryItem[];
}

export class SupplyChainApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'SupplyChainApiError';
  }
}

export async function getSupplierRecommendations(
  query: string,
  chatHistory: ChatHistoryItem[] = []
): Promise<SupplyChainApiResponse> {
  const request: SupplyChainRequest = {
    query,
    chat_history: chatHistory,
  };

  const response = await fetch('/api/supply-chain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new SupplyChainApiError(
      errorData.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json();
}

export function transformSupplierData(supplier: SupplierApiResponse, index: number) {
  const fields = [
    { label: "Location", value: supplier.location || "N/A", type: "location" as const },
    { label: "Rating", value: supplier.rating?.toString() || "N/A", type: "rating" as const },
    { label: "Price Range", value: supplier.price_range || "N/A", type: "price" as const },
    { label: "Lead Time", value: supplier.lead_time || "N/A", type: "time" as const },
    { label: "Response Time", value: supplier.response_time || "N/A", type: "time" as const },
    { label: "MOQ", value: supplier.moq || "N/A", type: "text" as const },
    { label: "Stock", value: supplier.stock || "N/A", type: "text" as const },
    { label: "Time Zone", value: supplier.time_zone || "N/A", type: "text" as const },
    { label: "Specialties", value: (supplier.specialties && supplier.specialties.length > 0) ? supplier.specialties.join(", ") : "N/A", type: "badge" as const },
  ];

  // Only add certifications if they exist and are not empty
  if (supplier.certifications && supplier.certifications.length > 0) {
    fields.splice(8, 0, { 
      label: "Certifications", 
      value: supplier.certifications.join(", "), 
      type: "badge" as const 
    });
  }

  // Parse contact information and add individual contact fields
  if (supplier.contact && supplier.contact !== "N/A") {
    let email = "contact@example.com";
    let phone = "+1-555-0123";
    let website = "www.example.com";

    // Handle contact as object or string
    if (typeof supplier.contact === 'object' && supplier.contact !== null) {
      // If contact is an object, extract the values directly
      email = supplier.contact.email || email;
      phone = supplier.contact.phone || phone;
      website = supplier.contact.website || website;
    } else if (typeof supplier.contact === 'string') {
      // If contact is a string, try to parse it
      const emailMatch = supplier.contact.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const phoneMatch = supplier.contact.match(/(\+?[\d\s\-\(\)]{10,})/);
      const websiteMatch = supplier.contact.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);

      if (emailMatch) {
        email = emailMatch[1];
      }
      if (phoneMatch) {
        phone = phoneMatch[1].trim();
      }
      if (websiteMatch) {
        website = websiteMatch[1];
        if (!website.startsWith('http')) {
          website = website.startsWith('www.') ? `https://${website}` : `https://www.${website}`;
        }
      }
    }

    fields.push({ label: "Email", value: email, type: "text" as const });
    fields.push({ label: "Phone", value: phone, type: "text" as const });
    fields.push({ label: "Website", value: website, type: "text" as const });
  } else {
    // Add default contact information if none provided
    fields.push({ label: "Email", value: "contact@example.com", type: "text" as const });
    fields.push({ label: "Phone", value: "+1-555-0123", type: "text" as const });
    fields.push({ label: "Website", value: "www.example.com", type: "text" as const });
  }

  return {
    id: `supplier_${Date.now()}_${index}`,
    name: supplier.company_name || "Unknown Supplier",
    fields
  };
}
