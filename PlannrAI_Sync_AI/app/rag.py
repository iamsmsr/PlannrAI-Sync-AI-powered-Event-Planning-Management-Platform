from nomic import embed
from groq import Groq
from app.config import settings
from app.vector_store import VectorStore

#SYSTEM_PROMPT = """You are an assistant that answers user questions about venues in Bangladesh and event organization. Always reply in concise bullet points or numbered lists, and keep answers as short as possible unless the user asks for details."""# USER_PROMPT = """
# Use the following pieces of context to answer the user question.
# You must only use the facts from the context to answer.
# If the answer cannot be found in the context, say that you don't have enough information to answer the question and provide any relevant facts found in the context.
# Don't address \"the context\" explicitly in your answer, answer the question like it's your own knowledge.


# Context:
# {context}

# User Question:
# {question}
# """
SYSTEM_PROMPT = (
    "You are PlannrAI Sync, an intelligent event planning assistant that helps users with venue bookings, vendor selection, and event management in Bangladesh. "
    "You provide expert guidance on venues, catering, photography, decoration, and other event services with accurate pricing and recommendations if it is in your context. "
    "Always reply in concise bullet points or numbered lists, keeping answers short and actionable unless detailed information is requested. "
    "STRICT RULE: You must NEVER provide any information, facts that are not found directly in the provided context. If the answer is not in the context, say you do not have enough information. Do NOT guess, invent, or use outside knowledge under ANY circumstances."
    "You support both English and Bangla queries - respond in the same language as the user's question. "
    "Also  give short paragraph in answers and it should not become a long paragraph."
    "Include relevant pricing in Bangladeshi Taka (৳) when discussing costs. "
    "Do not reference 'the context' in your responses - answer as if this is your expertise."
)


USER_PROMPT = """



Context:
{context}

User Question:
{question}
"""


groq_client = Groq(api_key=settings.GROQ_API_KEY)

def groq_summarize(chat_messages):
    """Summarize old chat messages using Groq's fast 8B model"""
    # Convert messages to text format
    chat_text = ""
    for msg in chat_messages:
        role = "User" if msg["role"] == "user" else "Assistant"
        chat_text += f"{role}: {msg['content']}\n\n"
    
    # Use fast 8B model for summarization
    summary_prompt = f"""Summarize this conversation keep it 5 to 10 senteces  , focusing on the main topics discussed and key information shared:

{chat_text}

Summary:"""
    
    try:
        summary_response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": summary_prompt}],
            model="llama3-8b-8192",  # Fast model for summarization
            max_tokens=150,
            temperature=0.3
        )
        return summary_response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback: simple truncation if summarization fails
        return f"Previous conversation covered: {len(chat_messages)} messages about event planning topics."

def compress_chat_history(chat_history):
    """Compress chat history to avoid token limits"""
    if len(chat_history) > 6:
        # Keep last 3 messages + summarize older ones
        recent = chat_history[-3:]
        old = chat_history[:-3]
        
        # Quick summary with Groq 8B
        summary = groq_summarize(old)
        return [{"role": "system", "content": f"Previous context: {summary}"}] + recent
    return chat_history

def answer_question(question, vector_store):
    # Embed the user's question
    embed_res = embed.text(
        texts=[question],
        model='nomic-embed-text-v1.5',
        task_type='search_query',
        inference_mode=settings.NOMIC_INFERENCE_MODE
    )
    query_vector = embed_res['embeddings'][0]

    # Find the most relevant chunks in our vector store using semantic search
    chunks = vector_store.query(query_vector)

    # Prepare the context and prompt, and generate an answer with the LLM
    context = '\n\n---\n\n'.join([chunk['text'] for chunk in chunks]) + '\n\n---'
    user_message =  USER_PROMPT.format(context=context, question=question)
    messages=[
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'user', 'content': user_message}
    ]
    chat_completion = groq_client.chat.completions.create(
        messages=messages, model=settings.GROQ_MODEL
    )
    return chat_completion.choices[0].message.content

def answer_question_with_history(question, vector_store, chat_history):
    """Answer question with chat history context"""
    # Embed the user's question for RAG search
    embed_res = embed.text(
        texts=[question],
        model='nomic-embed-text-v1.5',
        task_type='search_query',
        inference_mode=settings.NOMIC_INFERENCE_MODE
    )
    query_vector = embed_res['embeddings'][0]

    # Find the most relevant chunks in our vector store using semantic search
    chunks = vector_store.query(query_vector)

    # Prepare the context from RAG
    context = '\n\n---\n\n'.join([chunk['text'] for chunk in chunks]) + '\n\n---'
    user_message = USER_PROMPT.format(context=context, question=question)
    
    # Build messages with chat history
    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    
    # Compress chat history to avoid token limits
    if chat_history:
        compressed_history = compress_chat_history(chat_history)
        messages.extend(compressed_history)
    
    # Add current question with RAG context
    messages.append({'role': 'user', 'content': user_message})
    
    chat_completion = groq_client.chat.completions.create(
        messages=messages, model=settings.GROQ_MODEL
    )
    return chat_completion.choices[0].message.content

def main():
    vector_store = VectorStore()
    mongo_uri = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/event_managment?retryWrites=true&w=majority&appName=Cluster0"
    vector_store.load_from_mongodb(mongo_uri)

    print("Ask a question:\n")
    while True:
        question = input()
        answer = answer_question(question, vector_store)
        print(answer, '\n')
