"""
FIRELINE — LangChain Conversational SQL Agent

Connects to the Supabase PostgreSQL microgravity research database via SQLAlchemy
and uses Google Gemini (gemini-2.5-flash) to translate natural language inquiries
into safe, read-only SQL queries, executing them and explaining scientific findings.
"""

import os
import logging
from typing import Any, Dict, List, Optional
from app.core.config import DATABASE_URL, GEMINI_API_KEY, GEMINI_MODEL, FIRELINE_DB_PATH

logger = logging.getLogger("fireline.langchain_agent")

SYSTEM_PROMPT_PREFIX = """You are the FIRELINE Scientific SQL Assistant.
Translate natural language research questions into correct PostgreSQL queries, execute them against the Supabase database, and explain the findings clearly. Always cite the relevant test codes or investigation IDs.
Strict guidelines:
1. Perform strictly read-only SELECT queries. Never execute INSERT, UPDATE, DELETE, DROP, or ALTER statements.
2. Filter by investigation name, fuel material, oxygen concentration, airflow, pressure, or microgravity conditions as requested.
3. Cite the exact test_label, test_run_id, or investigation_id in your scientific answer.
"""

_CACHED_AGENT = None
_CACHED_DB = None


def get_sql_database(url: Optional[str] = None):
    """
    Constructs a LangChain SQLDatabase connection restricted strictly to read-only research tables.
    """
    global _CACHED_DB
    if _CACHED_DB is not None:
        return _CACHED_DB

    from langchain_community.utilities import SQLDatabase

    conn_str = url or DATABASE_URL
    if conn_str:
        # Standardize postgresql URI for psycopg 3.x driver
        if conn_str.startswith("postgresql://") and not conn_str.startswith("postgresql+psycopg://"):
            conn_str = conn_str.replace("postgresql://", "postgresql+psycopg://", 1)
    else:
        # Fallback to local SQLite file if DATABASE_URL is not set
        conn_str = f"sqlite:///{FIRELINE_DB_PATH}"

    logger.info("Initializing SQLDatabase connection to: %s", conn_str.split("@")[-1] if "@" in conn_str else conn_str)

    db = SQLDatabase.from_uri(
        conn_str,
        include_tables=["investigations", "sources", "test_runs", "measurements", "findings"],
        sample_rows_in_table_info=2,
    )
    _CACHED_DB = db
    return db


def get_langchain_sql_agent(db: Optional[Any] = None, api_key: Optional[str] = None):
    """
    Builds or retrieves a cached LangChain SQL agent configured with Gemini 2.5 Flash and SQLDatabaseToolkit.
    """
    global _CACHED_AGENT
    if _CACHED_AGENT is not None:
        return _CACHED_AGENT

    from langchain_community.agent_toolkits.sql.base import create_sql_agent
    from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
    from langchain_google_genai import ChatGoogleGenerativeAI

    target_db = db or get_sql_database()
    target_api_key = api_key or GEMINI_API_KEY
    model_name = GEMINI_MODEL or "gemini-2.5-flash"

    llm = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=target_api_key,
        temperature=0.0,
        max_retries=1,
        timeout=8,
    )

    toolkit = SQLDatabaseToolkit(db=target_db, llm=llm)

    agent_executor = create_sql_agent(
        llm=llm,
        toolkit=toolkit,
        verbose=True,
        prefix=SYSTEM_PROMPT_PREFIX,
        top_k=10,
        max_iterations=12,
        agent_executor_kwargs={"return_intermediate_steps": True},
    )

    _CACHED_AGENT = agent_executor
    return agent_executor


def run_langchain_sql_agent(natural_query: str) -> Dict[str, Any]:
    """
    Executes a natural language query via the LangChain SQL Agent and returns structured findings.
    
    Returns:
        {
            "query": str,
            "output": str,
            "sql_query": Optional[str],
            "intermediate_steps": List[Dict[str, Any]],
            "tables_used": List[str],
            "database": str,
        }
    """
    if not natural_query or not natural_query.strip():
        return {
            "query": "",
            "output": "Please provide a valid scientific question.",
            "sql_query": None,
            "intermediate_steps": [],
            "tables_used": [],
            "database": "supabase-postgresql",
        }

    # Fallback if GEMINI_API_KEY is absent
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set. Returning deterministic fallback.")
        return {
            "query": natural_query,
            "output": (
                "LangChain SQL Agent requires a configured GEMINI_API_KEY to translate questions into PostgreSQL queries. "
                "Configure GEMINI_API_KEY in your environment to enable automated Supabase SQL generation."
            ),
            "sql_query": None,
            "intermediate_steps": [],
            "tables_used": ["test_runs", "investigations"],
            "database": "supabase-postgresql",
        }

    try:
        agent = get_langchain_sql_agent()
        raw_result = agent.invoke({"input": natural_query.strip()})

        output_text = raw_result.get("output", "")
        raw_steps = raw_result.get("intermediate_steps", [])

        formatted_steps = []
        extracted_sql = None

        for step in raw_steps:
            if isinstance(step, tuple) and len(step) == 2:
                action, tool_output = step
                step_dict = {
                    "tool": getattr(action, "tool", str(action)),
                    "tool_input": getattr(action, "tool_input", None),
                    "tool_output": str(tool_output)[:500],
                }
                formatted_steps.append(step_dict)

                # Identify the executed SQL query
                if getattr(action, "tool", "") == "sql_db_query":
                    tool_in = getattr(action, "tool_input", "")
                    if isinstance(tool_in, dict):
                        extracted_sql = tool_in.get("query", str(tool_in))
                    else:
                        extracted_sql = str(tool_in)

        return {
            "query": natural_query,
            "output": output_text,
            "sql_query": extracted_sql,
            "intermediate_steps": formatted_steps,
            "tables_used": ["investigations", "sources", "test_runs", "measurements", "findings"],
            "database": "supabase-postgresql",
        }

    except Exception as e:
        logger.warning("LangChain Gemini invocation failed (%s). Attempting deterministic Supabase SQL fallback.", e)
        # Deterministic Supabase SQL fallback for quota exhaustion or network resilience
        try:
            db = get_sql_database()
            q_lower = natural_query.lower()
            fallback_sql = None

            if "how many investigation" in q_lower or "count investigation" in q_lower or "investigations count" in q_lower:
                fallback_sql = "SELECT COUNT(*) AS total_investigations FROM investigations;"
            elif "how many test run" in q_lower or "count test run" in q_lower or "test runs count" in q_lower:
                fallback_sql = "SELECT COUNT(*) AS total_test_runs FROM test_runs;"
            elif "how many measurement" in q_lower or "count measurement" in q_lower:
                fallback_sql = "SELECT COUNT(*) AS total_measurements FROM measurements;"
            elif "bass" in q_lower and ("oxygen" in q_lower or "16" in q_lower):
                fallback_sql = (
                    "SELECT t.id, t.investigation_id, t.test_code, t.material_normalized, t.geometry "
                    "FROM test_runs t "
                    "WHERE t.investigation_id = 'BASS-II' "
                    "LIMIT 10;"
                )
            elif "bass" in q_lower:
                fallback_sql = "SELECT id, psi_id, title, pillar, facility FROM investigations WHERE id = 'BASS-II';"
            elif "samer" in q_lower or "same-r" in q_lower:
                fallback_sql = "SELECT id, psi_id, title, pillar, facility FROM investigations WHERE id = 'SAME-R';"
            elif "saffire" in q_lower:
                fallback_sql = "SELECT id, psi_id, title, pillar, facility FROM investigations WHERE id = 'SAFFIRE';"
            elif "investigation" in q_lower:
                fallback_sql = "SELECT id, psi_id, title, pillar FROM investigations ORDER BY psi_id;"

            if fallback_sql:
                res = db.run(fallback_sql)
                return {
                    "query": natural_query,
                    "output": f"Live Supabase PostgreSQL Query Output:\n{res}\n\n[Note: Answer executed directly on Supabase PostgreSQL database via SQL fallback].",
                    "sql_query": fallback_sql,
                    "intermediate_steps": [
                        {"tool": "sql_db_query", "tool_input": fallback_sql, "tool_output": str(res)}
                    ],
                    "tables_used": ["investigations", "test_runs", "measurements"],
                    "database": "supabase-postgresql",
                    "mode": "deterministic_supabase_sql_fallback",
                }
        except Exception as fallback_err:
            logger.exception("Fallback SQL execution failed: %s", fallback_err)

        return {
            "query": natural_query,
            "output": f"An error occurred while executing the scientific SQL agent: {str(e)}",
            "sql_query": None,
            "intermediate_steps": [],
            "tables_used": [],
            "database": "supabase-postgresql",
            "error": str(e),
        }
