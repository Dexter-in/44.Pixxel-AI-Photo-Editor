
"use client"
import { useCanvas } from '@/app/context/context';
import { useConvexQueryMutation } from '@/components/hooks/use-convex-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { Expand, Lock, Monitor, Unlock } from 'lucide-react';
import { Toast } from 'radix-ui';
import React, { useEffect, useState } from 'react'
import { toast, Toaster } from 'sonner';


const ASPECT_RATIOS = [
    { name: "Instagram Story", ratio: [9, 16], label: "9:16" },
    { name: "Instagram Post", ratio: [1, 1], label: "1:1" },
    { name: "Youtube Thumbnail", ratio: [16, 9], label: "16:9" },
    { name: "Portrait", ratio: [2, 3], label: "2:3" },
    { name: "Facebook Cover", ratio: [851, 315], label: "2.7:1" },
    { name: "Twitter Header", ratio: [3, 1], label: "3:1" },
];

const ResizeControls = ({ project }) => {

    const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
    const [newWidth, setNewWidth] = useState(project?.width || 800);
    const [newHeight, setNewHeight] = useState(project?.height || 600);
    const [lockAspectRatio, setLockAspectRatio] = useState(true);
    const [selectedPreset, setSelectedPreset] = useState(null);

    const {
        mutate: updateProject,
        data,
        isLoading
    } = useConvexQueryMutation(api.projects.updateProject)

    useEffect(() => {
        if (!isLoading && data) {
            setTimeout(() => {
                window.dispatchEvent(new Event("resize"))
            }, 500);
        }
    }, [data, isLoading])


    const handleWidthChange = (value) => {
        const width = parseInt(value) || 0
        setNewWidth(width)

        if (lockAspectRatio && project) {
            const ratio = project.height / project.width // current aspect ratio 
            setNewHeight(Math.round(width * ratio)) // apply ratio to new width
        }
    }
    const handleHeightChange = (value) => {
        const height = parseInt(value) || 0
        setNewHeight(height)

        if (lockAspectRatio && project) {
            const ratio = project.width / project.height // current aspect ratio 
            setNewHeight(Math.round(height * ratio)) // apply ratio to new width
        }

        setSelectedPreset(null)

    }


    const calculateAspectRatioDimensions = (ratio) => {
        if (!project) return { width: project.width, height: project.height }

        const [ratioW, ratioH] = ratio;
        const originalArea = project.width * project.height

        const aspectRatio = ratioW / ratioH
        const newHeight = Math.sqrt(originalArea / aspectRatio)
        const newWidth = newHeight * aspectRatio


        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        }

    }



    const applyAspectRatio = (aspectRatio) => {
        const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio)
        setNewWidth(dimensions.width)
        setNewHeight(dimensions.height)
        setSelectedPreset(aspectRatio.name)

    }

    const calculateViewportScale = () => {
        const container = canvasEditor.getElement().parentNode;
        if (!container) return 1;

        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;

        const scaleX = containerWidth / newWidth;
        const scaleY = containerHeight / newHeight;

        return Math.min(scaleX, scaleY, 1);
    };


    const handleApplyResize = async () => {
        if (!canvasEditor || !project ||
            (newWidth === project.width && newHeight === project.height)) {
            return
        }

        setProcessingMessage("Resizing canvas....")
        try {
            const viewportScale = calculateViewportScale()

            // Resize the logic dimensions (internal resolution)
            canvasEditor.setDimensions(
                { width: newWidth, height: newHeight },
                { backstoreOnly: true }
            );

            // Resize the display dimensions (CSS size on screen)
            canvasEditor.setDimensions(
                {
                    width: newWidth * viewportScale,
                    height: newHeight * viewportScale,
                },
                { cssOnly: true }
            );

            canvasEditor.setZoom(viewportScale);
            canvasEditor.requestRenderAll();

            await updateProject({
                projectId: project._id,
                width: newWidth,
                height: newHeight,
                canvasState: canvasEditor.toJSON(),
            })

            setProcessingMessage("")


        } catch (error) {
            console.log("Error resizing project", error)
            toast.error("Failed to resize project")
        }

    }



    const hasChanges = newWidth !== project.width || newHeight !== project.height

    return (
        <div className='space-y-6'>
            <div className="bg-slate-700/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-2">Current Size</h4>
                <div className="text-xs text-white/70">
                    {project.width} × {project.height} pixels
                </div>
            </div>

            <div className='space-y-4'>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white">Custom Size</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLockAspectRatio(!lockAspectRatio)}
                        className="text-white/70 hover:text-white p-1"
                    >
                        {lockAspectRatio ? (
                            <Lock className="h-4 w-4" />
                        ) : (
                            <Unlock className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-white/70 mb-1 block">Width</label>
                        <Input
                            type="number"
                            value={newWidth}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            min="100"
                            max="5000"
                            className="bg-slate-700 border-white/20 text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/70 mb-1 block">Height</label>
                        <Input
                            type="number"
                            value={newHeight}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            min="100"
                            max="5000"
                            className="bg-slate-700 border-white/20 text-white"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">
                        {lockAspectRatio ? "Aspect ratio locked" : "Free resize"}
                    </span>
                </div>
            </div>
            {/* Aspect Ratio Presets */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Aspect Ratios</h3>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {ASPECT_RATIOS.map((aspectRatio) => {
                        const dimensions = calculateAspectRatioDimensions(
                            aspectRatio.ratio
                        );
                        return (
                            <Button
                                key={aspectRatio.name}
                                variant={
                                    selectedPreset === aspectRatio.name ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => applyAspectRatio(aspectRatio)}
                                className={`justify-between h-auto py-2 ${selectedPreset === aspectRatio.name
                                    ? "bg-cyan-500 hover:bg-cyan-600"
                                    : "text-left"
                                    }`}
                            >
                                <div>
                                    <div className="font-medium">{aspectRatio.name}</div>
                                    <div className="text-xs opacity-70">
                                        {dimensions.width} × {dimensions.height} (
                                        {aspectRatio.label})
                                    </div>
                                </div>
                                <Monitor className="h-4 w-4" />
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* New Size Preview */}
            {hasChanges && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white mb-2">
                        New Size Preview
                    </h4>
                    <div className="text-xs text-white/70">
                        <div>
                            New Canvas: {newWidth} × {newHeight} pixels
                        </div>
                        <div className="text-cyan-400">
                            {newWidth > project.width || newHeight > project.height
                                ? "Canvas will be expanded"
                                : "Canvas will be cropped"}
                        </div>
                        <div className="text-white/50 mt-1">
                            Objects will maintain their current size and position
                        </div>
                    </div>
                </div>
            )}

            {/* Apply Button */}
            <Button
                onClick={handleApplyResize}
                disabled={!hasChanges || processingMessage}
                className="w-full"
                variant="primary"
            >
                <Expand className="h-4 w-4 mr-2" />
                Apply Resize
            </Button>
            <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-white/70">
                    <strong>Resize Canvas:</strong> Changes canvas dimensions.
                    <br />
                    <strong>Aspect Ratios:</strong> Smart sizing based on your current
                    canvas.
                    <br />
                    Objects maintain their size and position.
                </p>
            </div>


        </div>



    )

}
export default ResizeControls