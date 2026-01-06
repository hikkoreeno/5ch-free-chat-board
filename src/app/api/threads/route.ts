import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUserId, parseNameAndTrip, escapeHtml } from '@/lib/bbsUtils';

// スレッド一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get('boardId');
  const sort = searchParams.get('sort') || 'updatedAt';

  try {
    const threads = await prisma.thread.findMany({
      where: boardId ? { boardId: parseInt(boardId) } : undefined,
      include: {
        board: true,
        responses: {
          take: 1,
          orderBy: { resNumber: 'asc' },
        },
      },
      orderBy: sort === 'createdAt' 
        ? { createdAt: 'desc' } 
        : { updatedAt: 'desc' },
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}

// スレッド作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, name, email, content, boardId } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'タイトルと本文は必須です' }, { status: 400 });
    }

    // IPアドレス取得
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';

    // 板IDの確認（デフォルトは1）
    const targetBoardId = boardId || 1;

    // 板が存在するか確認、なければデフォルト板を作成
    let board = await prisma.board.findUnique({
      where: { id: targetBoardId },
    });

    if (!board) {
      // デフォルトカテゴリとボードを作成
      const category = await prisma.category.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: '雑談' },
      });

      board = await prisma.board.create({
        data: {
          id: 1,
          categoryId: category.id,
          name: '雑談板',
          defaultName: '名無しさん',
        },
      });
    }

    // 名前とトリップコードを解析
    const { name: parsedName, tripcode } = parseNameAndTrip(name || '');
    const displayName = parsedName || board.defaultName;

    // ユーザーIDを生成
    const userIdHash = generateUserId(ipAddress, targetBoardId);

    // トランザクションでスレッドとレスを作成
    const thread = await prisma.$transaction(async (tx) => {
      const newThread = await tx.thread.create({
        data: {
          boardId: targetBoardId,
          title: escapeHtml(title),
          resCount: 1,
        },
      });

      await tx.response.create({
        data: {
          threadId: newThread.id,
          resNumber: 1,
          name: displayName,
          tripcode,
          email: email || null,
          body: escapeHtml(content),
          ipAddress,
          userIdHash,
        },
      });

      return newThread;
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}
