
import re
import io
from pymongo import MongoClient
from fpdf import FPDF
import json
from nomic import embed
from app.config import settings
from app.splitter import TextSplitter

def update_vector_store_from_venues():
    # MongoDB Atlas connection string
    mongo_uri = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/event_managment?retryWrites=true&w=majority&appName=Cluster0"
    client = MongoClient(mongo_uri)
    db = client["event_managment"]

    # Fetch main text document
    vector_doc = db["vector"].find_one({"type": "event_management_text"})
    if not vector_doc:
        raise Exception("Main text document not found in vector collection.")
    text = vector_doc["content"]


    venues = list(db["venues"].find({}))

    def format_venue(v):
        reviews = '\n'.join([f"- {r['user']}: '{r['comment']}' ({r['rating']}/5)" for r in v.get('reviews', [])])
        event_types = ', '.join(v.get('eventType', []))
        return f"VENUE: {v.get('venueName', '')}\nAddress: {v.get('address', '')}\nLocation: {v.get('location', '')}\nEvent Types: {event_types}\nRating: {v.get('ratings', '')}/5\nReviews:\n{reviews}\nContact: {v.get('contact', '')}\n"

    venue_section = '\n'.join([format_venue(v) for v in venues])

    vendors = list(db["Business"].find({}))

    def format_vendor(v):
        services = '\n'.join([f"- {s.get('eventType', '')}: ৳{s.get('priceRange', '')}" for s in v.get('services', [])])
        return (
            f"VENDOR: {v.get('companyName', '')}\nRole: {v.get('role', '')}\nEmail: {v.get('email', '')}\nPhone: {v.get('phone', '')}\nRating: {v.get('ratings', '')}/5\nServices:\n{services}\n"
        )

    vendor_section = '\n'.join([format_vendor(v) for v in vendors])

    # Replace venue section in text
    venue_pattern = r"(=== VENUE DIRECTORY===)(.*?)(=== VENDOR DIRECTORY ===)"
    new_text = re.sub(venue_pattern, f"\\1\n{venue_section}\n\\3", text, flags=re.DOTALL)

    # Replace vendor section in text
    vendor_pattern = r"(=== VENDOR DIRECTORY ===)(.*?)(=== PLATFORM USAGE GUIDE ===)"
    new_text = re.sub(vendor_pattern, f"\\1\n{vendor_section}\n\\3", new_text, flags=re.DOTALL)

    # Update the document in MongoDB
    result = db["vector"].update_one({"_id": vector_doc["_id"]}, {"$set": {"content": new_text}})
    if result.modified_count:
        print("Venue section updated successfully in MongoDB.")
    else:
        print("Venue section update failed or no changes made.")

    text_splitter = TextSplitter(chunk_size=512)
    chunks = text_splitter.split(new_text)

    # Embed chunks
    embed_res = embed.text(
        texts=chunks,
        model='nomic-embed-text-v1.5',
        task_type='search_document',
        inference_mode=settings.NOMIC_INFERENCE_MODE
    )
    vectors = [
        {'vector': vector, 'text': text} for vector, text in zip(embed_res['embeddings'], chunks)
    ]

    vector_json_docs = list(db["vector"].find({"type": "vector_store_json"}))
    # Keep only the first one, delete the rest
    if len(vector_json_docs) > 1:
        for doc in vector_json_docs[1:]:
            db["vector"].delete_one({"_id": doc["_id"]})
        print(f"Deleted {len(vector_json_docs) - 1} duplicate vector_store_json documents.")
    else:
        print("No duplicates found or only one vector_store_json document exists.")

    # Update (or create) the JSON vector store
    db["vector"].update_one({"type": "vector_store_json"}, {"$set": {"vectors": vectors}}, upsert=True)
    print("Vector store JSON updated in MongoDB.")
