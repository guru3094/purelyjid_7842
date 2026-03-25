import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const parsed = JSON.parse(session.value);
    if (!parsed?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    return NextResponse.json({ email: parsed.email });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
