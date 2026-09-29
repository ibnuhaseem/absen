import { NextResponse } from 'next/server'
import { coldStartSync, deltaSync, syncPendingLogs, getSyncStatus, manualSync, initializeSync } from '@/lib/sync-service'

// POST /api/sync - Trigger sync operations
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // Initialize if needed
    await initializeSync()

    switch (action) {
      case 'cold':
        // Full sync of students
        const coldResult = await coldStartSync()
        return NextResponse.json({ 
          success: true, 
          message: 'Cold sync completed',
          result: coldResult 
        })

      case 'delta':
        // Incremental sync
        const deltaResult = await deltaSync()
        return NextResponse.json({ 
          success: true, 
          message: 'Delta sync completed',
          result: deltaResult 
        })

      case 'pending':
        // Sync pending attendance logs
        const syncResult = await syncPendingLogs()
        return NextResponse.json({ 
          success: true, 
          message: 'Pending logs synced',
          result: syncResult 
        })

      case 'full':
        // Full sync (cold + pending)
        await coldStartSync()
        const fullSyncResult = await syncPendingLogs()
        return NextResponse.json({ 
          success: true, 
          message: 'Full sync completed',
          result: fullSyncResult 
        })

      case 'manual':
        // Manual full sync
        await manualSync()
        return NextResponse.json({ 
          success: true, 
          message: 'Manual sync completed' 
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    )
  }
}

// GET /api/sync - Get sync status
export async function GET() {
  try {
    const status = await getSyncStatus()
    return NextResponse.json({ 
      success: true, 
      ...status 
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}