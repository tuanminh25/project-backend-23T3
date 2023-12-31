import {
  load,
  save,
  isUserName,
  isPassword,
  passwordHash,
  getSession
} from './helper';
import validator from 'validator';
import HttpError from 'http-errors';
import { ReturnUserDetails } from './interface';
/**
 * For the given admin user that is logged in, return all of the relevant details
 *
 * @param {string} token
 * @returns { user:
 *   {
 *   userId: number,
 *   name : string,
 *   email : string,
 *   numSuccessfulLogins: number,
 *   numFailedPasswordsSinceLastLogin: number
 *   }
 * }
 * @returns {error: string}
*/
export function adminUserDetails(token: string): { user: ReturnUserDetails} {
  const session = getSession(token);

  const data = load();
  const user = data.users.find((user) => user.userId === session.userId);

  const userName = user.nameFirst + ' ' + user.nameLast;
  return {
    user: {
      userId: user.userId,
      name: userName,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Given details relating to a password change,
 * update the password of a logged in user
 *
 * @param {string} token
 * @returns {}
 * @returns {error: string}
 */
export function updatePassword(token: string, oldPassword: string, newPassword: string): {error?: string} {
  const session = getSession(token);

  const data = load();
  const user = data.users.find((user) => user.userId === session.userId);

  if (passwordHash(oldPassword) !== user.password) {
    throw HttpError(400, 'Incorrect old password');
  }

  if (newPassword === oldPassword) {
    throw HttpError(400, 'Old Password and New Password match exactly');
  }

  if (user.usedPasswords.find((password) => password === passwordHash(newPassword))) {
    throw HttpError(400, 'New Password has already been used before by this user');
  }

  if (!isPassword(newPassword)) {
    throw HttpError(400, 'Invalid new password');
  }

  user.usedPasswords.push(user.password);
  user.password = passwordHash(newPassword);
  save(data);
  return {};
}

/**
  * Given a set of properties, update those properties of this logged in admin user.
  *
  * @param {string} token
  * @param {string} email
  * @param {string} nameFirst
  * @param {string} nameLast
  * @returns {}
  * @returns { error: string }
*/
export function adminUserUpdate(token: string, email: string, nameFirst: string, nameLast: string): {error?: string} {
  const session = getSession(token);

  if (!validator.isEmail(email)) {
    throw HttpError(400, 'Invalid email');
  }

  if (!isUserName(nameFirst)) {
    throw HttpError(400, 'Invalid first name');
  }

  if (!isUserName(nameLast)) {
    throw HttpError(400, 'Invalid last name');
  }

  const data = load();
  const usedEmail = data.users.find((user) => user.email === email && user.userId !== session.userId);
  if (usedEmail) {
    throw HttpError(400, 'Email is used by another user');
  }

  const user = data.users.find((user) => user.userId === session.userId);
  user.email = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;

  save(data);

  return {};
}
