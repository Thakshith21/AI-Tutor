$(document).ready(function() {
    const $solutionCollapse = $('#solution-body-collapse');
    const $toggleBtnIcon = $('#solution-collapse-toggle i');

    // --- NEW: Solution Panel Collapse Handler ---

    // Event fired when the collapse transition is finished opening
    $solutionCollapse.on('shown.bs.collapse', function () {
        $toggleBtnIcon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
        // You might need to manually trigger a resize/re-layout here if flexbox doesn't naturally adjust the question panel's height
    });

    // Event fired when the collapse transition is finished closing
    $solutionCollapse.on('hidden.bs.collapse', function () {
        $toggleBtnIcon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
        // Trigger MathJax typesetting on the question panel in case it was resized and needs refreshing
        const $questionBody = $('.question-body');
         if (typeof MathJax !== 'undefined' && MathJax.Hub) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, $questionBody[0]]);
        }
    });
    // --- Global Variables/Selectors ---
    const $chatWindow = $('#chat-window');
    const $userInput = $('#user-input');
    const $sendBtn = $('#send-btn');
    const $solutionPane = $('#solution-pane');
 
    const $correctOption = $('input[name="option"][value="' + allQuestions[currentQuestionIndex].answer + '"]').parent(); 
    
    // --- NEW: Confetti/Celebration Function ---
    function triggerCelebration() {
        // 1. Mark the correct answer in green/highlight
        $correctOption.css({
            'background-color': '#dff0d8', // Bootstrap success background
            'border': '2px solid #3c763d', // Dark green border
            'font-weight': 'bold',
            'padding': '5px',
            'border-radius': '4px'
        });
        $correctOption.find('input').prop('checked', true); // Select the answer
        
        // 2. Simple animation/flash effect (simulating confetti)
        $correctOption.fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200).css('box-shadow', '0 0 20px rgba(60, 118, 61, 0.5)');

        // 3. Add a final congratulatory message
        addMessageToChat("Congratulations! You have correctly solved the problem. The StepGuide journey is complete!", 'tutor');
        
        // 4. Disable input to prevent further chat
        $userInput.prop('disabled', true);
        $sendBtn.prop('disabled', true);
    }
    // **GLOBAL VARIABLE FOR CONVERSATION HISTORY**
    let conversationHistory = [
        // Initialize with the first AI message context (must match the HTML initial message)
        {
            role: "tutor",
            text: "Welcome! Let's solve this problem together. To start, what's the first step you'd take to find the solution to the problem",
            problem: allQuestions[currentQuestionIndex].question,
            options: allQuestions[currentQuestionIndex].options.map(o => o.text).join(', '),
            correct_answer: allQuestions[currentQuestionIndex].answer
        }
    ];
    
    // --- Question Navigation ---
    $('#next-question, #prev-question').on('click', function() {
        const direction = $(this).attr('id') === 'next-question' ? 'next' : 'prev';
        
        // Save current conversation
        $.post('question_handler.php', {
            action: 'save_response',
            question_id: allQuestions[currentQuestionIndex].id,
            conversation_history: conversationHistory,
            is_solved: $userInput.prop('disabled')
        });
        
        // Navigate
        $.post('question_handler.php', {
            action: 'navigate',
            direction: direction
        }, function(response) {
            if (response.status === 'success') {
                location.reload();
            }
        }, 'json');
    });
    
    // --- Helper Functions ---

    /**
     * Scrolls the chat window to the bottom.
     */
    function scrollToBottom() {
        $chatWindow.scrollTop($chatWindow[0].scrollHeight);
    }

    /**
     * Generates the HTML for a new chat message.
     * @param {string} content - The text content of the message.
     * @param {string} type - 'user' or 'tutor'.
     */
    function createMessageHtml(content, type) {
        const userName = type === 'user' ? 'User' : 'Tutor';
        const iconClass = type === 'user' ? 'fa-user' : 'fa-android';
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="message ${type}-message">
                <span class="user-name"><i class="fa ${iconClass}"></i> ${userName}</span>
                <div class="message-content">
                    ${content}
                </div>
                <span class="message-time">${timestamp}</span>
            </div>
        `;
    }

    /**
     * Adds a new message to the chat window, updates history, and triggers MathJax rendering.
     * @param {string} content - The text content.
     * @param {string} type - 'user' or 'tutor'.
     */
    function addMessageToChat(content, type) {
        const messageHtml = createMessageHtml(content, type);
        const $newMessage = $(messageHtml); // Create jQuery object
        $chatWindow.append($newMessage);

        // Update History Array
        conversationHistory.push({
            role: type,
            text: content.trim() // Store only the clean text
        });

        // Tell MathJax to process the new element
        if (typeof MathJax !== 'undefined' && MathJax.Hub) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, $newMessage[0]]);
        }
        
        scrollToBottom();
    }

    /**
     * Adds a step to the solution tracker pane and triggers MathJax rendering.
     * @param {string} stepContent - The content of the solution step.
     */
    function addStepToSolution(stepContent) {
        // Remove the initial instruction message if it exists
        $solutionPane.find('.initial-message').remove();

        const stepHtml = `
            <div class="solution-step">
                <p><strong><i class="fa fa-arrow-right text-success"></i> Step:</strong> ${stepContent}</p>
                <hr style="margin: 5px 0;">
            </div>
        `;
        const $newStep = $(stepHtml); // Create jQuery object
        $solutionPane.append($newStep);

        // Tell MathJax to process the new element
        if (typeof MathJax !== 'undefined' && MathJax.Hub) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, $newStep[0]]);
        }
        
        $solutionPane.scrollTop($solutionPane[0].scrollHeight);
    }

    /**
     * Handles the sending of the message via AJAX to the Python backend.
     * @param {string} userMessage - The message sent by the user.
     */
    function processUserMessage(userMessage) {
        // 1. Display user message immediately (and save to history)
        addMessageToChat(userMessage, 'user');

        // Prepare the data to send to the backend
        const dataToSend = {
            'message': userMessage,
            'history': conversationHistory 
        };
        
        // 2. AJAX call to the Python CGI script
        $.ajax({
            type: "POST",
            url: "tutor_backend.py", // Path to your CGI script
            data: JSON.stringify(dataToSend),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            beforeSend: function() {
                // Optional: Disable input while waiting for response
                $userInput.prop('disabled', true);
                $sendBtn.prop('disabled', true);
            },
            success: function(response) {
                if (response.status === "success") {
                    // 3. Display the AI's chat response (and save to history)
                    addMessageToChat(response.chat_message, 'tutor');
                    
                    // 4. Add the solution step if provided
                    if (response.solution_step) {
                        addStepToSolution(response.solution_step);
                    }
                    if (response.is_solved === true || response.is_solved === "true") {
                        triggerCelebration();
                        // Save solved response
                        $.post('question_handler.php', {
                            action: 'save_response',
                            question_id: allQuestions[currentQuestionIndex].id,
                            conversation_history: conversationHistory,
                            is_solved: true
                        });
                    }
                } else {
                    // Handle error from backend (e.g., failed to process)
                    addMessageToChat("Error from Tutor: " + response.message, 'tutor');
                    console.error("Backend Error:", response);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // Handle network or server configuration error
                addMessageToChat("Tutor is offline. Network Error: " + textStatus, 'tutor');
                console.error("AJAX Error:", textStatus, errorThrown, jqXHR.responseText);
            },
            complete: function() {
                // Re-enable input after request is complete
                $userInput.prop('disabled', false).focus();
                $sendBtn.prop('disabled', false);
            }
        });
        
        // Clear the input field after sending
        $userInput.val('');
    }

    // --- Event Handlers ---

    /**
     * Handles the sending of a message via button click or Enter key.
     */
    function handleSendMessage() {
        const userMessage = $userInput.val().trim();

        if (userMessage !== '') {
            processUserMessage(userMessage);
        }
    }

    // Event listener for the Send button
    $sendBtn.on('click', handleSendMessage);

    // Event listener for the Enter key press in the input field
    $userInput.on('keypress', function(e) {
        if (e.which === 13 && !$(this).prop('disabled')) { // 13 is Enter
            handleSendMessage();
            e.preventDefault(); // Prevent default newline behavior
        }
    });

    // Initial action: Scroll to show the first tutor message
    scrollToBottom();
});

