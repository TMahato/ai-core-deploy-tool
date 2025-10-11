import os
import asyncio
import re
from gen_ai_hub.proxy.langchain.openai import ChatOpenAI
from dotenv import load_dotenv
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

load_dotenv()

DEPLOYMENT_ID =  os.environ.get("DEPLOYMENT_ID")

async def main():
    llm = ChatOpenAI(deployment_id=DEPLOYMENT_ID)

    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", "."],
        env=None 
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await session.list_tools()
            print("Available MCP tools:", [t.name for t in tools.tools])

            file_path = "pipelines/serving.yaml"
            
            try:
                file_call = await session.call_tool(
                    name="read_file",
                    arguments={"path": file_path}
                )
                
                content = []
                for part in file_call.content:
                    if hasattr(part, 'text'):
                        content.append(part.text)
                
                original_content = "\n".join(content)
                print(f"\n{'='*50}")
                print(f"Original File: {file_path}")
                print(f"{'='*50}")
                print(original_content)
                
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                return

            new_image_tag = input("\nEnter new image name:tag (e.g., demo_serve:02 or my_model:v1): ").strip()
            
            if not new_image_tag:
                print("No image name provided. Exiting.")
                return
            
            print(new_image_tag)
            updated_content = re.sub(
                r'(image:\s+docker\.io/tanmay471/)[^\s]+',
                rf'\1{new_image_tag}',
                original_content
            )
            
            if updated_content == original_content:
                print("\n  Warning: No changes detected. Image might not match the expected pattern.")
                proceed = input("Do you want to continue anyway? (y/n): ").strip().lower()
                if proceed != 'y':
                    return
            
            print(f"\n{'='*50}")
            print("Updated Content Preview:")
            print(f"{'='*50}")
            print(updated_content)
            
            confirm = input("\nDo you want to write these changes? (y/n): ").strip().lower()
            
            if confirm == 'y':
                try:
                    write_call = await session.call_tool(
                        name="write_file",
                        arguments={
                            "path": file_path,
                            "content": updated_content
                        }
                    )
                    
                    print("\n File updated successfully!")
                    
                    for part in write_call.content:
                        if hasattr(part, 'text'):
                            print(f"Write result: {part.text}")
                except Exception as e:
                    print(f"Error writing file: {e}")

if __name__ == "__main__":
    asyncio.run(main())