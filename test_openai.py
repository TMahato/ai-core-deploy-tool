from gen_ai_hub.proxy.langchain.openai import ChatOpenAI

# Initialize your deployed LLM from Gen AI Hub
llm = ChatOpenAI(deployment_id='d0ed15d3637c8205')

# Test a basic query
response = llm.invoke("Capital of india.")

print("LLM Response:\n", response)
