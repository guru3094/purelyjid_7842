import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

interface AdminCredential {
  email: string;
  password: string;
}

interface CredentialsFile {
  admins: AdminCredential[];
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Read credentials from local folder
    const credentialsPath = path.join(process.cwd(), 'credentials', 'admin.json');

    if (!fs.existsSync(credentialsPath)) {
      return NextResponse.json({ error: 'Credentials file not found.' }, { status: 500 });
    }

    const raw = fs.readFileSync(credentialsPath, 'utf-8');
    const data: CredentialsFile = JSON.parse(raw);

    const match = data.admins.find(
      (admin) =>
        admin.email.toLowerCase() === email.trim().toLowerCase() &&
        admin.password === password
    );

    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Set a secure HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify({ email: match.email, loggedInAt: Date.now() }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return NextResponse.json({ success: true, email: match.email });
  } catch (err) {
    console.error('Admin auth error:', err);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
