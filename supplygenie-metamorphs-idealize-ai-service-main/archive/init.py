# LangGraph Agentic Workflow for Supply Chain with Chat History + Tavily + MongoDB + LLM Evaluation
import json
from typing_extensions import TypedDict, NotRequired
from datetime import datetime, timezone

from pymongo import MongoClient
from langgraph.graph import StateGraph, START, END
from langchain.tools import tool
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_tavily import TavilySearch

from pydantic import TypeAdapter, ValidationError
from models import FinalReport

import os

OPEN_AI_API = os.environ.get("OPEN_AI_API")

# 1. Shared State


class CreateChainState(TypedDict):
    session_id: str
    raw_input: dict
    requirements: dict
    esg_preference: NotRequired[str]
    suppliers: list
    exploration_results: list
    evaluation_feedback: str
    final_report: dict
    retry_count: NotRequired[int]


# 2. MongoDB Setup
MONGO_URI = "mongodb+srv://test:test@cluster.tdnqaix.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["supply_chain"]
suppliers_collection = db["suppliers"]
conversation_collection = db["chat_history"]
report_collection = db["final_reports"]
conversation_collection.create_index([("content", "text")])


# 3. Chat‑History Logger
def log_message(role: str, content: str, session_id: str):
    conversation_collection.insert_one(
        {
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc),
        }
    )


# 4. Requirement‑Parsing Agent
def parse_requirements(state: CreateChainState):
    session_id = state["session_id"]
    user_input = state["raw_input"]
    log_message("user", str(user_input), session_id)

    search_terms = " ".join(str(v) for v in user_input.values() if isinstance(v, str))
    history = (
        conversation_collection.find(
            {"$text": {"$search": search_terms}, "role": "user"}
        )
        .sort("timestamp", -1)
        .limit(5)
    )

    combined = dict(user_input)
    for msg in history:
        try:
            past = eval(msg["content"])
            if isinstance(past, dict):
                combined.update(past)
        except:
            pass

    return {"requirements": combined}


# 5. MongoDB Query Tool
@tool(
    description="Query MongoDB to find suppliers matching given requirements and optional ESG filter."
)
def query_mongodb(requirements: dict, esg_filter: str = None) -> list:
    q = dict(requirements)
    if esg_filter:
        q["esg_score"] = esg_filter
    return list(suppliers_collection.find(q, {"_id": 0}))


# 6. Tavily Web‑Search Tool
@tool(
    description="Search the web using Tavily to find potential suppliers and summarize results."
)
def tavily_search_tool(requirements: dict) -> list:
    query = f"{requirements.get('material','')} suppliers in {requirements.get('region','')}"
    tavily = TavilySearch(tavily_api_key="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")
    results = tavily.invoke({"query": query})

    if isinstance(results, str):
        return [{"source": "tavily", "summary": results, "url": ""}]
    elif isinstance(results, dict) and "results" in results:
        return [
            {
                "source": "tavily",
                "summary": r.get("content", r.get("snippet", "")),
                "url": r.get("url", ""),
            }
            for r in results["results"]
        ]
    else:
        return [{"source": "tavily", "summary": str(results), "url": ""}]


# 7. Exploration Agent (early‑exit if no candidates)
def supply_exploration_agent(state: CreateChainState):
    mongo = query_mongodb.invoke(
        {
            "requirements": state["requirements"],
            "esg_filter": state.get("esg_preference"),
        }
    )
    web = tavily_search_tool.invoke({"requirements": state["requirements"]})
    suppliers = mongo + web

    if not suppliers:
        state["final_report"] = {
            "status": "failed",
            "message": "No suppliers matched requirements.",
        }
        return {
            "suppliers": [],
            "exploration_results": [],
            "evaluation_feedback": "no_candidates",
        }

    return {"suppliers": suppliers, "exploration_results": suppliers}


# 8. LLM Evaluation Agent (strict JSON + json.loads)
def supply_chain_sage_agent(state: CreateChainState):
    llm = ChatOpenAI(temperature=0, model_name="gpt-4", openai_api_key=OPEN_AI_API)
    suppliers = state["suppliers"]
    requirements = state["requirements"]

    prompt = ChatPromptTemplate.from_template(
        """
You are a world-class supply-chain analyst. Analyze these suppliers:

Requirements: {requirements}

Suppliers: {suppliers}

**Return exactly one JSON object** with:
1. "top_suppliers": an array of up to 5 objects; each must include "name", "score", "reasons", "warnings", plus any other metadata.
2. "evaluation_feedback": either "good" or "not good enough".
"""
    )

    messages = prompt.format_messages(requirements=requirements, suppliers=suppliers)
    response = llm.invoke(messages)

    try:
        parsed = json.loads(response.content)
        return {
            "evaluation_feedback": parsed["evaluation_feedback"],
            "suppliers": parsed["top_suppliers"],
        }
    except Exception:
        return {"evaluation_feedback": "not good enough", "suppliers": []}


# 9. Requirements‑Adjustment Agent
def adjust_requirements(state: CreateChainState):
    req = dict(state["requirements"])
    dt = req.get("delivery_time_days")
    if isinstance(dt, dict) and "$lte" in dt:
        req["delivery_time_days"] = {"$lte": dt["$lte"] + 5}
    return {"requirements": req}


# 10. Final‑Report Agent
def generate_final_report(state: CreateChainState):
    session_id = state["session_id"]
    fb = state["evaluation_feedback"]

    if fb == "no_candidates":
        report = state["final_report"]
    elif fb == "good":
        report = {
            "status": "success",
            "summary": f"{len(state['suppliers'])} top suppliers selected.",
            "top_suppliers": state["suppliers"],
            "evaluation_model": "gpt-4",
            "evaluation_notes": "Chose top 5 based on score, reasons & warnings",
        }
    else:
        if state.get("retry_count", 0) >= 3:
            report = {
                "status": "failed",
                "message": "Max retries reached. Supply chain could not be validated.",
            }
        else:
            return {"final_report": {"status": "retry"}}

    report_collection.insert_one(
        {"session_id": session_id, "report": report, "timestamp": datetime.utcnow()}
    )
    log_message("assistant", str(report), session_id)
    try:
        adapter = TypeAdapter(FinalReport)
        report = adapter.validate_python(report)
    except ValidationError as e:
        print("🚨 Validation error:\n", e)
        raise
    return {"final_report": type(report)}


# 11. Retry Counter
def increment_retry_count(state: CreateChainState):
    state["retry_count"] = state.get("retry_count", 0) + 1
    return {"retry_count": state["retry_count"]}


# 12. Build & Compile Graph
builder = StateGraph(CreateChainState)
builder.add_node("parse", parse_requirements)
builder.add_node("explore", supply_exploration_agent)
builder.add_node("evaluate", supply_chain_sage_agent)
builder.add_node("adjust", adjust_requirements)
builder.add_node("retry_up", increment_retry_count)
builder.add_node("report", generate_final_report)

builder.add_edge(START, "parse")
builder.add_edge("parse", "explore")


def after_explore_edge(state):
    return (
        "report" if state.get("evaluation_feedback") == "no_candidates" else "evaluate"
    )


builder.add_conditional_edges(
    "explore", after_explore_edge, {"evaluate": "evaluate", "report": "report"}
)


def after_eval_edge(state):
    if state["evaluation_feedback"] == "good":
        return "report"
    if state.get("retry_count", 0) >= 3:
        return "report"
    return "retry_up"


builder.add_conditional_edges(
    "evaluate", after_eval_edge, {"report": "report", "retry_up": "retry_up"}
)

builder.add_edge("retry_up", "adjust")
builder.add_edge("adjust", "parse")
builder.add_edge("report", END)

create_chain_agent = builder.compile()


# 13. Sample Run
if __name__ == "__main__":
    user_input = {
        "material": "zinc",
        "region": "sri lanka",
        "delivery_time_days": {"$lte": 15},
    }

    init = CreateChainState(
        session_id="session_001",
        raw_input=user_input,
        esg_preference="high",
        requirements={},
        suppliers=[],
        exploration_results=[],
        evaluation_feedback="",
        final_report={},
        retry_count=0,
    )

    result = create_chain_agent.invoke(init)
    print("Final Report:", result["final_report"])
