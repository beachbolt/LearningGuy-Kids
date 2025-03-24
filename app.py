from flask import Flask, render_template, request, jsonify, session
import google.generativeai as genai
from prompt import get_prompt

app = Flask(__name__)
app.secret_key = "your_random_secret_key_here"

# Default model
DEFAULT_MODEL = "gemini-1.5-pro-latest"
MODEL_NAME = DEFAULT_MODEL

# Set up Gemini API key (Example key provided)
genai.configure(api_key="AIzaSyDwNmlPXZJAZ9FiAVqVD5t2ZNkVBYAsIEg")

@app.route("/")
def index():
    session.clear()  # Clear chat history when user reloads the page
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()

    if "grade_level" not in session:
        if user_message.isdigit() and 1 <= int(user_message) <= 12:
            session["grade_level"] = int(user_message)
            grade_level = session.get("grade_level")
            return jsonify({"response": f"Great! I'll help you with {grade_level}th-grade level explanations. What do you want to learn today?"})
        else:
            return jsonify({"response": "Hello! Before we start, what grade are you in? Provide a value between 1-12."})
    
 
    grade_level = session.get("grade_level")

    if "chat_history" not in session:
        session["chat_history"] = []  # Initialize chat history

    chat_history = session["chat_history"]

    # Call the prompt function with the stored grade level
    from prompt import get_prompt
    
    chat_history.append({"role": "user", "content": user_message})

    refined_prompt = get_prompt(chat_history,grade_level)

    try:
      # Call Gemini API with the generated prompt
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(refined_prompt)

        # Ensure response contains text
        ai_reply = response.text if hasattr(response, "text") and response.text else "Error: No response from AI."

        # Update chat history
        chat_history.append({"role": "ai_bot", "content": ai_reply})
        session["chat_history"] = chat_history  # Save updated history

    except Exception as e:
        ai_reply  = f"Oops! Something went wrong. Try again...{e}"

    return jsonify({"response": ai_reply })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)  # Specify port 5000
