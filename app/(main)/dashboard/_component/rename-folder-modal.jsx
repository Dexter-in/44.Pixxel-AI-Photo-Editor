"use client"
import { useState, useEffect } from 'react'
import { useConvexQueryMutation } from '@/components/hooks/use-convex-query'
import { api } from '@/convex/_generated/api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function RenameFolderModal({ isOpen, onClose, folder }) {
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { mutate: renameFolder } = useConvexQueryMutation(api.folders.renameFolder)

  // Update newName when folder changes or modal opens
  useEffect(() => {
    if (isOpen && folder) {
      setNewName(folder.name)
    }
  }, [isOpen, folder])

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error('Folder name cannot be empty')
      return
    }

    if (newName.trim() === folder.name) {
      toast.info('New name is the same as current name')
      onClose()
      return
    }

    setIsLoading(true)
    try {
      console.log('Starting rename with:', { folderId: folder._id, newName: newName.trim() })
      const result = await renameFolder({
        folderId: folder._id,
        name: newName.trim(),
      })
      console.log('Rename result:', result)
      toast.success('Folder renamed successfully')
      setNewName('')
      onClose()
    } catch (error) {
      console.error('Rename error:', error)
      toast.error(error.message || 'Failed to rename folder')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open) => {
    if (!open) {
      setNewName('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Enter a new name for your folder
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter folder name"
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}