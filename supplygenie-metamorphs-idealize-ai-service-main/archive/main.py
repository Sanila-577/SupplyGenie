# 8. Build and run graph
builder = StateGraph(CreateChainState)
builder.add_node("parse", parse_requirements)
builder.add_node("explore", supply_exploration_agent)
builder.add_node("evaluate", supply_chain_sage_agent)
builder.add_node("report", generate_final_report)
builder.add_edge(START, "parse")
builder.add_edge("parse", "explore")
builder.add_edge("explore", "evaluate")
builder.add_edge("evaluate", "report")
builder.add_edge("report", END)
agent = builder.compile()

# 9. CLI entrypoint
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", action="store_true", help="Seed sample suppliers")
    args = parser.parse_args()
    if args.seed:
        suppliers_col.insert_many(
            [
                {
                    "name": "Asia Metals Ltd",
                    "material": "copper",
                    "region": "Asia",
                    "delivery_time_days": 10,
                    "price": 150,
                },
                {
                    "name": "Green Copper Co",
                    "material": "copper",
                    "region": "Asia",
                    "delivery_time_days": 12,
                    "price": 145,
                },
            ]
        )
        print("Seeded sample suppliers.")
        exit(0)
    init_state: CreateChainState = {
        "session_id": "session_001",
        "raw_input": {"material": "copper", "region": "Asia"},
        "requirements": {},
        "suppliers": [],
        "exploration_results": [],
        "evaluation_feedback": "",
        "final_report": {},
        "retry_count": 0,
    }
    out = agent.invoke(init_state)
    print("Final Report:", out["final_report"])
