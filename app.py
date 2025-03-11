from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os

# Initialize Flask app
app = Flask(__name__, template_folder="templates", static_folder="static")

# Default model
DEFAULT_MODEL = "gemini-1.5-pro-latest"
MODEL_NAME = DEFAULT_MODEL

# Set up Gemini API key
genai.configure(api_key="AIzaSyD887ELaR30ZQHvaDuLE8zAB7TJN5VrHr0")

@app.route("/")
def index():
    return render_template("index.html", default_model=MODEL_NAME)

@app.route("/chat", methods=["POST"])
def chat():
    global MODEL_NAME
    data = request.json
    user_message = data.get("message", "")
    selected_model = data.get("model", DEFAULT_MODEL)

    # Update model if changed in settings
    if selected_model != MODEL_NAME:
        MODEL_NAME = selected_model

    # Special handling for math questions
    if any(char.isdigit() for char in user_message):
        prompt = f"Explain how to solve {user_message} step by step with examples, but don't give the final answer."
    else:
        prompt = user_message  # Normal chatbot behavior

    try:
        # Call Gemini API with the selected model
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)

        # Get AI response
        ai_reply = response.text if response.text else "Error: No response from AI."

    except Exception as e:
        ai_reply = f"Error: {str(e)}"

    return jsonify({"response": ai_reply})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Get PORT from environment
    app.run(host="0.0.0.0", port=port, debug=True)
