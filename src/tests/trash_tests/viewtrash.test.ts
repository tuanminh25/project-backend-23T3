import {
  testRegister,
  testCreateQuiz,
  testClear,
  testQuizToTrash,
  testViewTrash,
} from '../testHelper';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  testClear();
});

describe('View Trash', () => {
  let user: { token: string };
  let quiz: { quizId: number };

  beforeEach(() => {
    user = testRegister('testuser@example.com', 'password123', 'Test', 'User').response;
    quiz = testCreateQuiz(user.token, 'Sample Quiz', 'Sample Description').response;
  });

  test('Empty token', () => {
    testQuizToTrash(user.token, quiz.quizId);
    const trash = testViewTrash('');
    expect(trash.status).toStrictEqual(401);
    expect(trash.response).toStrictEqual(ERROR);
  });

  test('Invalid token', () => {
    testQuizToTrash(user.token, quiz.quizId);
    const trash = testViewTrash(user.token + 'randome 2313');
    expect(trash.status).toStrictEqual(401);
    expect(trash.response).toStrictEqual(ERROR);
  });

  test('Simple View trash', () => {
    testQuizToTrash(user.token, quiz.quizId);
    const trash = testViewTrash(user.token);
    expect(trash.status).toStrictEqual(200);
    expect(trash.response).toStrictEqual(
      {
        quizzes: [
          {
            quizId: quiz.quizId,
            name: 'Sample Quiz'
          }
        ]
      }
    );
  });

  test('Many quiz in trash', () => {
    const quiz2 = testCreateQuiz(user.token, 'Sample Quiz2', 'Sample Description2').response;
    const quiz3 = testCreateQuiz(user.token, 'Sample Quiz3', 'Sample Description2').response;
    const quiz4 = testCreateQuiz(user.token, 'Sample Quiz4', 'Sample Description2').response;

    testQuizToTrash(user.token, quiz2.quizId);
    testQuizToTrash(user.token, quiz3.quizId);
    testQuizToTrash(user.token, quiz4.quizId);

    const trash = testViewTrash(user.token);
    expect(trash.status).toStrictEqual(200);
    expect(trash.response).toStrictEqual(
      {
        quizzes: [
          {
            quizId: quiz2.quizId,
            name: 'Sample Quiz2'
          },
          {
            quizId: quiz3.quizId,
            name: 'Sample Quiz3'
          },
          {
            quizId: quiz4.quizId,
            name: 'Sample Quiz4'
          }
        ]
      }
    );
  });

  test('Empty Trash', () => {
    const user2 = testRegister('empty@gmail.com', 'password1232', 'Testlol', 'Userxd').response;
    testQuizToTrash(user.token, quiz.quizId);

    const trash = testViewTrash(user2.token);
    expect(trash.status).toStrictEqual(200);
    expect(trash.response).toStrictEqual(
      {
        quizzes: []
      }
    );
  });
});

testClear();
