export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前';
  if (diff < 31536000) return Math.floor(diff / 2592000) + ' 个月前';
  return Math.floor(diff / 31536000) + ' 年前';
}

export function formatTimeAgoParts(dateStr: string): { num: string; unit: string } {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return { num: '', unit: '刚刚' };
  if (diff < 3600) return { num: String(Math.floor(diff / 60)), unit: '分钟前' };
  if (diff < 86400) return { num: String(Math.floor(diff / 3600)), unit: '小时前' };
  if (diff < 2592000) return { num: String(Math.floor(diff / 86400)), unit: '天前' };
  if (diff < 31536000) return { num: String(Math.floor(diff / 2592000)), unit: '个月前' };
  return { num: String(Math.floor(diff / 31536000)), unit: '年前' };
}
