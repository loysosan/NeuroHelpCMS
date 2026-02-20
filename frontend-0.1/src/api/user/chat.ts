import { Conversation, Message } from '../../types/chat';

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('userToken') ?? ''}`,
});

export async function startConversation(psychologistId: number): Promise<Conversation> {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ psychologistId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Не вдалося розпочати розмову');
  }
  return res.json();
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations', { headers: authHeader() });
  if (!res.ok) throw new Error('Не вдалося завантажити розмови');
  return res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetch('/api/conversations/unread', { headers: authHeader() });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export async function getMessages(
  conversationId: number,
  limit = 50,
  offset = 0,
): Promise<Message[]> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
    { headers: authHeader() },
  );
  if (!res.ok) throw new Error('Не вдалося завантажити повідомлення');
  return res.json();
}
