import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUserId, parseNameAndTrip, escapeHtml } from '@/lib/bbsUtils';

// スレッド詳細・レス一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const threadId = parseInt(params.id);

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        board: true,
        responses: {
          orderBy: { resNumber: 'asc' },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}

// レス投稿
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const threadId = parseInt(params.id);

  try {
    const body = await request.json();
    const { name, email, content } = body;

    if (!content) {
      return NextResponse.json({ error: '本文は必須です' }, { status: 400 });
    }

    // スレッドの存在確認
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { board: true },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // 1000レス制限チェック
    if (thread.isFull || thread.resCount >= 1000) {
      return NextResponse.json({ error: 'このスレッドは1000レスに達したため書き込みできません' }, { status: 400 });
    }

    // IPアドレス取得
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';

    // 名前とトリップコードを解析
    const { name: parsedName, tripcode } = parseNameAndTrip(name || '');
    const displayName = parsedName || thread.board.defaultName;

    // ユーザーIDを生成
    const userIdHash = generateUserId(ipAddress, thread.boardId);

    // sage判定
    const isSage = email?.toLowerCase() === 'sage';

    // トランザクションでレス作成とスレッド更新
    const response = await prisma.$transaction(async (tx) => {
      const newResNumber = thread.resCount + 1;
      const willBeFull = newResNumber >= 1000;

      // レス作成
      const newResponse = await tx.response.create({
        data: {
          threadId,
          resNumber: newResNumber,
          name: displayName,
          tripcode,
          email: email || null,
          body: escapeHtml(content),
          ipAddress,
          userIdHash,
        },
      });

      // スレッド更新（sageでない場合のみupdatedAtを更新）
      await tx.thread.update({
        where: { id: threadId },
        data: {
          resCount: newResNumber,
          isFull: willBeFull,
          // sageの場合はupdatedAtを更新しない
          ...(isSage ? {} : { updatedAt: new Date() }),
        },
      });

      return newResponse;
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
  }
}
