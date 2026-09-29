declare module 'qrcode.react' {
  import * as React from 'react'

  interface QRCodeProps {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    includeMargin?: boolean
    renderAs?: 'svg' | 'canvas'
    bgColor?: string
    fgColor?: string
    style?: React.CSSProperties
    className?: string
  }

  const QRCode: React.FC<QRCodeProps>
  export default QRCode
}
