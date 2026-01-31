from mcp.server.fastmcp import FastMCP
from sqlalchemy.orm import Session
import models, database, schemas

# Initialize MCP Server
mcp = FastMCP("Strontium")

@mcp.tool()
def get_user_api_key(email: str) -> str:
    """Retrieve the API key for a specific user to use in other MCP tools."""
    db = next(database.get_db())
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return f"User {email} not found."
    if not user.api_key:
        return f"User {email} has no API key registered."
    return f"API Key for {email}: {user.api_key}"

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
def create_post(user_id: int, content: str, api_key: str = None) -> str:
    """
    Create a new post. 
    If the user has an API Key registered, it can be provided for verification/logging.
    """
    db = next(database.get_db())
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return "User not found."
    
    # Example logic using the API Key
    key_status = ""
    if user.api_key:
        if api_key == user.api_key:
            key_status = " [Verified with API Key]"
        else:
            key_status = " [API Key Mismatch/Not Provided]"

    new_msg = models.Message(content=f"{content}{key_status}", owner_id=user_id)
    db.add(new_msg)
    db.commit()
    return f"Post created! ID: {new_msg.id}{key_status}"

@mcp.tool()
def modify_post(message_id: int, content: str) -> str:
    """Modify an existing post's content in the strontium database."""
    db = next(database.get_db())
    db_message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not db_message:
        return f"Message with ID {message_id} not found."
    
    db_message.content = content
    db.commit()
    return f"Post {message_id} modified successfully!"

@mcp.tool()
def delete_post(message_id: int) -> str:
    """Delete a post from the strontium database."""
    db = next(database.get_db())
    db_message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not db_message:
        return f"Message with ID {message_id} not found."
    
    db.delete(db_message)
    db.commit()
    return f"Post {message_id} deleted successfully."

@mcp.resource("strontium://stats")
def get_stats() -> str:
    """Get general stats of the board."""
    db = next(database.get_db())
    count = db.query(models.Message).count()
    users = db.query(models.User).count()
    return f"Total Posts: {count}\nTotal Users: {users}"

if __name__ == "__main__":
    mcp.run()
