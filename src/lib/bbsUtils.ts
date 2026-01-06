import crypto from 'crypto';

/**
 * IPアドレス + 日付 + 板ID からユーザーIDを生成
 * 日付が変わるとIDもリセットされる
 */
export function generateUserId(ipAddress: string, boardId: number): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = `${ipAddress}:${today}:${boardId}`;
  const hash = crypto.createHash('sha256').update(seed).digest('base64');
  // 8文字のIDを生成
  return hash.substring(0, 8).replace(/[+/=]/g, (c) => {
    if (c === '+') return 'A';
    if (c === '/') return 'B';
    return 'C';
  });
}

/**
 * トリップコードを生成
 * 名前#パスワード の形式から 名前◆ハッシュ値 を生成
 */
export function parseNameAndTrip(input: string): { name: string; tripcode: string | null } {
  const tripMatch = input.match(/^(.*)#(.+)$/);
  
  if (tripMatch) {
    const name = tripMatch[1] || '名無しさん';
    const password = tripMatch[2];
    
    // パスワードからトリップコードを生成
    const tripcode = generateTripcode(password);
    
    return { name, tripcode };
  }
  
  return { name: input || '名無しさん', tripcode: null };
}

/**
 * パスワードからトリップコードを生成
 */
function generateTripcode(password: string): string {
  // 簡易的なトリップ生成（実際の5chはDESベースだが、ここではSHA256を使用）
  const hash = crypto.createHash('sha256').update(password).digest('base64');
  return hash.substring(0, 10).replace(/[+/=]/g, (c) => {
    if (c === '+') return '.';
    if (c === '/') return '/';
    return '.';
  });
}

/**
 * 本文内のアンカー（>>1 や >>2-5）をリンクに変換
 */
export function parseAnchors(body: string, threadId: number): string {
  // >>数字 または >>数字-数字 のパターンをリンク化
  return body.replace(/&gt;&gt;(\d+)(-\d+)?/g, (match, num, range) => {
    const anchor = range ? `${num}${range}` : num;
    return `<a href="#res-${num}" class="anchor" data-anchor="${anchor}">&gt;&gt;${anchor}</a>`;
  });
}

/**
 * XSS対策のためのエスケープ処理
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * 本文の改行をBRタグに変換
 */
export function formatBody(body: string, threadId: number): string {
  let formatted = escapeHtml(body);
  formatted = parseAnchors(formatted, threadId);
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

/**
 * 日付をフォーマット
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[d.getDay()];
  
  return `${year}/${month}/${day}(${weekday}) ${hours}:${minutes}:${seconds}`;
}

/**
 * スレッドの勢いを計算
 * 勢い = レス数 / 経過日数
 */
export function calculateMomentum(resCount: number, createdAt: Date): number {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays < 1) {
    return resCount; // 1日未満は単純にレス数
  }
  
  return Math.round((resCount / diffDays) * 10) / 10;
}
