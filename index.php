
<?php
session_start();
$questionsFile = 'questions.json';
$questions = json_decode(file_get_contents($questionsFile), true);
$currentIndex = isset($_SESSION['current_question']) ? $_SESSION['current_question'] : 0;
if ($currentIndex >= count($questions)) $currentIndex = 0;
$currentQuestion = $questions[$currentIndex];
$totalQuestions = count($questions);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Tutor</title>

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
<script type="text/javascript" async
      src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML">
    </script>
    <script type="text/x-mathjax-config">
        // Configure MathJax to look for delimiters like $...$ for inline math
        MathJax.Hub.Config({
            tex2jax: {
                inlineMath: [ ['$', '$'], ['\\(', '\\)'] ],
                displayMath: [ ['$$', '$$'], ['\\[', '\\]'] ],
                processEscapes: true
            },
            // Auto-rendering delay adjustment for dynamic content
            'HTML-CSS': { linebreaks: { automatic: true } },
            "SVG": { linebreaks: { automatic: true } }
        });
    </script>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="container-fluid stepguide-app">
        <div class="row fill-height">

            <div class="col-md-6 fill-height left-pane">
                
                <div class="panel panel-primary question-panel">
                    <div class="panel-heading clearfix">
                        <button class="btn btn-xs btn-default pull-left" id="prev-question" style="margin-right:10px;">
                            <i class="fa fa-chevron-left"></i> Previous
                        </button>
                        <h3 class="panel-title" style="display:inline-block;"><i class="fa fa-pencil-square-o"></i> Question <span id="current-q"><?php echo $currentIndex + 1; ?></span> of <?php echo $totalQuestions; ?></h3>
                        <button class="btn btn-xs btn-default pull-right" id="next-question">
                            Next <i class="fa fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="panel-body question-body">
                        <p class="question-text">
                            <?php echo $currentQuestion['question']; ?>
                        </p>
                        
                        <div class="mcq-options">
                            <?php foreach ($currentQuestion['options'] as $opt): ?>
                            <label style="margin-bottom:6px;">
                                <input type="radio" name="option" value="<?php echo $opt['value']; ?>">
                                <?php echo $opt['value'] . ' ' . $opt['text']; ?>
                            </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

<div class="panel panel-success solution-panel">
    <div class="panel-heading clearfix">
        <h3 class="panel-title pull-left">
            <i class="fa fa-flask"></i> Step-by-Step Solution Tracker
        </h3>
        <button class="btn btn-xs btn-default pull-right"
                data-toggle="collapse"
                data-target="#solution-body-collapse"
                aria-expanded="true"
                aria-controls="solution-body-collapse"
                id="solution-collapse-toggle">
            <i class="fa fa-chevron-down"></i> </button>
    </div>

    <div class="panel-collapse collapse in" id="solution-body-collapse">
        <div class="panel-body solution-body" id="solution-pane">
            <p class="initial-message">Start by communicating your first step in the chat window to begin the solution process.</p>
        </div>
    </div>
</div>

            </div>

            <div class="col-md-6 fill-height right-pane">
                <div class="chat-container">
                    <div class="chat-header">
                        <i class="fa fa-graduation-cap"></i> AI Tutor Chat Window
                    </div>
                    <div class="chat-body" id="chat-window">
                        <div class="message tutor-message">
                            <span class="user-name"><i class="fa fa-android"></i> Tutor</span>
                            <div class="message-content">
                                Welcome! Let's solve this problem together. To start, what's the first step you'd take to solve the question.
                            </div>
                            <span class="message-time">Just Now</span>
                        </div>
                        
                        </div>
                    <div class="chat-footer">
    <div class="input-group">
        <!-- New Microphone Button -->
        <span class="input-group-btn">
            <button class="btn btn-default" type="button" id="mic-btn">
                <i class="fa fa-microphone"></i>
            </button>
        </span>
        
        <!-- Existing Input -->
        <input type="text" id="user-input" class="form-control" placeholder="Type or click mic to speak...">
        
        <!-- Existing Send Button -->
        <span class="input-group-btn">
            <button class="btn btn-primary" type="button" id="send-btn">
                <i class="fa fa-send"></i> Send
            </button>
        </span>
    </div>
</div>                </div>
            </div>

        </div>
    </div>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    <script>
        var currentQuestionIndex = <?php echo $currentIndex; ?>;
        var totalQuestions = <?php echo $totalQuestions; ?>;
        var allQuestions = <?php echo json_encode($questions); ?>;
        var problem = <?php echo json_encode($currentQuestion['question']); ?>;
        var options = <?php echo json_encode(implode(', ', array_column($currentQuestion['options'], 'text'))); ?>;
    </script>
    <script src="app.js"></script> 
    <script src="aivoice.js"></script> 
</body>
</html>


