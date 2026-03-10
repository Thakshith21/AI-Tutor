$(document).ready(function () {
  // ============================================
  // 1. SPEECH RECOGNITION (Voice -> Text)
  // ============================================
  var recognition;
  var isListening = false;
  var lastInputMethod = 'text'; // Track if last input was 'voice' or 'text'

  // Check if browser supports Web Speech API
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    var SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
  } else {
    console.warn("Web Speech API not supported.");
    $("#mic-btn").hide();
  }

  // Toggle Mic on Click
  $("#mic-btn").click(function () {
    // Stop voice if speaking
    if (synth.speaking) synth.cancel();

    if (!recognition) return;

    if (isListening) {
      console.log("Stopping microphone...");
      recognition.stop();
    } else {
      console.log("Starting microphone...");
      try {
        recognition.start();
      } catch (e) {
        console.log("Recognition already started");
      }
    }
  });

  if (recognition) {
    recognition.onstart = function () {
      console.log("Microphone is ON - Start speaking now!");
      var beep = new Audio("beep.mp3");
      beep.play();

      isListening = true;
      $("#mic-btn").addClass("mic-active");
      $("#mic-btn i").removeClass("fa-microphone").addClass("fa-stop");
      $("#user-input").attr("placeholder", "Listening...");
    };

    recognition.onend = function () {
      console.log("Microphone is OFF");
      isListening = false;
      $("#mic-btn").removeClass("mic-active");
      $("#mic-btn i").removeClass("fa-stop").addClass("fa-microphone");
      $("#user-input").attr("placeholder", "Type or click mic to speak...");
    };

    recognition.onresult = function (event) {
      var transcript = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
          console.log(
            " FINAL Speech recognized:",
            event.results[i][0].transcript
          );
          lastInputMethod = 'voice'; // Mark as voice input
        } else {
          transcript += event.results[i][0].transcript;
          console.log("Interim Speech:", event.results[i][0].transcript);
        }
      }
      $("#user-input").val(transcript);
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      isListening = false;
      $("#mic-btn").removeClass("mic-active");
      $("#mic-btn i").removeClass("fa-stop").addClass("fa-microphone");
      $("#user-input").attr("placeholder", "Error: " + event.error);
    };
  }

  // ============================================
  // 2. SPEECH SYNTHESIS (Text -> Voice)
  // ============================================
  var synth = window.speechSynthesis;

  function speakText(text) {
    if (synth.speaking) {
      synth.cancel(); // Stop any current speech
    }

    // Remove HTML tags so it doesn't read "paragraph tag" etc.
    var plainText = $("<div/>").html(text).text();

    var utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1;
    utterance.pitch = 1;

    synth.speak(utterance);
  }

  // ============================================
  // 3. AUTO-DETECT NEW TUTOR MESSAGES
  // ============================================
  // We use a MutationObserver to watch the #chat-window for changes.
  // This allows this code to work without changing your existing logic that appends messages.

  var chatWindow = document.getElementById("chat-window");

  if (chatWindow) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // Check if nodes were added
        if (mutation.addedNodes.length) {
          var $newNode = $(mutation.addedNodes[0]);

          // Check if the added node is a Tutor message
          if ($newNode.hasClass("tutor-message")) {
            var textToRead = $newNode.find(".message-content").html();
            if (textToRead && lastInputMethod === 'voice') {
              console.log('Responding with speech (voice input detected)');
              speakText(textToRead);
            } else if (textToRead) {
              console.log('Text-only response (text input detected)');
            }
          }
        }
      });
    });

    // Start observing the chat window for added child elements
    observer.observe(chatWindow, { childList: true });
  }

  // Reset input method when user types
  $('#user-input').on('input keypress', function() {
    if (!isListening) {
      lastInputMethod = 'text';
    }
  });
});

