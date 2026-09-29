import { upsertSantri, uploadStudentPhoto, type Santri } from './supabase-service'
import { saveSantri } from './indexeddb'

export interface CSVRow {
  nim: string
  nama: string
  kelas: string
  foto_url?: string
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  skipped: number
}

// Parse CSV content
export function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n')
  const result: CSVRow[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle both comma and semicolon delimiters
    const delimiter = line.includes(';') ? ';' : ','
    const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))

    if (values.length >= 3) {
      const [nim, nama, kelas, foto_url] = values
      
      // Validation
      if (!nim || !nama || !kelas) {
        console.warn(`Skipping row ${i + 1}: missing required fields`)
        continue
      }

      if (!['7', '8', '9'].includes(kelas)) {
        console.warn(`Skipping row ${i + 1}: invalid kelas "${kelas}"`)
        continue
      }

      result.push({
        nim,
        nama,
        kelas,
        foto_url: foto_url || undefined,
      })
    }
  }

  return result
}

// Validate CSV data
export function validateCSVData(rows: CSVRow[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const seenNims = new Set<string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because of header row and 0-index

    // Check NIM format (alphanumeric, reasonable length)
    if (!row.nim || row.nim.length < 3 || row.nim.length > 50) {
      errors.push(`Row ${rowNum}: NIM tidak valid`)
    }

    // Check for duplicate NIM
    if (seenNims.has(row.nim)) {
      errors.push(`Row ${rowNum}: NIM "${row.nim}" duplikat`)
    }
    seenNims.add(row.nim)

    // Check name
    if (!row.nama || row.nama.length < 2) {
      errors.push(`Row ${rowNum}: Nama terlalu pendek`)
    }

    // Check class
    if (!['7', '8', '9'].includes(row.kelas)) {
      errors.push(`Row ${rowNum}: Kelas harus 7, 8, atau 9`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Process CSV file
export async function processCSVFile(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    skipped: 0,
  }

  try {
    // Read file content
    const content = await file.text()
    
    // Parse CSV
    const rows = parseCSV(content)
    
    if (rows.length === 0) {
      result.errors.push('File CSV kosong atau format tidak valid')
      return result
    }

    // Validate data
    const validation = validateCSVData(rows)
    if (!validation.valid) {
      result.errors = validation.errors
      return result
    }

    // Prepare data for upsert
    const siswaData: Omit<Santri, 'created_at' | 'updated_at'>[] = rows.map(row => ({
      nim: row.nim,
      nama: row.nama,
      kelas: row.kelas,
      foto_url: row.foto_url || null,
      is_active: true,
    }))

    // Upsert to Supabase
    await upsertSantri(siswaData)

    // Also save to local IndexedDB
    await saveSantri(siswaData as any[])

    result.success = true
    result.imported = rows.length
  } catch (error) {
    console.error('CSV import error:', error)
    result.errors.push(`Gagal mengimpor: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Alternative: Process CSV with photo URLs already provided
export async function processCSVWithExistingPhotos(content: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    skipped: 0,
  }

  try {
    const rows = parseCSV(content)
    
    if (rows.length === 0) {
      result.errors.push('File CSV kosong atau format tidak valid')
      return result
    }

    const validation = validateCSVData(rows)
    if (!validation.valid) {
      result.errors = validation.errors
      return result
    }

    const siswaData: Omit<Santri, 'created_at' | 'updated_at'>[] = rows.map(row => ({
      nim: row.nim,
      nama: row.nama,
      kelas: row.kelas,
      foto_url: row.foto_url || null,
      is_active: true,
    }))

    await upsertSantri(siswaData)
    await saveSantri(siswaData as any[])

    result.success = true
    result.imported = rows.length
  } catch (error) {
    result.errors.push(`Gagal mengimpor: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Generate template CSV
export function generateTemplateCSV(): string {
  const template = `nim,nama,kelas,foto_url
202607001,Ahmad Fauzan,7,
202607002,Muhammad Rizky,7,
202608001,Fathur Rahman,8,
202609001,Zaid Abdullah,9,`
  
  return template
}

// Download template
export function downloadTemplate(): void {
  const template = generateTemplateCSV()
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'template_santri.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}