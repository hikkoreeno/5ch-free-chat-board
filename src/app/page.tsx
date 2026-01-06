'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Thread {
  id: number;
  title: string;
  resCount: number;
  isFull: boolean;
  createdAt: string;
  updatedAt: string;
  board: {
    name: string;
  };
  responses: {
    body: string;
  }[];
}

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    email: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      const data = await res.json();
      setThreads(data);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('タイトルと本文は必須です');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ title: '', name: '', email: '', content: '' });
        setShowForm(false);
        fetchThreads();
      } else {
        const error = await res.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateMomentum = (resCount: number, createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffDays < 1) return resCount;
    return Math.round((resCount / diffDays) * 10) / 10;
  };

  const getMomentumClass = (momentum: number) => {
    if (momentum >= 50) return 'momentum-high';
    if (momentum >= 10) return 'momentum-mid';
    return 'momentum-low';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isNewThread = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="cafe-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">☕</span>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">Free Chat Board</h1>
              <p className="text-sm opacity-80">自由に語り合えるカフェ空間</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm opacity-80">
              {threads.length} トピック
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        {/* 検索バーと新規作成ボタン */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="search-bar flex-1">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="トピックを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'cafe-btn-secondary' : 'cafe-btn'}
          >
            {showForm ? '✕ 閉じる' : '✏️ 新しいトピック'}
          </button>
        </div>

        {/* 新規トピック作成フォーム */}
        {showForm && (
          <div className="post-form animate-fade-in mb-6">
            <h2 className="coffee-icon text-xl">新しいトピックを作成</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  トピックタイトル <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="cafe-input"
                  placeholder="話したいテーマを入力..."
                />
              </div>
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
                    placeholder="名無しさん"
                  />
                  <p className="text-xs text-gray-400 mt-1">💡 トリップ: 名前#パスワード</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    E-mail（オプション）
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
                  本文 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="cafe-textarea"
                  placeholder="最初のメッセージを入力..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="cafe-btn"
                >
                  {submitting ? '投稿中...' : '☕ トピックを作成'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* スレッド一覧 */}
        <div className="cafe-card overflow-hidden">
          <div className="bg-gradient-to-r from-[#1E3932] to-[#00704A] text-white px-6 py-4">
            <h2 className="font-bold flex items-center gap-2">
              <span>📋</span> トピック一覧
              {searchQuery && (
                <span className="text-sm font-normal opacity-80">
                  「{searchQuery}」の検索結果
                </span>
              )}
            </h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-4xl mb-4">☕</div>
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">🍃</p>
              <p className="text-gray-500">
                {searchQuery ? '検索結果がありません' : 'まだトピックがありません'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                最初のトピックを作成してみましょう！
              </p>
            </div>
          ) : (
            <div>
              {filteredThreads.map((thread, index) => {
                const momentum = calculateMomentum(thread.resCount, thread.createdAt);
                return (
                  <div key={thread.id} className="thread-list-item animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isNewThread(thread.createdAt) && (
                            <span className="new-indicator" title="新着"></span>
                          )}
                          <Link href={`/thread/${thread.id}`} className="thread-title-link truncate block">
                            {thread.title}
                          </Link>
                          {thread.isFull && (
                            <span className="tag tag-warning">満員</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="stats-badge">
                            💬 {thread.resCount}
                          </span>
                          <span className={`stats-badge ${getMomentumClass(momentum)}`}>
                            🔥 {momentum}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatDate(thread.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <Link 
                        href={`/thread/${thread.id}`}
                        className="cafe-btn-secondary text-sm py-2 px-4 whitespace-nowrap"
                      >
                        参加する →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="cafe-card p-6 text-center">
            <p className="text-3xl font-bold text-[#00704A]">{threads.length}</p>
            <p className="text-sm text-gray-500 mt-1">トピック数</p>
          </div>
          <div className="cafe-card p-6 text-center">
            <p className="text-3xl font-bold text-[#CBA258]">
              {threads.reduce((sum, t) => sum + t.resCount, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">総投稿数</p>
          </div>
          <div className="cafe-card p-6 text-center">
            <p className="text-3xl font-bold text-[#E75B52]">
              {threads.filter(t => isNewThread(t.createdAt)).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">24時間以内の新着</p>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="cafe-footer mt-auto">
        <div className="max-w-5xl mx-auto">
          <p className="flex items-center justify-center gap-2">
            <span>☕</span>
            <span>Free Chat Board</span>
            <span className="opacity-50">|</span>
            <span className="text-sm opacity-70">みんなの憩いの場</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
