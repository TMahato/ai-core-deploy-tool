# openmcp.py
import os
import asyncio
import re
from gen_ai_hub.proxy.langchain.openai import ChatOpenAI

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

DEPLOYMENT_ID = "d0ed15d3637c8205"

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
            
            # Step 1: Read the file
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

            # Step 2: Update only the image name and tag (keep docker.io/tanmay471)
            # Check if running in non-interactive mode (called from JS)
            import sys
            if not sys.stdin.isatty():
                # Read from stdin (called from Node.js)
                new_image_tag = sys.stdin.readline().strip()
                print(f"Received image name from Node.js: {new_image_tag}")
            else:
                # Interactive mode
                new_image_tag = input("\nEnter new image name:tag (e.g., demo_serve:02 or my_model:v1): ").strip()
            
            if not new_image_tag:
                print("No image name provided. Exiting.")
                return
            
            # Replace only the image name and tag, keeping docker.io/tanmay471
            # This pattern matches any image name and tag after docker.io/tanmay471/
            updated_content = re.sub(
                r'(image:\s+docker\.io/tanmay471/)[^\s]+',
                rf'\1{new_image_tag}',
                original_content
            )
            
            # Check if replacement was successful
            if updated_content == original_content:
                print("\n⚠️  Warning: No changes detected. Image might not match the expected pattern.")
                proceed = input("Do you want to continue anyway? (y/n): ").strip().lower()
                if proceed != 'y':
                    return
            
            print(f"\n{'='*50}")
            print("Updated Content Preview:")
            print(f"{'='*50}")
            print(updated_content)
            
            # Step 3: Confirm before writing
            confirm = input("\nDo you want to write these changes? (y/n): ").strip().lower()
            
            
            try:
                # Write the updated content back to the file
                write_call = await session.call_tool(
                    name="write_file",
                    arguments={
                        "path": file_path,
                        "content": updated_content
                    }
                )
                
                print("\n✅ File updated successfully!")
                
                # Verify the write
                for part in write_call.content:
                    if hasattr(part, 'text'):
                        print(f"Write result: {part.text}")
            except Exception as e:
                print(f"❌ Error writing file: {e}")

if __name__ == "__main__":
    asyncio.run(main())