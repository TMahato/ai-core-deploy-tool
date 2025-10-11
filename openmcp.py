import os
import asyncio
import re
import argparse
from gen_ai_hub.proxy.langchain.openai import ChatOpenAI
from dotenv import load_dotenv
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

load_dotenv()

DEPLOYMENT_ID = os.environ.get("DEPLOYMENT_ID")

def parse_args():
    p = argparse.ArgumentParser(description="Update image tag in pipelines/serving.yaml via MCP filesystem server.")
    p.add_argument("--image-tag", help="New image name:tag, e.g. demo_serve:02", default=None)
    p.add_argument("--file-path", help="Path to YAML file", default="pipelines/serving.yaml")
    return p.parse_args()


def find_changes(original_content, updated_content):
    original_lines = original_content.splitlines()
    updated_lines = updated_content.splitlines()
    
    changes = []
    
    for i, (old_line, new_line) in enumerate(zip(original_lines, updated_lines), start=1):
        if old_line != new_line:
            changes.append((i, old_line, new_line))
    
    return changes


async def main():
    args = parse_args()

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
            # print("Available MCP tools:", [t.name for t in tools.tools])

            file_path = args.file_path

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
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                return

            new_image_tag = args.image_tag
            if not new_image_tag:
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
                # Only prompt if running interactively without --image-tag
                if args.image_tag is None:
                    proceed = input("Do you want to continue anyway? (y/n): ").strip().lower()
                    if proceed != 'y':
                        return

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

                changes = find_changes(original_content, updated_content)

                if not changes:
                    print("\n  No changes detected.")
                    return
                
                print("CHANGES DETECTED..")
                
                for line_num, old_line, new_line in changes:
                    print(f"\n Line {line_num}:")
                    print(f"    Old: {old_line.strip()}")
                    print(f"    New: {new_line.strip()}")
                

            except Exception as e:
                print(f"Error writing file: {e}")

if __name__ == "__main__":
    asyncio.run(main())
