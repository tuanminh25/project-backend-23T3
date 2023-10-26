import {
  isToken,
  checkauthUserId,
  generateTime,
  Question,
  load,
  save
} from './helper';

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
export function adminQuestionCreate(token: string, quizId: number, questionBody: Question):{ questionId?: number, error?: string } {
  const data = load();
  const quiz = data.quizzes.find(q => q.quizId === quizId);

  // Error 401 checking
  if (!isToken(token)) {
    return { error: 'Invalid token' };
  }

  const userId = isToken(token).userId;
  if (!checkauthUserId(userId)) {
    return { error: 'Invalid token' };
  }

  if (!quiz) {
    return { error: 'Invalid token' };
  }

  // Error 403 checking
  if (quiz.quizOwnedby !== userId) {
    return { error: 'Unauthorised' };
  }

  // Error 400 checking
  if (questionBody.question.length < 5 || questionBody.question.length > 50) {
    return {
      error: 'Question string is less than 5 characters in length or greater than 50 characters in length'
    };
  } else if (questionBody.answers.length < 2 || questionBody.answers.length > 6) {
    return {
      error: 'The question has more than 6 answers or less than 2 answers'
    };
  } else if (questionBody.duration <= 0) {
    return {
      error: 'The question duration is not a positive number'
    };
  } else if (questionBody.points < 1 || questionBody.points > 10) {
    return {
      error: 'The points awarded for the question are less than 1 or greater than 10'
    };
  }

  const totalDuration = quiz.duration + questionBody.duration;
  if (totalDuration > 180) {
    return {
      error: 'The sum of the question durations in the quiz exceeds 3 minutes'
    };
  }

  for (const answer of questionBody.answers) {
    if (answer.answer.length < 1 || answer.answer.length > 30) {
      return {
        error: 'The length of an answer is shorter than 1 character long, or longer than 30 characters long'
      };
    }
  }

  const uniqueAnswers = new Set(questionBody.answers.map(ans => ans.answer));
  if (uniqueAnswers.size !== questionBody.answers.length) {
    return {
      error: 'Any answer strings are duplicates of one another (within the same question)'
    };
  } else if (!questionBody.answers.some(ans => ans.correct)) {
    return {
      error: 'There are no correct answers'
    };
  }

  const newQuestion: Question = {
    questionId: ++data.ids.questionId,
    question: questionBody.question,
    duration: questionBody.duration,
    points: questionBody.points,
    answers: questionBody.answers
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
*     answers: Answer[]
* }} questionBody
* @returns {{ questionId?: number, error?: string }}
*/
export function adminQuestionUpdate(token: string, quizId: number, questionId: number, questionBody: object):{ questionId?: number, error?: string } {
  const data = load();
  const quiz = data.quizzes.find(q => q.quizId === quizId);

  // Error 401 checking
  if (!isToken(token)) {
    return { error: 'Invalid token' };
  }

  const userId = isToken(token).userId;
  if (!checkauthUserId(userId)) {
    return { error: 'Invalid token' };
  }

  // Error 403 checking
  if (quiz.quizOwnedby !== userId) {
    return { error: 'Unauthorised' };
  }

  // Error 400 checking
  if (!quiz.questions.some(q => q.questionId === questionId)) {
    return {
      error: 'Question Id does not refer to a valid question within this quiz'
    };
  }

  if (questionBody.question.length < 5 || questionBody.question.length > 50) {
    return {
      error: 'Question string is less than 5 characters in length or greater than 50 characters in length'
    };
  }

  if (questionBody.answers.length < 2 || questionBody.answers.length > 6) {
    return {
      error: 'The question has more than 6 answers or less than 2 answers'
    };
  }

  if (questionBody.duration <= 0) {
    return {
      error: 'The question duration is not a positive number'
    };
  }

  const totalDurationWithoutCurrentQuestion = quiz.duration - (quiz.questions.find(q => q.questionId === questionId)?.duration || 0);
  const totalDurationWithUpdatedQuestion = totalDurationWithoutCurrentQuestion + questionBody.duration;
  if (totalDurationWithUpdatedQuestion > 180) {
    return {
      error: 'If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes'
    };
  }

  if (questionBody.points < 1 || questionBody.points > 10) {
    return {
      error: 'The points awarded for the question are less than 1 or greater than 10'
    };
  }

  for (const answer of questionBody.answers) {
    if (answer.answer.length < 1 || answer.answer.length > 30) {
      return {
        error: 'The length of an answer is shorter than 1 character long, or longer than 30 characters long'
      };
    }
  }

  const uniqueAnswers = new Set(questionBody.answers.map(ans => ans.answer));
  if (uniqueAnswers.size !== questionBody.answers.length) {
    return {
      error: 'Any answer strings are duplicates of one another (within the same question)'
    };
  }

  if (!questionBody.answers.some(ans => ans.correct)) {
    return {
      error: 'There are no correct answers'
    };
  }

  quiz.duration = totalDuration;
  quiz.numQuestions++;
  quiz.timeLastEdited = generateTime();

  save(data);

  return {
    questionId: newQuestion.questionId
  };
}
