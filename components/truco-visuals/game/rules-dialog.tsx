"use client"

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function RulesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cómo jugar Truco</DialogTitle>
        </DialogHeader>
        <div className="prose">
          <p>Reglas resumidas: Se juega a 15 puntos. Cantá envido y truco. El objetivo es ganar bazas.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
