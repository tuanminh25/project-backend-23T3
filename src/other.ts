import { load, save } from './helper';
import { clearAllTimers } from './game';
/**
  * Reset the state of the application back to the start.
  *
  * @param {} - no parameter
  * @returns {} - empty object
*/
export function clear(): Record<string, never> {
  const data = load();
  clearAllTimers();
  data.users.length = 0;
  data.quizzes.length = 0;
  data.sessions.length = 0;
  data.trash.length = 0;
  data.gameSessions.length = 0;
  data.players.length = 0;

  // id tracker
  data.ids.userId = 0;
  data.ids.quizId = 0;
  data.ids.questionId = 0;
  data.ids.answerId = 0;
  data.ids.gameSessionId = 0;
  data.ids.playerId = 0;
  save(data);

  return {};
}
