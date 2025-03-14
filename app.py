from flask import Flask, render_template, request, jsonify, session
import google.generativeai as genai
from prompt import get_prompt

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = "your_secret_key_here"  # Needed for session storage

# Default model
DEFAULT_MODEL = "gemini-1.5-pro-latest"
MODEL_NAME = DEFAULT_MODEL

# Set up Gemini API key
genai.configure(api_key="AIzaSyAzZPGoHjWG6Bf2hdroOZmVYb-7LKC0MTg")

@app.route("/")
def index():
    session.clear()  # Clear chat history when user reloads the page
    return render_template("index.html", default_model=MODEL_NAME)

@app.route("/chat", methods=["POST"])
def chat():
    global MODEL_NAME
    data = request.json
    user_message = data.get("message", "").strip()
    selected_model = data.get("model", DEFAULT_MODEL)

    # Update model if changed
    if selected_model != MODEL_NAME:
        MODEL_NAME = selected_model

    # Load chat history from session
    if "chat_history" not in session:
        session["chat_history"] = []  # Initialize chat history

    chat_history = session["chat_history"]

    # Generate a refined prompt using the chat history
    refined_prompt = get_prompt(user_message, chat_history)

    try:
        # Call Gemini API with the generated prompt
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(refined_prompt)

        # Ensure response contains text
        ai_reply = response.text if hasattr(response, "text") and response.text else "Error: No response from AI."

        # Update chat history
        chat_history.append({"user": user_message, "bot": ai_reply})
        session["chat_history"] = chat_history  # Save updated history

    except Exception as e:
        ai_reply = f"Error: {str(e)}"

    return jsonify({"response": ai_reply})

if __name__ == "__main__":
    app.run(debug=True)
