from langgraph.prebuilt import create_react_agent
from .utils import get_logger, get_llm
from .models import SupplierExplorationAgentResponse
from langgraph.graph.state import CompiledStateGraph
from .config import AGENT_MAX_SUPPLIERS
from .tools import (
    web_extract,
    web_search,
    query_mongodb,
    finalize_supplier_search,
    validate_supplier_data,
)
from .prompts import get_supply_chain_agent_prompt

logger = get_logger()


def supply_chain_agent(chat_history=None) -> CompiledStateGraph:
    f"""
    Comprehensive supply chain agent that handles requirement analysis and supplier exploration.
    Designed to find EXACTLY {AGENT_MAX_SUPPLIERS} high-quality suppliers through thorough research.
    """
    logger.info("Creating supply chain agent")
    logger.debug(
        "Initializing tools: web_extract, web_search, query_mongodb, finalize_supplier_search, validate_supplier_data"
    )

    tools = [
        web_extract,
        web_search,
        query_mongodb,
        finalize_supplier_search,
        validate_supplier_data,
    ]

    logger.info(f"Loaded {len(tools)} tools for supply chain agent")
    for tool in tools:
        logger.debug(f"  - Tool: {tool.name} - {tool.description}")

    try:
        logger.info("Initializing LLM model...")
        # Initialize the model with optimized settings
        model = get_llm()
        logger.info("LLM model initialized successfully")

        logger.info("Creating ReAct agent with tools and prompt...")
        agent = create_react_agent(
            model=model,
            tools=tools,
            prompt=get_supply_chain_agent_prompt(chat_history),
            response_format=SupplierExplorationAgentResponse,
        )
        logger.info("Successfully created supply chain agent with ReAct framework")
        logger.debug(
            f"Agent configuration: model={model.model_name}, tools={len(tools)}, response_format=SupplierExplorationAgentResponse"
        )
        return agent
    except Exception as e:
        logger.error(f"Failed to create supply chain agent: {str(e)}", exc_info=True)
        logger.error(f"Error details: {type(e).__name__}")
        raise
