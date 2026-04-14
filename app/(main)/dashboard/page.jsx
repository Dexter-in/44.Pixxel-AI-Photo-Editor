"use client"
import { api } from '@/convex/_generated/api'
import { useConvexQuery } from '@/components/hooks/use-convex-query'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import { BarLoader } from 'react-spinners'
import NewProjectModal from './_component/new-project-model'

function Dashboard() {

    const [showNewProjectModel, setShowNewProjectModel] = useState(false)

    const { data: projects, isLoading } = useConvexQuery(api.projects.getUserProjects)

    console.log(projects)


    return (
        <div className='min-h-screen pt-32 pb-16'>
            <div className='container mx-auto px-6'>
                <div className='flex items-center justify-between mb-8'>
                    <div>
                        <h1 className='text-4xl font-bold text-white mb-2'>Your Projects</h1>
                        <p className='text-white/70'>Create and Manage Your AI-powere images designs</p>
                    </div>
                    <Button
                        onClick={() => setShowNewProjectModel(true)}
                        variant='primary' size='lg' className="gap-2">
                        <Plus className='w-5 h-5' />
                        New Project
                    </Button>
                </div>

                {isLoading ? (
                    <BarLoader width={'100%'} color="white" />
                ) : projects && projects.length > 0 ? (
                    <></>
                ) : (<div className="flex flex-col items-center justify-center py-20 text-center">
                    <h3 className="text-2xl font-semibold text-white mb-3">
                        Create Your First Project
                    </h3>

                    <p className="text-white/70 mb-8 max-w-md">
                        Upload an image to start editing with our powerful AI tools, or create a
                        blank canvas to design from scratch.
                    </p>
                    <Button
                        onClick={() => setShowNewProjectModel(true)}
                        variant='primary' size='' className="gap-2">

                        <Sparkles className='w-5 h-5' />
                        Start Creating
                    </Button>
                </div>
                )}

                {/* New Project Modal */}
                <NewProjectModal
                    isOpen={showNewProjectModel}
                    onClose={() => setShowNewProjectModel(false)}
                    projectCount={projects?.length || 0}
                />
            </div>
        </div>
    )
}

export default Dashboard