import {
  testRegister,
  testCreateQuiz,
  testCreateQuizQuestion,
  testClear,
} from '../testHelper';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  testClear();
});

describe('CreateQuizQuestion', () => {
  let user: { token: string; };
  let quiz: { quizId: number; };
  const validQuestion = {
    question: 'What is the capital of France?',
    duration: 4,
    points: 5,
    answers: [
      { answer: 'Berlin', correct: false },
      { answer: 'Madrid', correct: false },
      { answer: 'Paris', correct: true },
      { answer: 'Rome', correct: false }
    ],
    thumbnailUrl: 'http://example.com/image.jpg'
  };

  beforeEach(() => {
    user = testRegister('testuser@example.com', 'password123', 'Test', 'User').response;
    quiz = testCreateQuiz(user.token, 'Sample Quiz', 'Sample Description').response;
  });

  test('Successfully create quiz question', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, validQuestion);
    expect(question.response).toHaveProperty('questionId');
    expect(question.status).toBe(200);
  });

  test('Invalid question string length', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'Who?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'A', correct: true },
        { answer: 'B', correct: false }
      ]
    });
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Too many answers', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'Which of the following are prime numbers?',
      thumbnailUrl: 'http://example.com/image.jpg',
      duration: 4,
      points: 5,
      answers: [
        { answer: '2', correct: true },
        { answer: '3', correct: true },
        { answer: '4', correct: false },
        { answer: '5', correct: true },
        { answer: '6', correct: false },
        { answer: '7', correct: true },
        { answer: '8', correct: false },
      ]
    });
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Invalid question duration', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'What is 2 + 2?',
      thumbnailUrl: 'http://example.com/image.jpg',
      duration: -4,
      points: 5,
      answers: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ]
    });
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Sum of question durations exceeds 3 minutes', () => {
    testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'Is three a number?',
      duration: 400,
      thumbnailUrl: 'http://example.com/image.jpg',
      points: 5,
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ]
    });

    const finalQuestion = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'Final question?',
      duration: 1000,
      thumbnailUrl: 'http://example.com/image.jpg',
      points: 5,
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ]
    });
    expect(finalQuestion.response).toStrictEqual(ERROR);
    expect(finalQuestion.status).toBe(400);
  });

  test('Points awarded for the question are too low', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'What is the capital of Spain?',
      duration: 5,
      thumbnailUrl: 'http://example.com/image.jpg',
      points: 0,
      answers: [
        { answer: 'Madrid', correct: true },
        { answer: 'Barcelona', correct: false }
      ]
    });
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Duplicate answer strings', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'Which of these are colors?',
      duration: 5,
      thumbnailUrl: 'http://example.com/image.jpg',
      points: 5,
      answers: [
        { answer: 'Red', correct: true },
        { answer: 'Red', correct: false }
      ]
    });
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('No correct answers provided', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'Which of these are colors?',
      duration: 5,
      thumbnailUrl: 'http://example.com/image.jpg',
      points: 5,
      answers: [
        { answer: 'Red', correct: false },
        { answer: 'Blue', correct: false }
      ]
    }
    );
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Question string is too long', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: 'A'.repeat(51), // Creates a string with 51 "A" characters
      duration: 10,
      thumbnailUrl: 'http://example.com/image.jpg',
      points: 5,
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ]
    });
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Question string is empty', () => {
    const question = testCreateQuizQuestion(user.token, quiz.quizId, {
      question: '',
      duration: 10,
      thumbnailUrl: 'http://example.com/image.jpg',
      points: 5,
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ]
    });
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Empty token', () => {
    const question = testCreateQuizQuestion('', quiz.quizId, validQuestion);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(401);
  });

  test('Invalid token', () => {
    const question = testCreateQuizQuestion('invalidTokenHere', quiz.quizId, validQuestion);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(401);
  });

  test('Not an owner of the quiz', () => {
    const anotherUser = testRegister('anotheruser@example.com', 'password1234', 'Another', 'User').response;
    const question = testCreateQuizQuestion(anotherUser.token, quiz.quizId, validQuestion);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(403);
  });

  test('Prioritise 401 error over 400', () => {
    const question = testCreateQuizQuestion('', 2384, validQuestion);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(401);
  });

  test('Prioritise 403 error over 400', () => {
    const anotherUser = testRegister('anotheruser@example.com', 'password1234', 'Another', 'User').response;
    const question = testCreateQuizQuestion(anotherUser.token, quiz.quizId, validQuestion);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(403);
  });

  const invalidThumbnailUrls = [
    { description: 'empty URL', url: '' },
    { description: 'invalid filetype', url: 'http://example.com/image.gif' },
    { description: 'invalid protocol', url: 'ftp://example.com/image.jpg' }
  ];

  test.each(invalidThumbnailUrls)('fails with $description', ({ url }) => {
    const invalidQuestion = { ...validQuestion, thumbnailUrl: url };
    const question = testCreateQuizQuestion(user.token, quiz.quizId, invalidQuestion);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  const pointsTestCases = [
    { description: 'points are 0', points: 0, shouldPass: false },
    { description: 'points are -10', points: -10, shouldPass: false },
    { description: 'points are 60', points: 60, shouldPass: false },
    { description: 'points are 5', points: 5, shouldPass: true },
  ];

  test.each(pointsTestCases)('fails when $description', ({ points, shouldPass }) => {
    const questionBody = { ...validQuestion, points };
    const questionResponse = testCreateQuizQuestion(user.token, quiz.quizId, questionBody);

    if (shouldPass) {
      expect(questionResponse.response).toHaveProperty('questionId');
      expect(questionResponse.status).toBe(200);
    } else {
      expect(questionResponse.response).toStrictEqual(ERROR);
      expect(questionResponse.status).toBe(400);
    }
  });

  test('Answer string is too long', () => {
    const long = validQuestion;
    long.answers = [
      { answer: 'A'.repeat(31), correct: true }, // 31 characters long
      { answer: 'B', correct: false }
    ];

    const question = testCreateQuizQuestion(user.token, quiz.quizId, long);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });

  test('Answer string is too short', () => {
    const short = validQuestion;
    short.answers = [
      { answer: 'A', correct: true }, // 31 characters long
      { answer: '', correct: false }
    ];

    const question = testCreateQuizQuestion(user.token, quiz.quizId, short);
    expect(question.response).toStrictEqual(ERROR);
    expect(question.status).toBe(400);
  });
});

testClear();
