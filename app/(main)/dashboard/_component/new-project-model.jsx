import usePlanAccess from '@/components/hooks/use-plan-access';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge';
import React from 'react'

const NewProjectModal = ({ isOpen, onClose, projectCount = 0 }) => {

    const handleclose = () => {
        onClose();
    }

    const { isFree } = usePlanAccess();
    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleclose}>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        {isFree && (
                            <Badge
                                variant="secondary"
                                className="bg-slate-700 text-white/70"
                            >
                                {projectCount}/3 projects
                            </Badge>
                        )}
                    </DialogHeader>
                    <DialogFooter>
                        Footer
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default NewProjectModal