"use client"
import { useState, useEffect } from 'react'
import { useConvexQueryMutation } from '@/components/hooks/use-convex-query'
import { api } from '@/convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CreateFolderModal({ isOpen, onClose }) {
  const [name, setName] = useState('')
  const { mutate: createFolder, isLoading } = useConvexQueryMutation(api.folders.createFolder)

  useEffect(() => {
    if (!isOpen) setName('')
  }, [isOpen])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Enter a folder name')
      return
    }
    
    try {
      await createFolder({ name: name.trim() })
      toast.success('Folder created')
      onClose()
    } catch (error) {
      toast.error('Failed to create folder')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Folder Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Projects"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}