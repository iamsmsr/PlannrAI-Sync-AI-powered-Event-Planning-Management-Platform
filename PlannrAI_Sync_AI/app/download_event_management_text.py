from pymongo import MongoClient

def download_event_management_text(output_path="event_management_data.txt"):
    """
    Downloads the main event management text from MongoDB and saves it as a .txt file.
    """
    mongo_uri = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/event_managment?retryWrites=true&w=majority&appName=Cluster0"
    client = MongoClient(mongo_uri)
    db = client["event_managment"]

    # Fetch main text document
    vector_doc = db["vector"].find_one({"type": "event_management_text"})
    if not vector_doc:
        raise Exception("Main text document not found in vector collection.")
    text = vector_doc["content"]

    # Write to file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Event management text saved to {output_path}")

if __name__ == "__main__":
    download_event_management_text()
    # Optionally, print the file contents
    with open("event_management_data.txt", "r", encoding="utf-8") as f:
        print(f.read())
