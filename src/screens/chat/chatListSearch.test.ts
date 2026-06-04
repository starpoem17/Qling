import test from 'node:test';
import assert from 'node:assert/strict';
import { filterChatsByOpponentName } from './chatListSearch';

const chats = [
  { chatId: 'chat-1', opponentName: '카페인중독' },
  { chatId: 'chat-2', opponentName: '햇살가득' },
  { chatId: 'chat-3', opponentName: 'LatteFriend' },
];

test('empty chat nickname search returns every chat', () => {
  assert.deepEqual(
    filterChatsByOpponentName(chats, '').map(chat => chat.chatId),
    ['chat-1', 'chat-2', 'chat-3']
  );
  assert.deepEqual(
    filterChatsByOpponentName(chats, '   ').map(chat => chat.chatId),
    ['chat-1', 'chat-2', 'chat-3']
  );
});

test('chat nickname search filters by partial opponent nickname', () => {
  assert.deepEqual(
    filterChatsByOpponentName(chats, '가득').map(chat => chat.chatId),
    ['chat-2']
  );
  assert.deepEqual(
    filterChatsByOpponentName(chats, 'latte').map(chat => chat.chatId),
    ['chat-3']
  );
});

test('chat nickname search returns no cards when no nickname matches', () => {
  assert.deepEqual(filterChatsByOpponentName(chats, '없는닉네임'), []);
});
