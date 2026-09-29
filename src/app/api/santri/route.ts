import { NextResponse } from 'next/server'
import {
  getSantri,
  getAllSantri,
  getSantriByNim,
  getSantriByKelas,
  createSantri,
  updateSantri,
  deleteSantri,
  upsertSantri,
} from '@/lib/supabase-service'

// GET /api/santri
// Query params: nim=?, kelas=?, all=true
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const nim = searchParams.get('nim')
    const kelas = searchParams.get('kelas')
    const all = searchParams.get('all') === 'true'

    if (nim) {
      const student = await getSantriByNim(nim)
      if (!student) {
        return NextResponse.json({ success: false, error: 'Santri tidak ditemukan' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: student })
    }

    if (kelas && kelas !== 'semua') {
      const students = await getSantriByKelas(kelas)
      return NextResponse.json({ success: true, data: students })
    }

    const students = all ? await getAllSantri() : await getSantri()
    return NextResponse.json({ success: true, data: students })
  } catch (error) {
    console.error('GET /api/santri error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengambil data santri' }, { status: 500 })
  }
}

// POST /api/santri — create one
export async function POST(request: Request) {
  try {
    const { nim, nama, kelas, foto_url } = await request.json()

    if (!nim?.trim() || !nama?.trim() || !kelas) {
      return NextResponse.json({ success: false, error: 'nim, nama, kelas wajib diisi' }, { status: 400 })
    }
    if (!['7', '8', '9'].includes(kelas)) {
      return NextResponse.json({ success: false, error: 'kelas harus 7, 8, atau 9' }, { status: 400 })
    }

    const student = await createSantri({ nim, nama, kelas, foto_url: foto_url || null, is_active: true })
    return NextResponse.json({ success: true, data: student }, { status: 201 })
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ success: false, error: 'NIM sudah terdaftar' }, { status: 409 })
    }
    console.error('POST /api/santri error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat santri' }, { status: 500 })
  }
}

// PUT /api/santri — update one
export async function PUT(request: Request) {
  try {
    const { nim, ...updates } = await request.json()
    if (!nim) {
      return NextResponse.json({ success: false, error: 'nim wajib diisi' }, { status: 400 })
    }
    const student = await updateSantri(nim, updates)
    return NextResponse.json({ success: true, data: student })
  } catch (error) {
    console.error('PUT /api/santri error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memperbarui santri' }, { status: 500 })
  }
}

// DELETE /api/santri?nim=xxx — soft delete
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const nim = searchParams.get('nim')
    if (!nim) {
      return NextResponse.json({ success: false, error: 'nim wajib diisi' }, { status: 400 })
    }
    await deleteSantri(nim)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/santri error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus santri' }, { status: 500 })
  }
}

// PATCH /api/santri — bulk upsert
export async function PATCH(request: Request) {
  try {
    const { students } = await request.json()
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: 'students array wajib diisi' }, { status: 400 })
    }
    const result = await upsertSantri(students)
    return NextResponse.json({ success: true, data: result, count: result.length })
  } catch (error) {
    console.error('PATCH /api/santri error:', error)
    return NextResponse.json({ success: false, error: 'Gagal upsert santri' }, { status: 500 })
  }
}
