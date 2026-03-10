<?php
session_start();
header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

if ($action === 'navigate') {
    $direction = $_POST['direction'] ?? 'next';
    $currentIndex = $_SESSION['current_question'] ?? 0;
    
    $questionsFile = 'questions.json';
    $questions = json_decode(file_get_contents($questionsFile), true);
    $totalQuestions = count($questions);
    
    if ($direction === 'next') {
        $currentIndex = ($currentIndex + 1) % $totalQuestions;
    } else {
        $currentIndex = ($currentIndex - 1 + $totalQuestions) % $totalQuestions;
    }
    
    $_SESSION['current_question'] = $currentIndex;
    
    echo json_encode([
        'status' => 'success',
        'question' => $questions[$currentIndex],
        'index' => $currentIndex
    ]);
}

if ($action === 'save_response') {
    $questionId = $_POST['question_id'] ?? 0;
    $conversationHistory = $_POST['conversation_history'] ?? [];
    $isSolved = $_POST['is_solved'] ?? false;
    
    $responsesFile = 'responses.json';
    $responses = file_exists($responsesFile) ? json_decode(file_get_contents($responsesFile), true) : [];
    
    $responses[] = [
        'question_id' => $questionId,
        'conversation' => $conversationHistory,
        'is_solved' => $isSolved,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    file_put_contents($responsesFile, json_encode($responses, JSON_PRETTY_PRINT));
    
    echo json_encode(['status' => 'success']);
}
?>
