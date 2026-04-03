import os
import json
from typing import TypedDict, List, Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from tavily import AsyncTavilyClient

# State Definition
class AgentState(TypedDict):
    company_description: str
    social_goal: str
    target_audience: str
    keywords: List[str]
    research_data: str
    strategy: str
    draft: str

# Initialize LLM
def get_llm():
    return ChatGroq(temperature=0.7, model_name="llama-3.3-70b-versatile")

def get_tavily_client():
    return AsyncTavilyClient(api_key=os.environ.get("TAVILY_API_KEY", ""))

# Nodes
async def onboarding_node(state: AgentState):
    llm = get_llm()
    prompt = f"""
    You are an Onboarding Agent. Extract the target audience and a list of 3-5 core search keywords from the following startup info.
    Company Description: {state['company_description']}
    Goal: {state['social_goal']}
    
    Respond STRICTLY in JSON format with keys "target_audience" (string) and "keywords" (list of strings).
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    
    content = response.content.strip()
    if content.startswith("```json"):
        content = content[7:-3]
    elif content.startswith("```"):
        content = content[3:-3]
        
    try:
        data = json.loads(content)
        target_audience = data.get("target_audience", "General Audience")
        keywords = data.get("keywords", [])
    except Exception:
        target_audience = "General Audience"
        keywords = ["startup trends", "social media"]
    
    return {"target_audience": target_audience, "keywords": keywords}

async def research_node(state: AgentState):
    client = get_tavily_client()
    keywords = state.get("keywords", [])
    
    research_summary = ""
    try:
        query = " ".join(keywords[:2]) + " current trends and news"
        search_result = await client.search(query=query, search_depth="advanced", max_results=3)
        
        results_text = []
        for result in search_result.get("results", []):
            results_text.append(f"Title: {result['title']}\nContent: {result['content']}")
        research_summary = "\n\n".join(results_text)
    except Exception as e:
        research_summary = f"Could not fetch live research. Error: {str(e)}"
        
    if not research_summary:
        research_summary = "No significant trends found."
        
    return {"research_data": research_summary}

async def strategist_node(state: AgentState):
    llm = get_llm()
    prompt = f"""
    You are a Content Strategist Agent.
    Based on the Company Description: {state['company_description']}
    Target Audience: {state['target_audience']}
    Social Goal: {state['social_goal']}
    Recent Market Research: {state['research_data']}
    
    Determine the best content strategy (e.g., tone, platform to focus on, type of post, key message). 
    Provide a concise strategy paragraph.
    """
    response = await llm.ainvoke([
        SystemMessage(content="You are a brilliant marketing strategist."), 
        HumanMessage(content=prompt)
    ])
    return {"strategy": response.content}

async def copywriter_node(state: AgentState):
    llm = get_llm()
    prompt = f"""
    You are a world-class Copywriter Agent.
    Strategy: {state['strategy']}
    Goal: {state['social_goal']}
    
    Draft the final social media post. Include an engaging hook, the main body, and relevant hashtags.
    Return ONLY the final post content. Do not include any meta-commentary, just the draft itself ready to copy/paste.
    """
    response = await llm.ainvoke([
        SystemMessage(content="You are an expert copywriter."), 
        HumanMessage(content=prompt)
    ])
    return {"draft": response.content}

# Build Graph
workflow = StateGraph(AgentState)
workflow.add_node("onboarding", onboarding_node)
workflow.add_node("research", research_node)
workflow.add_node("strategist", strategist_node)
workflow.add_node("copywriter", copywriter_node)

workflow.add_edge(START, "onboarding")
workflow.add_edge("onboarding", "research")
workflow.add_edge("research", "strategist")
workflow.add_edge("strategist", "copywriter")
workflow.add_edge("copywriter", END)

agent_app = workflow.compile()
