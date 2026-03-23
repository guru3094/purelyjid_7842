import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');
  const apiKey = searchParams.get('apiKey');

  if (!placeId || !apiKey) {
    return NextResponse.json({ error: 'Missing placeId or apiKey parameter' }, { status: 400 });
  }

  const fields = 'name,formatted_address,rating,user_ratings_total,reviews';
  const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(googleUrl);
    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      return NextResponse.json(
        { error: data.error_message || 'API key is invalid or does not have Places API access.' },
        { status: 403 }
      );
    }

    if (data.status === 'NOT_FOUND' || data.status === 'INVALID_REQUEST') {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}. Check your Place ID.` },
        { status: 400 }
      );
    }

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Places API returned status: ${data.status}` },
        { status: 400 }
      );
    }

    const result = data.result;
    return NextResponse.json({
      name: result.name,
      formatted_address: result.formatted_address,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      reviews: result.reviews || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch from Google Places API' },
      { status: 500 }
    );
  }
}
