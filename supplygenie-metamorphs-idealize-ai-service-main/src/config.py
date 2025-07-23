# src/config.py - Complete with all required constants
from pymongo import TEXT
from dotenv import load_dotenv
import os

load_dotenv()

# API Keys and Database
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o")
LLM_TEMPERATURE = 0.1

# MongoDB Configuration
SEARCH_INDEX_NAME = "supplier_search_index"
SEARCH_INDEX_SPEC = [("$**", TEXT)]

# Agent Configuration - ADD THESE MISSING CONSTANTS
MAX_QUERY_LENGTH = 2000
MAX_EXTRACT_URLS = 15
DEFAULT_REMAINING_STEPS = 25
AGENT_MAX_SUPPLIERS = 10
AGENT_RECURSION_LIMIT = 200

# LLM Performance Configuration  
MAX_TOKENS = 4096  # Further reduced to prevent context overflow
REQUEST_TIMEOUT = 300
MAX_RETRIES = 3 
