from mcp.server.fastmcp import FastMCP
from sqlalchemy.orm import Session
import models, database, schemas

# Initialize MCP Server
mcp = FastMCP("Strontium")

@mcp.tool()
def list_messages(skip: int = 0, limit: int = 10) -> str:
    """List messages from the strontium database."""
    db = next(database.get_db())
    messages = db.query(models.Message).order_by(models.Message.timestamp.desc()).offset(skip).limit(limit).all()
    if not messages:
        return "No messages found."
    
    result = []
    for m in messages:
        result.append(f"[{m.id}] User {m.owner_id}: {m.content} ({m.timestamp})")
    return "\n".join(result)

@mcp.tool()
def search_messages(query: str) -> str:
    """Search for messages containing specific text."""
    db = next(database.get_db())
    messages = db.query(models.Message).filter(models.Message.content.ilike(f"%{query}%")).all()
    if not messages:
        return f"No messages found for query: {query}"
    
    result = []
    for m in messages:
        result.append(f"[{m.id}] User {m.owner_id}: {m.content} ({m.timestamp})")
    return "\n".join(result)

@mcp.tool()
def create_post(user_id: int, content: str) -> str:
    """Create a new post in the strontium database (Internal use)."""
    db = next(database.get_db())
    new_msg = models.Message(content=content, owner_id=user_id)
    db.add(new_msg)
    db.commit()
    return f"Post created! ID: {new_msg.id}"

@mcp.resource("strontium://stats")
def get_stats() -> str:
    """Get general stats of the board."""
    db = next(database.get_db())
    count = db.query(models.Message).count()
    users = db.query(models.User).count()
    return f"Total Posts: {count}\nTotal Users: {users}"

if __name__ == "__main__":
    mcp.run()
