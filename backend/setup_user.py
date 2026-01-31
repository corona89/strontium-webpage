import database, models, auth
from database import engine

def setup_user():
    models.Base.metadata.create_all(bind=engine)
    db = next(database.get_db())
    email = "corona89@nate.com"
    password = "New1234!"
    
    user = db.query(models.User).filter(models.User.email == email).first()
    hashed = auth.get_password_hash(password)
    
    if user:
        user.hashed_password = hashed
        print(f"Updated password for {email}")
    else:
        user = models.User(email=email, hashed_password=hashed)
        db.add(user)
        print(f"Created new user: {email}")
        
    db.commit()

if __name__ == "__main__":
    setup_user()
