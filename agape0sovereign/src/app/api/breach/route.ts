import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username } = body;

    if (!email && !username) {
      return NextResponse.json(
        { error: 'Either email or username is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.BREACH_API_URL || 'https://xposedornot.com/api';

    const response = await axios.post(`${apiUrl}/check`, {
      email,
      username,
    });

    const data = response.data;

    return NextResponse.json({
      success: true,
      data: {
        exposed: data.exposed,
        breachCount: data.breachCount,
        breaches: data.breaches,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
      },
    });
  } catch (error) {
    console.error('Breach check error:', error);
    return NextResponse.json(
      { error: 'Failed to check breach', details: error.message },
      { status: 500 }
    );
  }
}
