import {
  generateTime,
  load,
  save,
  randomColour,
  checkquizId,
  isQuizQuestion,
  checkUrlImage,
  getSession,
  findPlayerFromId,
  findGameSession,
  checkSessionsEnded,
} from './helper';
import { Question, Answer, ReturnAnswer, ReturnQuestion, QuestionBody } from './interface';
import HttpError from 'http-errors';
/**
  * Given details about a new question, add it to the specified quiz for the logged in user,
  * and then returns a questionId.
  *
  * @param {string} token - The authentication token of the logged-in user.
  * @param {number} quizId - The ID of the quiz where the question should be added.
  * @param {{
*     question: string,
*     duration: number,
*     points: number,
*     answers: Answer[]
* }} questionBody
* @returns {{ questionId?: number, error?: string }}
*/
export function adminQuestionCreate(token: string, quizId: number, questionBody: Question): { questionId: number } {
  const data = load();
  const quiz = data.quizzes.find(q => q.quizId === quizId);

  // Error 401 checking
  const userId = getSession(token).userId;

  // Error 403 checking
  if (quiz.quizOwnedby !== userId) {
    throw HttpError(403, 'Unauthorised');
  }

  // Error 400 checking
  checkUrlImage(questionBody.thumbnailUrl);

  if (questionBody.question.length < 5 || questionBody.question.length > 50) {
    throw HttpError(400, 'Invalid question string');
  } else if (questionBody.answers.length < 2 || questionBody.answers.length > 6) {
    throw HttpError(400, 'Invalid question amount');
  } else if (questionBody.duration <= 0) {
    throw HttpError(400, 'Invalid question duration');
  } else if (questionBody.points < 1 || questionBody.points > 10) {
    throw HttpError(400, 'Invalid question points');
  }

  const totalDuration = quiz.duration + questionBody.duration;
  if (totalDuration > 180) {
    throw HttpError(400, 'The sum of the question durations in the quiz exceeds 3 minutes');
  }

  for (const answer of questionBody.answers) {
    if (answer.answer.length < 1 || answer.answer.length > 30) {
      throw HttpError(400, 'Invalid answer length');
    }
  }

  const uniqueAnswers = new Set(questionBody.answers.map(ans => ans.answer));
  if (uniqueAnswers.size !== questionBody.answers.length) {
    throw HttpError(400, 'Duplicate question');
  } else if (!questionBody.answers.some(ans => ans.correct)) {
    throw HttpError(400, 'No Correct question');
  }

  checkUrlImage(questionBody.thumbnailUrl);

  const answers: Answer[] = [];
  for (const item of questionBody.answers) {
    answers.push({
      answerId: ++data.ids.answerId,
      answer: item.answer,
      colour: randomColour(),
      correct: item.correct
    });
  }

  const newQuestion: Question = {
    questionId: ++data.ids.questionId,
    question: questionBody.question,
    duration: questionBody.duration,
    points: questionBody.points,
    answers: answers,
    thumbnailUrl: questionBody.thumbnailUrl,
  };

  quiz.questions.push(newQuestion);
  quiz.duration = totalDuration;
  quiz.numQuestions++;
  quiz.timeLastEdited = generateTime();

  save(data);

  return {
    questionId: newQuestion.questionId
  };
}

/**
  * Given details about a new question, add it to the specified quiz for the logged in user,
  * and then returns a questionId.
  *
  * @param {string} token - The authentication token of the logged-in user.
  * @param {number} quizId - The ID of the quiz where the question should be added.
  * @param {number} questionId - The ID of the question.
  * @param {{
*     question: string,
*     duration: number,
*     points: number,
*     answers: Answer[],
*     thumbnailUrl: string,
* }} questionBody
* @returns {{ questionId?: number, error?: string }}
*/
export function adminQuestionUpdate(token: string, quizId: number, questionId: number, questionBody: QuestionBody) {
  const data = load();
  const quiz = data.quizzes.find(q => q.quizId === quizId);
  const userId = getSession(token).userId;

  // Error 403 checking
  if (!quiz) {
    throw HttpError(403, 'Unauthorised');
  }

  if (quiz.quizOwnedby !== userId) {
    throw HttpError(403, 'Unauthorised');
  }

  const question = quiz.questions.find(q => q.questionId === questionId);

  // Error 400 checking
  if (!quiz.questions.some(q => q.questionId === questionId)) {
    throw HttpError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  if (questionBody.question.length < 5 || questionBody.question.length > 50) {
    throw HttpError(400, 'Question string is less than 5 characters in length or greater than 50 characters in length');
  }

  if (questionBody.answers.length < 2 || questionBody.answers.length > 6) {
    throw HttpError(400, 'The question has more than 6 answers or less than 2 answers');
  }

  if (questionBody.duration <= 0) {
    throw HttpError(400, 'The question duration is not a positive number');
  }

  const totalDurationWithoutCurrentQuestion = quiz.duration - question.duration;
  const totalDurationWithUpdatedQuestion = totalDurationWithoutCurrentQuestion + questionBody.duration;
  if (totalDurationWithUpdatedQuestion > 180) {
    throw HttpError(400, 'If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes');
  }

  if (questionBody.points < 1 || questionBody.points > 10) {
    throw HttpError(400, 'The points awarded for the question are less than 1 or greater than 10');
  }

  for (const answer of questionBody.answers) {
    if (answer.answer.length < 1 || answer.answer.length > 30) {
      throw HttpError(400, 'The length of an answer is shorter than 1 character long, or longer than 30 characters long');
    }
  }

  const uniqueAnswers = new Set(questionBody.answers.map((ans: Answer) => ans.answer));
  if (uniqueAnswers.size !== questionBody.answers.length) {
    throw HttpError(400, 'Any answer strings are duplicates of one another (within the same question)');
  }

  if (!questionBody.answers.some((ans: Answer) => ans.correct)) {
    throw HttpError(400, 'There are no correct answers');
  }

  checkUrlImage(questionBody.thumbnailUrl);

  const answers: Answer[] = [];
  for (const item of questionBody.answers) {
    answers.push({
      answerId: ++data.ids.answerId,
      answer: item.answer,
      colour: randomColour(),
      correct: item.correct
    });
  }
  quiz.duration = totalDurationWithUpdatedQuestion;
  quiz.timeLastEdited = generateTime();
  question.question = questionBody.question;
  question.duration = questionBody.duration;
  question.points = questionBody.points;
  question.thumbnailUrl = questionBody.thumbnailUrl;
  question.answers = answers;

  save(data);
  return {};
}

/**
 * Delete a particular question from a quiz
 *
 * @param {string} token
 * @param {number} quizId
 * @param {number} questionId
 * @returns
 */
export function adminQuestionDelete(token: string, quizId: number, questionId: number): { error?: string } {
  const session = getSession(token);

  const data = load();
  const quiz = data.quizzes.find((item) => item.quizId === quizId);

  if (quiz.quizOwnedby !== session.userId) {
    throw HttpError(403, 'Unauthorised');
  }

  const ques = quiz.questions.find((item) => item.questionId === questionId);

  if (!ques) {
    throw HttpError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  checkSessionsEnded(quizId);

  const newQuestions = quiz.questions.filter((item) => item.questionId !== questionId);
  quiz.questions = newQuestions;
  quiz.duration -= ques.duration;
  quiz.numQuestions--;

  save(data);
  return {};
}

/**
 * Move a question from one particular position in the quiz to another
 * @param {string} token
 * @param {number} quizId
 * @param {number} questionId
 * @param {number} newPosition
 * @returns
 */
export function moveQuizQuestion(token: string, quizId: number, questionId: number, newPosition: number): { error?: string } {
  const data = load();

  // Check errors
  // Invalid token
  const session = getSession(token);

  // Non-existent quiz
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);
  if (!quiz) {
    throw HttpError(403, 'Valid token is provided, quiz does not exist: ' + quizId);
  }

  // User is not owner of the quiz
  if (session.userId !== quiz.quizOwnedby) {
    throw HttpError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  // Question Id does not belong to this quiz
  const question = quiz.questions.find((question) => question.questionId === questionId);
  if (!question) {
    throw HttpError(400, 'Question Id does not refer to a valid question within this quiz: ' + questionId);
  }

  // Out of range newPosition
  if (newPosition < 0 || newPosition > quiz.questions.length - 1) {
    throw HttpError(400, 'NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions: ' + newPosition);
  }

  // Current position === new position
  const currentPosition = quiz.questions.findIndex(question => question.questionId === questionId);
  if (currentPosition === newPosition) {
    throw HttpError(400, 'NewPosition is the position of the current question: ' + currentPosition);
  }

  quiz.questions.splice(currentPosition, 1);
  quiz.questions.splice(newPosition, 0, question);
  save(data);
  return {};
}

/**
 * A particular question gets duplicated to immediately after where the source question is
 *
 * @param token
 * @param {number} quizId
 * @param {number} questionId
 * @returns
 */
export function dupQuizQuestion(token: string, quizId: number, questionId: number): { error?: string; newQuestionId?: number; } {
  // Check errors
  // Invalid token
  const session = getSession(token);

  // Non-existent quiz
  const quiz = checkquizId(quizId);

  // User is not owner of the quiz
  if (session.userId !== quiz.quizOwnedby) {
    throw HttpError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  // Question Id does not belong to this quiz
  const question = isQuizQuestion(questionId, quizId);
  if (!question) {
    throw HttpError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  // Create new instance
  const dup = adminQuestionCreate(token, quizId, question);

  // Update quiz
  quiz.timeLastEdited = generateTime();

  return { newQuestionId: dup.questionId };
}

/**
 * A particular question gets duplicated to immediately after where the source question is
 *
 * @param token
 * @param {number} playerId
 * @param {number} questionposition
 * @returns {}
 */
export function currentPlayerQuestionInfor(playerId: number, questionposition: number) {
  const player = findPlayerFromId(playerId);
  const gameSession = findGameSession(player.sessionId);

  // question position is not valid for the session this player is in
  questionposition = questionposition - 1;
  if (questionposition >= gameSession.metadata.questions.length ||
    questionposition < 0) {
    throw HttpError(400, 'question position is not valid for the session this player is in');
  }

  // Session is in LOBBY or END state
  if (gameSession.state === 'END' || gameSession.state === 'LOBBY') {
    throw HttpError(400, 'Session is in LOBBY or END state');
  }

  // session is not currently on this question
  if (gameSession.atQuestion !== questionposition + 1) {
    throw HttpError(400, 'session is not currently on this question');
  }

  const findQuestion = gameSession.metadata.questions[questionposition];
  const returnAnswer: ReturnAnswer[] = [];
  for (const eachAnswer of findQuestion.answers) {
    returnAnswer.push({
      answerId: eachAnswer.answerId,
      answer: eachAnswer.answer,
      colour: eachAnswer.colour
    });
  }
  const returnQuestion: ReturnQuestion = {
    questionId: findQuestion.questionId,
    question: findQuestion.question,
    duration: findQuestion.duration,
    thumbnailUrl: findQuestion.thumbnailUrl,
    points: findQuestion.points,
    answers: returnAnswer,
  };
  return returnQuestion;
}
