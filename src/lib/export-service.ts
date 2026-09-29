import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { getLogAbsensi, getAttendanceStats, getSantri, type LogAbsensi, type Santri } from './supabase-service'

export interface ExportOptions {
  startDate: string
  endDate: string
  kelas: string
  format: 'pdf' | 'excel' | 'csv'
  type: 'attendance' | 'students'
}

// ==================== PDF EXPORT ====================

export async function exportAttendanceToPDF(options: {
  startDate: string
  endDate: string
  kelas: string
}): Promise<Blob> {
  // Fetch data
  const logs = await getLogAbsensi({
    startDate: options.startDate,
    endDate: options.endDate,
    kelas: options.kelas,
  })

  const stats = await getAttendanceStats({
    startDate: options.startDate,
    endDate: options.endDate,
    kelas: options.kelas,
  })

  // Create PDF
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(18)
  doc.text('LAPORAN ABSENSI SHOLAT', pageWidth / 2, 20, { align: 'center' })

  // Date range
  doc.setFontSize(11)
  doc.text(`Periode: ${options.startDate} s/d ${options.endDate}`, pageWidth / 2, 28, { align: 'center' })

  // Class filter info
  if (options.kelas !== 'semua') {
    doc.text(`Kelas: ${options.kelas}`, pageWidth / 2, 34, { align: 'center' })
  }

  // Statistics
  doc.setFontSize(12)
  doc.text('Ringkasan:', 14, 48)
  doc.setFontSize(10)
  doc.text(`Total Kehadiran: ${stats.total}`, 14, 56)
  doc.text(`Hadir: ${stats.hadir}`, 14, 62)
  doc.text(`Telat: ${stats.telat}`, 14, 68)
  doc.text(`Alpa: ${stats.alpa}`, 14, 74)

  // Table
  let yPos = 88
  const headers = ['Tanggal', 'Waktu', 'NIM', 'Nama', 'Kelas', 'Status', 'Jam Scan']
  const colWidths = [25, 20, 25, 45, 15, 20, 25]

  // Table header
  doc.setFontSize(9)
  doc.setFillColor(240, 240, 240)
  doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F')
  
  let xPos = 14
  headers.forEach((header, i) => {
    doc.text(header, xPos + 2, yPos)
    xPos += colWidths[i]
  })

  yPos += 8

  // Table rows
  doc.setFontSize(8)
  logs.forEach((log, index) => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
      
      // Repeat header on new page
      doc.setFillColor(240, 240, 240)
      doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F')
      xPos = 14
      headers.forEach((header, i) => {
        doc.text(header, xPos + 2, yPos)
        xPos += colWidths[i]
      })
      yPos += 8
      doc.setFontSize(8)
    }

    xPos = 14
    const row = [
      log.tanggal,
      log.waktu_sholat,
      log.nim,
      log.nama.substring(0, 20),
      log.kelas,
      log.status,
      log.waktu_scan || '-',
    ]

    row.forEach((cell, i) => {
      doc.text(String(cell), xPos + 2, yPos)
      xPos += colWidths[i]
    })

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(14, yPos - 4, pageWidth - 28, 6, 'F')
    }

    yPos += 6
  })

  // Footer
  doc.setFontSize(8)
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    14,
    285
  )

  return doc.output('blob')
}

// ==================== EXCEL EXPORT ====================

export async function exportAttendanceToExcel(options: {
  startDate: string
  endDate: string
  kelas: string
}): Promise<Blob> {
  // Fetch data
  const logs = await getLogAbsensi({
    startDate: options.startDate,
    endDate: options.endDate,
    kelas: options.kelas,
  })

  const stats = await getAttendanceStats({
    startDate: options.startDate,
    endDate: options.endDate,
    kelas: options.kelas,
  })

  // Prepare workbook
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Data
  const dataRows = logs.map(log => ({
    Tanggal: log.tanggal,
    'Waktu Sholat': log.waktu_sholat,
    NIM: log.nim,
    Nama: log.nama,
    Kelas: log.kelas,
    Status: log.status,
    'Waktu Scan': log.waktu_scan || '-',
  }))

  const dataSheet = XLSX.utils.json_to_sheet(dataRows)
  
  // Set column widths
  dataSheet['!cols'] = [
    { wch: 12 }, // Tanggal
    { wch: 12 }, // Waktu Sholat
    { wch: 15 }, // NIM
    { wch: 30 }, // Nama
    { wch: 8 },  // Kelas
    { wch: 10 }, // Status
    { wch: 12 }, // Waktu Scan
  ]

  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data Absensi')

  // Sheet 2: Summary
  const summaryData = [
    { Kategori: 'Total Kehadiran', Jumlah: stats.total },
    { Kategori: 'Hadir', Jumlah: stats.hadir },
    { Kategori: 'Telat', Jumlah: stats.telat },
    { Kategori: 'Alpa', Jumlah: stats.alpa },
    {},
    { Kategori: 'Periode', Jumlah: `${options.startDate} s/d ${options.endDate}` },
    { Kategori: 'Kelas', Jumlah: options.kelas === 'semua' ? 'Semua' : `Kelas ${options.kelas}` },
  ]

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

  // Generate file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function exportAttendanceToCSV(options: {
  startDate: string
  endDate: string
  kelas: string
}): Promise<Blob> {
  // Fetch data
  const logs = await getLogAbsensi({
    startDate: options.startDate,
    endDate: options.endDate,
    kelas: options.kelas,
  })

  // Create CSV content
  const headers = ['Tanggal', 'Waktu Sholat', 'NIM', 'Nama', 'Kelas', 'Status', 'Waktu Scan']
  const rows = logs.map(log => [
    log.tanggal,
    log.waktu_sholat,
    log.nim,
    `"${log.nama}"`, // Quote names with commas
    log.kelas,
    log.status,
    log.waktu_scan || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

// ==================== STUDENT EXPORT ====================

export async function exportStudentsToCSV(): Promise<Blob> {
  const students = await getSantri()

  const headers = ['nim', 'nama', 'kelas', 'foto_url', 'is_active', 'created_at']
  const rows = students.map(s => [
    s.nim,
    `"${s.nama}"`,
    s.kelas,
    s.foto_url || '',
    s.is_active,
    s.created_at,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

export async function exportStudentsToExcel(): Promise<Blob> {
  const students = await getSantri()

  const dataRows = students.map(s => ({
    NIM: s.nim,
    'Nama Lengkap': s.nama,
    Kelas: s.kelas,
    'Foto URL': s.foto_url || '-',
    Aktif: s.is_active ? 'Ya' : 'Tidak',
    'Tanggal Daftar': s.created_at,
  }))

  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(dataRows)
  
  sheet['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 8 },
    { wch: 40 },
    { wch: 10 },
    { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(workbook, sheet, 'Data Santri')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ==================== UTILITY ====================

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportData(options: ExportOptions): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0]
  
  if (options.type === 'attendance') {
    let blob: Blob
    let filename: string

    switch (options.format) {
      case 'pdf':
        blob = await exportAttendanceToPDF(options)
        filename = `laporan-absensi-${timestamp}.pdf`
        break
      case 'excel':
        blob = await exportAttendanceToExcel(options)
        filename = `laporan-absensi-${timestamp}.xlsx`
        break
      case 'csv':
        blob = await exportAttendanceToCSV(options)
        filename = `laporan-absensi-${timestamp}.csv`
        break
      default:
        throw new Error('Format tidak didukung')
    }

    downloadBlob(blob, filename)
  } else if (options.type === 'students') {
    let blob: Blob
    let filename: string

    switch (options.format) {
      case 'csv':
        blob = await exportStudentsToCSV()
        filename = `master-santri-${timestamp}.csv`
        break
      case 'excel':
        blob = await exportStudentsToExcel()
        filename = `master-santri-${timestamp}.xlsx`
        break
      default:
        throw new Error('Format tidak didukung')
    }

    downloadBlob(blob, filename)
  }
}