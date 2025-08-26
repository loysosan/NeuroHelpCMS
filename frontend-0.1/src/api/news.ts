export interface NewsDto {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  views: number;
  createdAt: string;
  authorName?: string;
  highlight?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchNewsList(page = 1, limit = 12) {
  const res = await fetch(`${API_BASE}/api/news?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Не вдалося завантажити список новин');
  const data = await res.json();
  // Очікувано: { items:[], total:number } або масив
  if (Array.isArray(data)) {
    return { items: data as NewsDto[], total: data.length };
  }
  return {
    items: (data.items || []) as NewsDto[],
    total: data.total ?? (data.items?.length || 0)
  };
}

export async function fetchNewsItem(id: string | number) {
  const res = await fetch(`${API_BASE}/api/news/${id}`);
  if (!res.ok) throw new Error('Не вдалося завантажити новину');
  return (await res.json()) as NewsDto;
}