"use client"
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { useConvexQuery } from '@/components/hooks/use-convex-query'
import { BarLoader } from 'react-spinners'
import { Button } from '@/components/ui/button'

import CreateFolderModal from '@/components/create-folder-modal'
import FolderGrid from '@/components/folder-grid'

export default function Dashboard() {
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const { data: folders, isLoading } = useConvexQuery(api.folders.getFolders)

  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Workspace</h1>
            <p className="text-white/70">Organize your projects into folders</p>
          </div>
          <Button onClick={() => setShowCreateFolder(true)}>
            New Folder
          </Button>
        </div>

        {isLoading ? (
          <BarLoader width="100%" color="white" />
        ) : folders && folders.length > 0 ? (
          <FolderGrid folders={folders} />
        ) : (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold text-white mb-3">No folders yet</h3>
            <p className="text-white/70 mb-8">Create your first folder to get started</p>
            <Button onClick={() => setShowCreateFolder(true)}>
              Create Folder
            </Button>
          </div>
        )}

        <CreateFolderModal
          isOpen={showCreateFolder}
          onClose={() => setShowCreateFolder(false)}
        />
      </div>
    </div>
  )
}