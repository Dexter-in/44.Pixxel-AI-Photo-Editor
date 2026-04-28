"use client"
import { useConvexQueryMutation } from '@/components/hooks/use-convex-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import { formatDistanceToNow } from 'date-fns'
import { Edit, Trash2 } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

function ProjectCard({ project, onEdit }) {

    const { mutate: deleteProject, isLoading } = useConvexQueryMutation(api.projects.deleteProject)


    const lastUpdated = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true });

    const handleDelete = async () => {
        const confirmed = confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone `)
        if (confirmed) {

            try {
                await deleteProject({ projectId: project._id })
                toast.success("Project deleted successfully")
            } catch (error) {
                console.error("Error deleting project:", error);
                toast.error("Failed to delete project")
            }
        }
    }

    return (
        <Card className="py-0 group relative bg-slate-800/50 overflow-hidden
         hover:border-white/20 transition-all hover:transform hover:scale-[1.02]">
            <div className="aspect-video bg-slate-700 relative overflow-hidden">
                {
                    project.thumbnailURL && (
                        <img
                            src={project.thumbnailURL}
                            alt={project.title}
                            className="w-full h-full object-cover" />

                    )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">

                    <Button variant="glass" size="sm" onClick={onEdit} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="glass"
                        size="sm"
                        onClick={handleDelete}
                        className="gap-2 text-red-400 hover:text-red-300"
                        disabled={isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>


            </div>

            <CardContent className="pb-6">
                <h3 className="font-semibold text-white mb-1 truncate">
                    {project.title}
                </h3>

                <div className="flex flex-col gap-2 mt-2">
                    <span className="text-sm text-white/70">Updated {lastUpdated}</span>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className="text-xs bg-slate-700 text-white/70"
                        >
                            {project.width} × {project.height}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>

    )
}

export default ProjectCard