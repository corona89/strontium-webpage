from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
import models, schemas, auth, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(redirect_slashes=False)

# Create uploads directory
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/messages/", response_model=List[schemas.Message])
@app.get("/messages", response_model=List[schemas.Message])
def read_messages(
    skip: int = 0, limit: int = 10, search: str = None, db: Session = Depends(database.get_db)
):
    query = db.query(models.Message)
    if search:
        query = query.filter(models.Message.content.ilike(f"%{search}%"))
    
    messages = (
        query.order_by(models.Message.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return messages


@app.post("/messages/", response_model=schemas.Message)
def create_message(
    message: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    print(f"Creating message for user: {current_user.email}")
    db_message = models.Message(
        content=message.content, 
        file_url=message.file_url,
        owner_id=current_user.id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@app.post("/auth/google")
def google_auth(token: str):
    return {
        "message": "Google auth not fully implemented in backend without credentials, but endpoint exists."
    }


@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    # Ensure unique filename if exists
    name, ext = os.path.splitext(file.filename)
    counter = 1
    while os.path.exists(file_path):
        file_path = os.path.join(UPLOAD_DIR, f"{name}_{counter}{ext}")
        counter += 1
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"file_url": f"http://localhost:8000/uploads/{os.path.basename(file_path)}"}


@app.post("/upload-multiple/")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    urls = []
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        name, ext = os.path.splitext(file.filename)
        counter = 1
        while os.path.exists(file_path):
            file_path = os.path.join(UPLOAD_DIR, f"{name}_{counter}{ext}")
            counter += 1
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        urls.append(f"http://localhost:8000/uploads/{os.path.basename(file_path)}")
    
    return {"file_urls": urls}


@app.put("/messages/{message_id}", response_model=schemas.Message)
def update_message(
    message_id: int,
    message_update: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    db_message = (
        db.query(models.Message)
        .filter(models.Message.id == message_id, models.Message.owner_id == current_user.id)
        .first()
    )
    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found or unauthorized")
    
    db_message.content = message_update.content
    if message_update.file_url:
        db_message.file_url = message_update.file_url
        
    db.commit()
    db.refresh(db_message)
    return db_message


@app.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    db_message = (
        db.query(models.Message)
        .filter(models.Message.id == message_id, models.Message.owner_id == current_user.id)
        .first()
    )
    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found or unauthorized")
    
    db.delete(db_message)
    db.commit()
    return {"message": "Message deleted successfully"}


@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/users/me/generate-api-key")
def generate_api_key(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    import secrets
    new_key = f"sk-{secrets.token_urlsafe(24)}"
    current_user.api_key = new_key
    db.commit()
    return {"api_key": new_key}


@app.put("/users/me/api-key")
def update_api_key(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    current_user.api_key = user_update.api_key
    db.commit()
    return {"message": "API Key updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
