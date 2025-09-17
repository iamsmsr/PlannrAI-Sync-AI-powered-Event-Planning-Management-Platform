import json
from pymongo import MongoClient

mongo_uri = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/event_managment?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(mongo_uri)
db = client["event_managment"]
collection = db["vector"]

with open("data/vector_store.json", "r") as f:
    vectors = json.load(f)

# Store all vectors in a single document under the "vectors" field
collection.insert_one({"vectors": vectors})