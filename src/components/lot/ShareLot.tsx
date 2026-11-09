import { useRef } from 'react'
import { Copy, Download, QrCode, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Lot } from '@/data/types'
import { canNativeShare, copyLotLink, lotUrl, shareLot } from '@/lib/share'

/** QR code plus share / copy / download, for posting a lot on a sign or sending it to a buyer. */
export function ShareLot({ lot }: { lot: Lot }) {
  const qrRef = useRef<SVGSVGElement>(null)
  const url = lotUrl(lot)
  const canShare = canNativeShare()
  const copy = () => copyLotLink(lot)
  const share = () => shareLot(lot)

  const download = () => {
    const svg = qrRef.current
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `lot-${lot.number}-qr.svg`
    a.click()
    URL.revokeObjectURL(href)
    toast.success('QR code downloaded', { description: `lot-${lot.number}-qr.svg` })
  }

  return (
    <div className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:p-6">
      <div className="justify-self-center rounded-lg bg-white p-3 sm:justify-self-start">
        <QRCodeSVG ref={qrRef} value={url} size={148} level="M" bgColor="#FFFFFF" fgColor="#1F1A16" title={`QR code linking to Lot ${lot.number}`} />
      </div>
      <div className="grid content-start gap-3">
        <h3 className="flex items-center gap-2 text-2xl font-bold">
          <QrCode className="size-6 text-primary" aria-hidden />
          Share this lot
        </h3>
        <p className="text-muted-foreground">
          Scan the code with a phone camera to open this page. Print it for the sale barn board or send the link to a buyer.
        </p>
        <p className="truncate rounded-md bg-muted px-3 py-2 font-mono text-sm" title={url}>
          {url}
        </p>
        <div className="flex flex-wrap gap-2">
          {canShare && (
            <Button onClick={share}>
              <Share2 aria-hidden />
              Share
            </Button>
          )}
          <Button variant={canShare ? 'outline' : 'default'} onClick={copy}>
            <Copy aria-hidden />
            Copy link
          </Button>
          <Button variant="outline" onClick={download}>
            <Download aria-hidden />
            Download QR
          </Button>
        </div>
      </div>
    </div>
  )
}
