export interface SearchableChatListItem {
  opponentName: string;
}

export function filterChatsByOpponentName<T extends SearchableChatListItem>(
  chats: readonly T[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...chats];

  return chats.filter(chat =>
    chat.opponentName.toLocaleLowerCase().includes(normalizedQuery)
  );
}
