from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.vector_store import VectorStore
from app.rag import answer_question, answer_question_with_history
from app.update_venue_section import update_vector_store_from_venues


from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import requests
import io

# ClipDrop API Configuration
CLIPDROP_API_KEY = "6d50b6b1a6dbd33cfda899501325e26e9cb1436e905914e299db7283394510150a8994d2e05582995bc4d82fe7a8bbaf"
CLIPDROP_TEXT_TO_IMAGE_URL = "https://clipdrop-api.co/text-to-image/v1"
CLIPDROP_REIMAGINE_URL = "https://clipdrop-api.co/reimagine/v1/reimagine"
CLIPDROP_REMOVE_BACKGROUND_URL = "https://clipdrop-api.co/remove-background/v1"

app = FastAPI()

# Use MongoDB Atlas for vector store
mongo_uri = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/event_managment?retryWrites=true&w=majority&appName=Cluster0"
vector_store = VectorStore()
vector_store.load_from_mongodb(mongo_uri)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Changed to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the frontend directory to serve static files
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Mount the studio directory to serve studio files
app.mount("/studio", StaticFiles(directory="studio"), name="studio")

# Serve the chat assistant at the root
@app.get("/")
async def serve_frontend():
    return FileResponse("frontend/index.html")

# Serve the studio at /studio route
@app.get("/studio/")
async def serve_studio():
    return FileResponse("studio/index.html")

class ChatMessage(BaseModel):
    role: str
    content: str

class TextToImageRequest(BaseModel):
    prompt: str

class QuestionRequest(BaseModel):
    question: str
    chat_history: Optional[List[ChatMessage]] = None


@app.post("/ask")
async def ask_question(req: QuestionRequest):
    if req.chat_history:
        # Convert Pydantic models to dict for processing
        chat_history = [{"role": msg.role, "content": msg.content} for msg in req.chat_history]
        answer = answer_question_with_history(req.question, vector_store, chat_history)
    else:
        # Simple question without history
        answer = answer_question(req.question, vector_store)
    
    return {"answer": answer}

@app.post("/generate-image")
async def generate_image(req: TextToImageRequest):
    """Generate image from text using ClipDrop API"""
    try:
        # Validate prompt length
        if len(req.prompt) > 1000:
            raise HTTPException(status_code=400, detail="Prompt must be 1000 characters or less")
        
        # Make request to ClipDrop API
        response = requests.post(
            CLIPDROP_TEXT_TO_IMAGE_URL,
            headers={'x-api-key': CLIPDROP_API_KEY},
            files={'prompt': (None, req.prompt)}
        )
        
        if response.status_code == 200:
            # Return the image directly
            return Response(
                content=response.content,
                media_type="image/png",
                headers={
                    "x-remaining-credits": response.headers.get("x-remaining-credits", "Unknown"),
                    "x-credits-consumed": response.headers.get("x-credits-consumed", "1")
                }
            )
        else:
            # Handle API errors
            try:
                error_data = response.json()
                raise HTTPException(status_code=response.status_code, detail=error_data.get("error", "Unknown error"))
            except:
                raise HTTPException(status_code=response.status_code, detail="Failed to generate image")
                
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to ClipDrop API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/reimagine-image")
async def reimagine_image(image_file: UploadFile = File(...)):
    """Create variations of an image using ClipDrop Reimagine API"""
    try:
        # Validate file type
        if not image_file.content_type or not image_file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read the uploaded file
        image_data = await image_file.read()
        
        # Make request to ClipDrop Reimagine API
        response = requests.post(
            CLIPDROP_REIMAGINE_URL,
            headers={'x-api-key': CLIPDROP_API_KEY},
            files={'image_file': (image_file.filename, image_data, image_file.content_type)}
        )
        
        if response.status_code == 200:
            # Return the reimagined image
            return Response(
                content=response.content,
                media_type="image/jpeg",
                headers={
                    "x-remaining-credits": response.headers.get("x-remaining-credits", "Unknown"),
                    "x-credits-consumed": response.headers.get("x-credits-consumed", "1")
                }
            )
        else:
            # Handle API errors
            try:
                error_data = response.json()
                raise HTTPException(status_code=response.status_code, detail=error_data.get("error", "Unknown error"))
            except:
                raise HTTPException(status_code=response.status_code, detail="Failed to reimagine image")
                
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to ClipDrop API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/remove-background")
async def remove_background(image_file: UploadFile = File(...), transparency_handling: str = "return_input_if_non_opaque"):
    """Remove background from an image using ClipDrop Remove Background API"""
    try:
        # Validate file type
        if not image_file.content_type or not image_file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate transparency_handling parameter
        valid_options = ["return_input_if_non_opaque", "discard_alpha_layer"]
        if transparency_handling not in valid_options:
            transparency_handling = "return_input_if_non_opaque"
        
        # Read the uploaded file
        image_data = await image_file.read()
        
        # Prepare files for the API request
        files = {
            'image_file': (image_file.filename, image_data, image_file.content_type),
            'transparency_handling': (None, transparency_handling)
        }
        
        # Make request to ClipDrop Remove Background API
        response = requests.post(
            CLIPDROP_REMOVE_BACKGROUND_URL,
            headers={'x-api-key': CLIPDROP_API_KEY},
            files=files
        )
        
        if response.status_code == 200:
            # Return the image with background removed
            return Response(
                content=response.content,
                media_type="image/png",
                headers={
                    "x-remaining-credits": response.headers.get("x-remaining-credits", "Unknown"),
                    "x-credits-consumed": response.headers.get("x-credits-consumed", "1")
                }
            )
        else:
            # Handle API errors
            try:
                error_data = response.json()
                raise HTTPException(status_code=response.status_code, detail=error_data.get("error", "Unknown error"))
            except:
                raise HTTPException(status_code=response.status_code, detail="Failed to remove background")
                
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to ClipDrop API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    

# Endpoint to update vector store from venues
@app.post("/update-vector-store")
async def update_vector_store():
    try:
        update_vector_store_from_venues()
        return {"status": "success", "message": "Vector store updated from venues."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))