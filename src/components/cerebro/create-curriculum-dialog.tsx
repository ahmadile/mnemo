'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

const COLOR_PALETTE = [
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Émeraude', value: '#10B981' },
  { name: 'Violet', value: '#A855F7' },
  { name: 'Ambre', value: '#F59E0B' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Citron', value: '#84CC16' },
]

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'javascript', label: 'JavaScript' },
]

interface CreateCurriculumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateCurriculumDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCurriculumDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0].value)
  const [language, setLanguage] = useState('python')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !description.trim()) {
      toast.error('Remplissez le nom et la description')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/curricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color,
          language,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast.success(`Cursus "${data.curriculum.name}" créé`)
      setName('')
      setDescription('')
      setColor(COLOR_PALETTE[0].value)
      setLanguage('python')
      onOpenChange(false)
      onCreated()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-400" />
            </div>
            Créer un cursus personnalisé
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Ajoutez un cursus hors des 5 par défaut (ex: Rust, DevOps, TensorFlow, Kubernetes).
            Le cursus apparaîtra sur votre dashboard et pourra accueillir des missions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="name" className="text-xs text-zinc-400">
              Nom du cursus <span className="text-emerald-400">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rust, DevOps, TensorFlow..."
              className="mt-1 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              maxLength={40}
            />
          </div>

          <div>
            <Label htmlFor="desc" className="text-xs text-zinc-400">
              Description <span className="text-emerald-400">*</span>
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Que couvre ce cursus ? Quel est l'objectif d'apprentissage ?"
              rows={3}
              className="mt-1 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-400 block mb-2">
              Langage par défaut pour les missions
            </Label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLanguage(l.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    language === l.value
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-400 block mb-2">Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-md transition-all ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 hover:bg-zinc-800/50"
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !description.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Créer le cursus
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
