#!/var/www/html/thakshith/aigen/venv/bin/python3
# -*- coding: utf-8 -*-

import cgi
import json
import sys
import os
import textwrap
import google.generativeai as genai

# --- Headers ---
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print()  # End of HTTP headers

# Configure Gemini with your API key
genai.configure(api_key="")

# ----------------------------------------------------------------------
# SYSTEM INSTRUCTION (persona + LaTeX rules)
# ----------------------------------------------------------------------
SYSTEM_INSTRUCTION = textwrap.dedent("""
    You are 'Solution Finder', an expert in quantitative and reasoning problems.
    Your role is to guide the student step by step.

    ***STRICT LATEX OUTPUT RULES:***
    1. ALL math must be enclosed in $...$ for inline display.
    2. Use \\text{...} for any units or plain text inside math mode.
    3. Use \\times for multiplication.
    4. Use \\frac{numerator}{denominator} for fractions.
    5. NEVER use non-standard commands.

    CRITICAL RULES:
    1. Check if the student's answer matches the Correct Answer option letter.
    2. If student says the correct option letter (e.g., "B", "Option B", "The answer is B"), 
       IMMEDIATELY set 'is_solved' to true.
    3. If 'is_solved' is true, 'tutor_response' MUST start with "🎉 Congratulations!",
       then provide 'Topper's Tips', and end with encouragement.
    4. Only guide step-by-step if the student's answer is wrong or they ask for help.

    The final output MUST be a JSON object with exactly three keys:
    'tutor_response', 'solution_step', 'is_solved'.
""")

# ----------------------------------------------------------------------
# GEMINI API CALL
# ----------------------------------------------------------------------
def call_gemini_api(user_message, conversation_history):
    try:
        # Build a prompt from history + user message
        problem = conversation_history[0].get("problem", "") if conversation_history else ""
        options = conversation_history[0].get("options", "") if conversation_history else ""
        correct_answer = conversation_history[0].get("correct_answer", "") if conversation_history else ""
        history_text = "\n".join([f"{msg['role']}: {msg['text']}" for msg in conversation_history])

        # Check if user directly provided correct answer
        import re
        user_msg_upper = user_message.upper().strip()
        
        # Extract option letter from user message (A, B, C, D, E)
        option_match = re.search(r'\b([A-E])\b', user_msg_upper)
        
        if option_match:
            user_option = option_match.group(1)
            is_correct = (user_option == correct_answer.upper())
            
            if is_correct:
                return {
                    "tutor_response": f"🎉 Congratulations! You've got it right! The correct answer is indeed Option {correct_answer}.\n\n**Topper's Tips:** Always break down complex relationships step by step and draw diagrams when dealing with family trees or logical relationships.\n\nKeep up the excellent work! 🌟",
                    "solution_step": f"Final Answer: Option {correct_answer}",
                    "is_solved": True
                }
            else:
                return {
                    "tutor_response": f"That's not quite right. Option {user_option} is incorrect. Let's think through this step by step. Can you explain your reasoning?",
                    "solution_step": None,
                    "is_solved": False
                }

        full_prompt = f"""
        Problem Context: {problem}
        Given Options: {options}
        Correct Answer: Option {correct_answer}
        Conversation History:
        {history_text}

        Student's last message: "{user_message}"

        {SYSTEM_INSTRUCTION}
        """

        # Call Gemini
        model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            generation_config={
                'temperature': 0.7,
                'response_mime_type': 'application/json'
            }
        )
        response = model.generate_content(full_prompt)

        # Try to parse JSON output
        json_output = response.text.strip()
        try:
            ai_result = json.loads(json_output)
            return ai_result
        except json.JSONDecodeError:
            return {
                "tutor_response": f"Unparseable response: {json_output}",
                "solution_step": None,
                "is_solved": False
            }

    except Exception as e:
        return {
            "tutor_response": f"An API error occurred: {str(e)}",
            "solution_step": None,
            "is_solved": False
        }

# ----------------------------------------------------------------------
# MAIN CGI LOGIC
# ----------------------------------------------------------------------
try:
    post_data = ""
    if os.environ.get("REQUEST_METHOD") == "POST":
        content_len = int(os.environ.get("CONTENT_LENGTH", 0))
        post_data = sys.stdin.read(content_len)

        if not post_data:
            raise ValueError("No POST data received.")

        data = json.loads(post_data)
        user_message = data.get("message", "").strip()
        conversation_history = data.get("history", [])

        if not user_message:
            raise ValueError("User message is empty.")

        ai_result = call_gemini_api(user_message, conversation_history)

        response_data = {
            "status": "success",
            "chat_message": ai_result.get("tutor_response", "No response"),
            "solution_step": ai_result.get("solution_step", None),
            "is_solved": ai_result.get("is_solved", False)
        }
    else:
        response_data = {
            "status": "error",
            "message": "Only POST requests are accepted."
        }

except Exception as e:
    response_data = {
        "status": "error",
        "message": f"Execution error: {str(e)}",
        "debug": post_data
    }

# Output JSON
print(json.dumps(response_data))
