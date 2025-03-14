def get_prompt(user_message, chat_history):
    """
    Generate a structured prompt that ensures explanations instead of direct answers.
    """
    # Format chat history to provide context
    history_text = "\n".join([f"User: {chat['user']}\nBot: {chat['bot']}" for chat in chat_history])

    # Define strict instructions for explaining instead of giving direct answers
    base_instruction = """
    You are an AI tutor that always teaches with explanations and examples. 
    Never give a direct answer. Instead, break it down step by step. Don't give the final answer.
    Use simple words, analogies, and multiple examples to ensure understanding. 
    If the user asks for a calculation, don't just solve it—show how to do it and why it works.
    if it is a question which cannot be explained with examples, you may tell the answer but explain why that is the answer.
    """

    # Combine instruction, chat history, and the new user message
    full_prompt = f"{base_instruction}\n\nChat History:\n{history_text}\n\nUser: {user_message}\nBot (Explain it step by step):"

    return full_prompt
