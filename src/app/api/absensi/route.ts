import { NextResponse } from 'next/server'
import { getLogAbsensi, getAttendanceStats, batchInsertAbsensi } from '@/lib/supabase-service'

// GET /api/absensi
// Query: startDate, endDate, kelas, waktu_sholat, nim, limit, stats=true
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const kelas = searchParams.get('kelas') || undefined
    const waktu_sholat = searchParams.get('waktu_sholat') || undefined
    const nim = searchParams.get('nim') || undefined
    const limit = parseInt(searchParams.get('limit') || '500')
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const statistics = await getAttendanceStats({ startDate, endDate, kelas })
      return NextResponse.json({ success: true, data: statistics })
    }

    const [logs, statistics] = await Promise.all([
      getLogAbsensi({ startDate, endDate, kelas, waktu_sholat, nim, limit }),
      getAttendanceStats({ startDate, endDate, kelas }),
    ])

    return NextResponse.json({ success: true, data: logs, stats: statistics })
  } catch (error) {
    console.error('GET /api/absensi error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengambil data absensi' }, { status: 500 })
  }
}

// POST /api/absensi — batch insert
export async function POST(request: Request) {
  try {
    const { logs } = await request.json()

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ success: false, error: 'logs array wajib diisi' }, { status: 400 })
    }

    for (const log of logs) {
      if (!log.tanggal || !log.waktu_sholat || !log.nim || !log.status) {
        return NextResponse.json(
          { success: false, error: 'Field tanggal, waktu_sholat, nim, status wajib ada' },
          { status: 400 }
        )
      }
    }

    const inserted = await batchInsertAbsensi(logs)
    return NextResponse.json({ success: true, data: inserted, count: inserted.length })
  } catch (error) {
    console.error('POST /api/absensi error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menyimpan data absensi' }, { status: 500 })
  }
}
