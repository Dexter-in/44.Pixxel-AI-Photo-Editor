"use client"
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { useConvexQuery } from '@/components/hooks/use-convex-query'
import { BarLoader } from 'react-spinners'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ProjectGrid from '../../_component/project-grid'
import NewProjectModal from '../../_component/new-project-model'

export default function FolderPage() {
  const { folderId } = useParams()
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const { data: projects, isLoading } = useConvexQuery(api.projects.getProjectsByFolder, { folderId })

  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Folder Projects</h1>
          <Button
            onClick={() => setShowNewProjectModal(true)}
            variant='primary'
            size='lg'
            className="gap-2"
          >
            <Plus className='w-5 h-5' />
            New Project
          </Button>
        </div>
        
        {isLoading ? (
          <BarLoader width="100%" color="white" />
        ) : (
          <ProjectGrid projects={projects || []} />
        )}

        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          folderId={folderId}
        />
      </div>
    </div>
  )
}