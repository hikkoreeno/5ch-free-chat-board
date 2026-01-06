'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Response {
  id: number;
  resNumber: number;
  name: string;
  tripcode: string | null;
  email: string | null;
  body: string;
  userIdHash: string;
  createdAt: string;
}

interface Thread {
  id: number;
  title: string;
  resCount: number;
  isFull: boolean;
  createdAt: string;
  updatedAt: string;
  board: {
    name: string;
    defaultName: string;
  };
  responses: Response[];
}

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.id as string;
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [hoveredAnchor, setHoveredAnchor] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/threads/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content) {
      alert('本文は必須です');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: '', email: '', content: '' });
        setReplyTo(null);
        fetchThread();
        // 新しい投稿にスクロール
        setTimeout(() => {
          const lastRes = document.querySelector('.post-container:last-child');
          lastRes?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const error = await res.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating response:', error);
      alert('エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = weekdays[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day}(${weekday}) ${hours}:${minutes}:${seconds}`;
  };

  const parseBody = (body: string) => {
    // アンカーをリンク化
    let parsed = body.replace(/&gt;&gt;(\d+)(-\d+)?/g, (match, num) => {
      return `<a href="#res-${num}" class="anchor" data-anchor="${num}">&gt;&gt;${num}</a>`;
    });
    // 改行をBRタグに変換
    parsed = parsed.replace(/\n/g, '<br>');
    return parsed;
  };

  const handleAnchorHover = (e: React.MouseEvent, resNumber: number) => {
    setHoveredAnchor(resNumber);
    setPopupPosition({ x: e.clientX, y: e.clientY });
  };

  const handleAnchorLeave = () => {
    setHoveredAnchor(null);
  };

  const getHoveredResponse = () => {
    if (!hoveredAnchor || !thread) return null;
    return thread.responses.find(r => r.resNumber === hoveredAnchor);
  };

  const handleReply = (resNumber: number) => {
    setReplyTo(resNumber);
    setFormData(prev => ({
      ...prev,
      content: `>>${resNumber}\n${prev.content}`
    }));
    // フォームにスクロール
    document.querySelector('.post-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9F6F2] to-[#F2F0EB]">
        <div className="text-center">
          <div className="inline-block animate-spin text-5xl mb-4">☕</div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F9F6F2] to-[#F2F0EB]">
        <p className="text-5xl mb-4">🍃</p>
        <p className="text-xl mb-4 text-gray-600">トピックが見つかりません</p>
        <Link href="/" className="cafe-btn">
          ← トップに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="cafe-header">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm opacity-80 mb-1">
            <Link href="/" className="hover:underline">☕ Free Chat Board</Link>
            <span>›</span>
            <span>トピック</span>
          </div>
          <h1 className="text-xl font-bold">{thread.title}</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        {/* スレッド情報 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="stats-badge">
            💬 {thread.resCount} / 1000
          </span>
          {thread.isFull && (
            <span className="tag tag-warning">このトピックは満員です</span>
          )}
          <span className="text-sm text-gray-400">
            作成: {formatDate(thread.createdAt)}
          </span>
        </div>

        {/* レス一覧 */}
        <div className="space-y-3 mb-6">
          {thread.responses.map((response, index) => (
            <div
              key={response.id}
              id={`res-${response.resNumber}`}
              className="post-container animate-fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="post-header">
                <span className="post-number">{response.resNumber}</span>
                <span className="post-name">
                  {response.email?.toLowerCase() === 'sage' ? (
                    response.name
                  ) : response.email ? (
                    <a href={`mailto:${response.email}`} className="text-[#00704A] hover:underline">
                      {response.name}
                    </a>
                  ) : (
                    response.name
                  )}
                </span>
                {response.tripcode && (
                  <span className="post-trip">◆{response.tripcode}</span>
                )}
                <span className="post-date">{formatDate(response.createdAt)}</span>
                <span className="post-id">ID:{response.userIdHash}</span>
              </div>
              <div
                className="post-body"
                dangerouslySetInnerHTML={{ __html: parseBody(response.body) }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.classList.contains('anchor')) {
                    const anchorNum = parseInt(target.dataset.anchor || '0');
                    handleAnchorHover(e, anchorNum);
                  }
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.classList.contains('anchor')) {
                    handleAnchorLeave();
                  }
                }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => handleReply(response.resNumber)}
                  className="like-btn"
                >
                  💬 返信
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* アンカーポップアップ */}
        {hoveredAnchor && getHoveredResponse() && (
          <div
            className="anchor-popup fixed z-50 animate-fade-in"
            style={{
              left: Math.min(popupPosition.x + 10, window.innerWidth - 420),
              top: popupPosition.y + 10,
            }}
          >
            <div className="post-header text-xs mb-2">
              <span className="post-number">{getHoveredResponse()!.resNumber}</span>
              <span className="post-name">{getHoveredResponse()!.name}</span>
              {getHoveredResponse()!.tripcode && (
                <span className="post-trip">◆{getHoveredResponse()!.tripcode}</span>
              )}
            </div>
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: parseBody(getHoveredResponse()!.body) }}
            />
          </div>
        )}

        {/* 書き込みフォーム */}
        {!thread.isFull ? (
          <div className="post-form">
            <h2 className="coffee-icon text-xl font-bold text-[#1E3932]">
              {replyTo ? `>>${replyTo} に返信` : 'コメントを投稿'}
            </h2>
            {replyTo && (
              <button
                onClick={() => {
                  setReplyTo(null);
                  setFormData(prev => ({
                    ...prev,
                    content: prev.content.replace(new RegExp(`^>>${replyTo}\\n`), '')
                  }));
                }}
                className="text-sm text-gray-400 hover:text-gray-600 mb-4"
              >
                ✕ 返信をキャンセル
              </button>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    ニックネーム
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="cafe-input"
                    placeholder={thread.board.defaultName}
                  />
                  <p className="text-xs text-gray-400 mt-1">💡 トリップ: 名前#パスワード</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    E-mail
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="cafe-input"
                    placeholder="sage で順位固定"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  メッセージ
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="cafe-textarea"
                  placeholder="メッセージを入力..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="cafe-btn"
                >
                  {submitting ? '送信中...' : '☕ 投稿する'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="cafe-card p-6 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-lg font-bold text-[#1E3932] mb-2">
              このトピックは1000コメントに達しました！
            </p>
            <p className="text-gray-500 text-sm">
              新しいトピックを作成してください
            </p>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <Link href="/" className="cafe-btn-secondary">
            ← トピック一覧
          </Link>
          <div className="flex gap-2">
            <a href="#res-1" className="cafe-btn-secondary">
              ↑ 先頭へ
            </a>
            <button
              onClick={() => fetchThread()}
              className="cafe-btn-secondary"
            >
              🔄 更新
            </button>
          </div>
        </div>

        {/* 進捗バー */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>投稿数</span>
            <span>{thread.resCount} / 1000</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00704A] to-[#00A862] transition-all duration-500"
              style={{ width: `${(thread.resCount / 1000) * 100}%` }}
            />
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="cafe-footer">
        <div className="max-w-5xl mx-auto">
          <p className="flex items-center justify-center gap-2">
            <span>☕</span>
            <span>Free Chat Board</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
