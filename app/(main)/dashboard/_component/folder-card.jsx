"use client"
import { useState } from 'react'
import { useConvexQueryMutation } from '@/components/hooks/use-convex-query'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Folder, Trash2, Edit3, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import RenameFolderModal from './rename-folder-modal'

export default function FolderCard({ folder, onOpen }) {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const { mutate: deleteFolder } = useConvexQueryMutation(api.folders.deleteFolder)

  const handleDelete = async (event) => {
    event.stopPropagation()
    const confirmed = confirm(`Delete folder "${folder.name}"?`)
    if (!confirmed) return

    try {
      await deleteFolder({ folderId: folder._id })
      toast.success('Folder deleted')
    } catch (error) {
      toast.error('Failed to delete folder')
    }
  }

  return (
    <>
      <Card onClick={() => onOpen(folder._id)} className="cursor-pointer hover:shadow-lg transition overflow-hidden">
        <CardContent className="p-0">
          {/* Preview Thumbnails */}
          <div className="bg-slate-900 aspect-square overflow-hidden">
            {folder.previewThumbnails && folder.previewThumbnails.length > 0 ? (
              <div className={`grid gap-1 h-full ${
                folder.previewThumbnails.length === 1 
                  ? 'grid-cols-1' 
                  : folder.previewThumbnails.length === 2
                  ? 'grid-cols-2'
                  : folder.previewThumbnails.length === 3
                  ? 'grid-cols-2'
                  : 'grid-cols-2'
              } p-1`}>
                {folder.previewThumbnails.map((thumbnail, idx) => (
                  <div key={idx} className="relative overflow-hidden bg-slate-800 rounded-sm">
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Folder className="h-12 w-12 text-white/30" />
              </div>
            )}
          </div>

          {/* Folder Info */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg truncate">{folder.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>
                    <Edit3 className="mr-2 h-4 w-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleDelete} className="text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>Projects: {folder.projectCount || 0}</CardDescription>
            <Button className="w-full mt-4">
              Open Folder <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <RenameFolderModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        folder={folder}
      />
    </>
  )
}
