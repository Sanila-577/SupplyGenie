from typing import List, Union, Optional
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, TypedDict
from langchain_core.messages import BaseMessage
from typing_extensions import Annotated
from langgraph.graph.message import add_messages
from .utils import get_logger
from .config import MAX_QUERY_LENGTH, MAX_EXTRACT_URLS, DEFAULT_REMAINING_STEPS

logger = get_logger()


class Contact(BaseModel):
    website: str = Field(description="Company website URL")
    phone: str = Field(description="Company phone number")
    email: str = Field(description="Company email address")


class Supplier(BaseModel):
    company_name: str = Field(description="Name of the company")
    location: str = Field(description="Location of the company")
    rating: float = Field(description="Rating of the company")
    price_range: str = Field(
        description="Price range of the products in USD (e.g., '$10-20 USD', '$50-100 USD')"
    )
    lead_time: str = Field(description="Lead time for delivery")
    moq: str = Field(description="Minimum order quantity")
    certifications: List[str] = Field(description="List of certifications")
    specialties: List[str] = Field(description="List of specialties")
    response_time: str = Field(
        description="Response time in hours or days (e.g., '2-4 hours', '1-2 days')"
    )
    stock: str = Field(description="Stock availability (e.g., '10 units available')")
    time_zone: str = Field(description="Company timezone (e.g., 'GMT+8 (China Standard Time)')")
    contact: Contact = Field(description="Contact information")

    @field_validator("rating")
    def validate_rating(cls, v):
        if not 0 <= v <= 5:
            logger.warning(f"Rating {v} is outside expected range 0-5")
        return v


class GraphState(TypedDict):
    query: str
    chat_history: Optional[list[Dict[str, Any]]]
    agent_scratchpad: Optional[str]
    messages: Optional[list[Dict[str, Any]]]


class SupplierSearchIndexQuery(BaseModel):
    price_range: Optional[str] = Field(
        default=None, description="Price range of the products"
    )
    location: Optional[str] = Field(default=None, description="Location of the company")
    specialties: Optional[List[str]] = Field(
        default=None, description="List of specialties"
    )
    certifications: Optional[List[str]] = Field(
        default=None, description="List of certifications"
    )
    lead_time: Optional[str] = Field(default=None, description="Lead time for delivery")
    # Add a general query field for free-text search
    query: Optional[str] = Field(default=None, description="General search query")

    def build_filter(self) -> dict[str, Union[str, List[str]]]:
        logger.debug("Building MongoDB filter from search query")
        filter = {}
        if self.price_range:
            filter["price_range"] = self.price_range
        if self.location:
            filter["location"] = self.location
        if self.specialties:
            filter["specialties"] = {
                "$in": self.specialties
            }  # Changed from $all to $in for more flexible matching
        if self.certifications:
            filter["certifications"] = {
                "$in": self.certifications
            }  # Changed from $all to $in for more flexible matching
        if self.lead_time:
            filter["lead_time"] = self.lead_time

        # If we have a general query, add text search
        if self.query:
            filter["$text"] = {"$search": self.query}

        logger.debug(f"Built filter: {filter}")
        return filter


class AgentConfig(BaseModel):
    query: str = Field(
        description="The query string to search for suppliers.",
        min_length=1,
        max_length=MAX_QUERY_LENGTH,
    )
    chat_history: Optional[List[dict]] = Field(
        default=None,
        description="Optional chat history to provide context for the search.",
    )

    @field_validator("query")
    def validate_query(cls, v):
        if len(v.strip()) == 0:
            logger.error("Empty query provided")
            raise ValueError("Query cannot be empty")
        logger.debug(f"Validated query: {v[:50]}...")
        return v


class SupplierExplorationAgentResponse(BaseModel):
    suppliers: List[Supplier] = Field(
        description="List of suppliers matching the search criteria."
    )

    @field_validator("suppliers")
    def log_supplier_count(cls, v):
        logger.info(f"Response contains {len(v)} suppliers")
        return v


class WebSearchQuery(BaseModel):
    query: str = Field(
        description="The query string to search for suppliers.",
        min_length=1,
        max_length=MAX_QUERY_LENGTH,
    )


class WebExtractQuery(BaseModel):
    urls: List[str] = Field(
        description="List of URLs to extract supplier information from."
    )

    @field_validator("urls")
    def validate_urls(cls, v):
        if len(v) > MAX_EXTRACT_URLS:
            logger.warning(
                f"Large number of URLs provided for extraction: {len(v)} (max recommended: {MAX_EXTRACT_URLS})"
            )
        return v


class SupplierDataValidationQuery(BaseModel):
    supplier_data: dict = Field(
        description="Dictionary containing supplier information to validate for completeness and accuracy."
    )


class SupplyChainAgentState(BaseModel):
    """Custom state schema for the supply chain agent."""

    messages: Annotated[List[BaseMessage], add_messages] = Field(default_factory=list)
    query: str = Field(description="The user's supply chain query")
    chat_history: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Previous conversation history"
    )
    remaining_steps: int = Field(default=DEFAULT_REMAINING_STEPS)
    structured_response: Optional[SupplierExplorationAgentResponse] = Field(
        default=None, description="The final structured response with suppliers"
    )
    tools_called: List[str] = Field(
        default_factory=list, description="List of tools that have been called"
    )
    mongodb_checked: bool = Field(
        default=False, description="Whether MongoDB has been queried"
    )
    web_search_done: bool = Field(
        default=False, description="Whether web search has been completed"
    )
    search_completed: bool = Field(
        default=False, description="Whether the entire search process is completed"
    )
