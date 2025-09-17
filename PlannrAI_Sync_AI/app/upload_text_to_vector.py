import json
from pymongo import MongoClient

# MongoDB Atlas connection string
mongo_uri = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/event_managment?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(mongo_uri)
db = client["event_managment"]
collection = db["vector"]

# Read the text file
with open("data/event_management_data.txt", "r") as f:
    text_content = f.read()

# Insert the text file as a document in the vector collection
collection.insert_one({"type": "event_management_text", "content": text_content})

print("Text file uploaded to MongoDB Atlas in 'vector' collection.")
