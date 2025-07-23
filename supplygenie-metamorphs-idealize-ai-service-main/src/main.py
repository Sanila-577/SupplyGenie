from fastapi import FastAPI
from .models import AgentConfig, SupplierExplorationAgentResponse
import asyncio
from .agents import supply_chain_agent
from .utils import get_logger, save_suppliers_to_mongodb
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from .config import AGENT_RECURSION_LIMIT
from fastapi.middleware.cors import CORSMiddleware

logger = get_logger()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    logger.info("Health check endpoint accessed")
    return {"message": "Hello World"}


@app.post(
    "/api/v1/supply-chain/recommendations",
    response_model=SupplierExplorationAgentResponse,
)
async def get_recommendations(requirements: AgentConfig):
    logger.info("=== NEW RECOMMENDATION REQUEST ===")
    logger.info(
        f"Received recommendation request for query: {requirements.query[:100]}..."
    )
    logger.debug(f"Full query: {requirements.query}")
    logger.debug(
        f"Chat history length: {len(requirements.chat_history) if requirements.chat_history else 0}"
    )

    # Build input payload with proper message structure and state tracking
    input_payload = {
        "query": requirements.query,
        "chat_history": requirements.chat_history,
        "messages": [HumanMessage(content=requirements.query)],
    }
    logger.info("Built input payload for agent")
    logger.debug(f"Payload keys: {list(input_payload.keys())}")
    logger.debug(f"Messages count: {len(input_payload['messages'])}")

    try:
        logger.info("--- CREATING SUPPLY CHAIN AGENT ---")
        # Create and invoke the supply chain agent with chat history
        agent = supply_chain_agent(chat_history=requirements.chat_history)
        logger.info("Supply chain agent created successfully")

        # Configure agent with recursion limit
        agent = agent.with_config(recursion_limit=AGENT_RECURSION_LIMIT)
        logger.info(f"Agent configured with recursion limit: {AGENT_RECURSION_LIMIT}")

        # Invoke the agent with configuration
        logger.info("--- INVOKING SUPPLY CHAIN AGENT ---")
        logger.info(
            f"Starting supply chain agent invocation with recursion limit: {AGENT_RECURSION_LIMIT}"
        )

        # Create runnable config for additional control
        config = RunnableConfig(recursion_limit=AGENT_RECURSION_LIMIT)
        raw_output = await asyncio.to_thread(agent.invoke, input_payload, config=config)
        logger.info("Agent invocation completed")
        logger.debug(
            f"Raw output keys: {list(raw_output.keys()) if isinstance(raw_output, dict) else 'Not a dict'}"
        )
        logger.debug(f"Raw output type: {type(raw_output)}")

        logger.info("--- PROCESSING AGENT RESPONSE ---")
        # Check if we have a structured response
        if isinstance(raw_output, dict) and "structured_response" in raw_output:
            logger.debug("Found structured_response in raw output")
            structured_response = raw_output["structured_response"]
            if (
                hasattr(structured_response, "suppliers")
                and structured_response.suppliers
            ):
                logger.info(
                    f"Found response with {len(structured_response.suppliers)} suppliers"
                )
                logger.debug("Saving suppliers to MongoDB...")
                # Save suppliers to MongoDB after getting response
                save_result = save_suppliers_to_mongodb(structured_response.suppliers)
                logger.info(f"MongoDB save result: {save_result}")
                logger.info("=== REQUEST COMPLETED SUCCESSFULLY ===")
                return structured_response
            elif (
                isinstance(structured_response, dict)
                and "suppliers" in structured_response
            ):
                supplier_count = len(structured_response.get("suppliers", []))
                logger.info(f"Found dict response with {supplier_count} suppliers")
                logger.debug("Saving suppliers to MongoDB...")
                # Save suppliers to MongoDB after getting response
                save_result = save_suppliers_to_mongodb(
                    structured_response["suppliers"]
                )
                logger.info(f"MongoDB save result: {save_result}")
                logger.info("=== REQUEST COMPLETED SUCCESSFULLY ===")
                return SupplierExplorationAgentResponse(
                    suppliers=structured_response["suppliers"]
                )

        # Return empty response if no results found
        logger.warning("No supplier results found in agent response")
        logger.debug(f"Raw output structure: {raw_output}")
        logger.warning("=== REQUEST COMPLETED WITH NO RESULTS ===")
        return SupplierExplorationAgentResponse(suppliers=[])

    except Exception as e:
        logger.error(
            "Error processing recommendation request: {}", str(e), exc_info=True
        )
        logger.error("Error type: {}", type(e).__name__)
        logger.error("=== REQUEST FAILED ===")
        return SupplierExplorationAgentResponse(suppliers=[])
