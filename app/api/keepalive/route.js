import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Validate the authorization token if one is configured
    if (cronSecret) {
      const isParamAuth = secretParam === cronSecret;
      const isHeaderAuth = authHeader === `Bearer ${cronSecret}`;
      if (!isParamAuth && !isHeaderAuth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Perform an update on the keepalive table to ping the database
    const { data, error } = await supabase
      .from('keepalive')
      .update({ pinged_at: new Date().toISOString() })
      .eq('id', 1)
      .select();

    if (error) {
      console.error('Supabase keepalive query failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database keep-alive ping successful.',
      updated: data,
    });
  } catch (err) {
    console.error('Unhandled keepalive route exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
