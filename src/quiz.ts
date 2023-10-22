import {
  isToken,
  Session,
  checkauthUserId,
  checkquizId,
  isQuizDescription,
  isQuizName,
  generateTime,
  load,
  save
} from './helper';

import { getData, setData } from './dataStore.js';

const store = getData();
let quizUniqueId = 0;

/**
  * Given an authUserId, quizid, description
  * Update the description of the relevant quiz.
  * Return notthing.
  *
  *
  * @param {number} authUserId
  * @param {number} quizId
  * @param {string} description
  *
  * @returns {}
*/

function adminQuizDescriptionUpdate (authUserId: number, quizId: number, description: string) {
  const quiz = checkquizId(quizId);

  // Returning errors
  if (checkauthUserId(authUserId) === undefined) {
    return { error: 'AuthUserId is not a valid user' };
  }

  if (quiz === undefined) {
    return { error: 'Quiz ID does not refer to a valid quiz' };
  }

  // Quiz ID does not refer to a quiz that this user owns
  if (quiz.quizOwnedby !== authUserId) {
    return { error: 'Quiz ID does not refer to a quiz that this user owns' };
  }

  if (description.length > 100) {
    return { error: 'Description is more than 100 characters in length' };
  }

  // Working case
  quiz.description = description;
  quiz.timeLastEdited = generateTime();
  return {

  };
}

/**
  * Given basic details about a new quiz, create one for the logged in user.
  *  then returns a quizId.
  *
  * @param {string} token
  * @param {string} name
  * @param {string} description
  * @returns {{ quizId: number }}
*/
function adminQuizCreate(token: string, name: string, description: string) {
  const data = load();

  // Error checking 400
  if (data.quizzes.some((quiz) => quiz.name === name)) {
    return {
      error: 'Quiz name already exists'
    };
  } else if (!isQuizName(name)) {
    return {
      error: 'Invalid quiz name'
    };
  } else if (!isQuizDescription(description)) {
    return {
      error: 'Invalid quiz description'
    };
  } 

    // Error checking 401
  if (!isToken(token)) {
    return {
      error: 'Invalid Token'
    }
  }

  const userId = isToken(token).userId
  const userExists = checkauthUserId(userId);
  if (!userExists) {
    return {
      error: 'Invalid Token'
    };
  }

  const newQuiz = {
    quizId: quizUniqueId++,
    name: name,
    timeCreated: generateTime(),
    timeLastEdited: generateTime(),
    description: description,
    quizOwnedby: userId,
  };

  data.quizzes.push(newQuiz);
  save(data);

  return {
    quizId: newQuiz.quizId,
  };
}

/**
  * Given a particular quiz, permanently remove the quiz.
  *
  * @param {number} authUserId
  * @param {number} quizId
  * @returns {}
*/
function adminQuizRemove(authUserId: number, quizId: number) {
  if (typeof (authUserId) !== 'number') {
    return {
      error: 'User ID should be a number'
    };
  } else if (typeof (quizId) !== 'number') {
    return {
      error: 'Quiz ID should be a number'
    };
  }

  // Checks if the quiz and the user exists in the data.
  const quizExists = store.quizzes.find((quiz) => quiz.quizId === quizId);
  const userExists = store.users.find((person) => person.userId === authUserId);
  if (!quizExists) {
    return {
      error: 'Quiz does not exist'
    };
  } else if (!userExists) {
    return {
      error: 'Person does not exist'
    };
  } else if (quizExists.quizOwnedby !== authUserId) {
    return {
      error: 'Person does not own the quiz'
    };
  }

  const quizFound = store.quizzes.find((quiz) => quiz.quizId === quizId);
  const index = store.quizzes.indexOf(quizFound);
  store.quizzes.splice(index, 1);
  setData(store);
  return {};
}

/**
  * Given an authUserId
  * Return a list of all quizzes that are owned by the currently logged in user.
  *
  *
  * @param {number} authUserId
  * @returns { quizzes: [
  *  {
  *   quizId: number,
  *   name: string,
  *  }
  * ]}
*/
function adminQuizList(authUserId: number) {
  if (checkauthUserId(authUserId) === undefined) {
    return { error: 'AuthUserId is not a valid user' };
  }

  const quizzes = [];
  for (const quiz of store.quizzes) {
    if (authUserId === quiz.quizOwnedby) {
      quizzes.push({
        name: quiz.name,
        quizId: quiz.quizId,
      });
    }
  }

  return {
    quizzes
  };
}

/**
 adminQuizInfo
 Obtaining all relevant information about quiz\
 @param {number} authUserId - unique user identifier
 @param {number} quizId - unique quiz identifier

 @returns {array
  {quizId: number,
    name: string,
    timeCreated: number,
    timeLastEdited: number,
    description: string
  }
} - returns information if valid authUserId and quizId entered
@returns {error: string} - invalid parameters entered
**/
function adminQuizInfo(authUserId: number, quizId: number) {
  if (typeof (authUserId) !== 'number') {
    return {
      error: 'User ID should be a number'
    };
  } else if (typeof (quizId) !== 'number') {
    return {
      error: 'Quiz ID should be a number'
    };
  }

  // Checks if the quiz and the user exists in the data.
  const quizExists = store.quizzes.find((quiz) => quiz.quizId === quizId);
  const userExists = store.users.find((person) => person.userId === authUserId);
  if (!quizExists) {
    return {
      error: 'Quiz does not exist'
    };
  } else if (!userExists) {
    return {
      error: 'Person does not exist'
    };
  } else if (quizExists.quizOwnedby !== authUserId) {
    return {
      error: 'Person does not own the quiz'
    };
  }

  return {
    quizId: quizId,
    name: quizExists.name,
    timeCreated: quizExists.timeCreated,
    timeLastEdited: quizExists.timeLastEdited,
    description: quizExists.description,
  };
}

/**
 adminQuizNameUpdate
 Obtaining all relevant information about quiz\
 @param {number} authUserId - unique user identifier
 @param {number} quizId - unique quiz identifier
 @param {string} name - new name of quiz

 @returns [] - updates name of quiz in datastore
 @returns {error: string} - invalid parameters entered
**/

function adminQuizNameUpdate(authUserId: number, quizId: number, name: string) {
  const quiz = checkquizId(quizId);
  const user = checkauthUserId(authUserId);

  // Returning errors
  // Invalid User or Quiz ID
  if (typeof (authUserId) !== 'number') {
    return { error: 'User ID should be a number' };
  }
  if (typeof (quizId) !== 'number') {
    return { error: 'Quiz ID should be a number' };
  }
  if (user === undefined) {
    return { error: 'AuthUserId is not a valid user' };
  }
  if (quiz === undefined) {
    return { error: 'QuizId is not valid' };
  }
  // Does the quiz Id belong to the correct user
  if (quiz.quizOwnedby !== authUserId) {
    return { error: 'User does not own the quiz' };
  }
  // Quiz Name already exists
  if (store.quizzes.some((quiz) => quiz.name === name)) {
    return { error: 'Quiz name already exists' };
  }
  // Quiz Name is not valid
  if (!isQuizName(name)) {
    return { error: 'Invalid quiz name' };
  }

  // Working case
  quiz.name = name;
  quiz.timeLastEdited = generateTime();
  return {};
}

export {
  adminQuizDescriptionUpdate,
  adminQuizCreate,
  adminQuizNameUpdate,
  adminQuizList,
  adminQuizInfo,
  adminQuizRemove
};
