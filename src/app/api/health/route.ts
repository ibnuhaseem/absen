import { NextResponse } from 'next/server'
import { checkSupabaseHealth } from '@/lib/supabase-service'
import { getSyncStatus } from '@/lib/sync-service'

// GET /api/health - Check system health
export async function GET() {
  try {
    const isOnline = await checkSupabaseHealth()
    const syncStatus = await getSyncStatus()

    return NextResponse.json({
      success: true,
      status: isOnline ? 'healthy' : 'degraded',
      supabase: isOnline ? 'connected' : 'disconnected',
      sync: syncStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: 'Failed to check system health',
      },
      { status: 500 }
    )
  }
}