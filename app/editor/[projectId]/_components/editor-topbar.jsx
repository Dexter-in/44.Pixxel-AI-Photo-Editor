" use client"
import { useCanvas } from '@/app/context/context';
import { useConvexQuery, useConvexQueryMutation } from '@/components/hooks/use-convex-query';
import usePlanAccess from '@/components/hooks/use-plan-access';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UpgradeModal } from '@/components/upgrade-model';
import { api } from '@/convex/_generated/api';
import { FabricImage } from 'fabric';
import { ArrowLeft, ChevronDown, Crop, Download, Expand, Eye, FileImage, Icon, Loader2, Lock, Maximize2, Palette, RefreshCcw, RotateCcw, RotateCw, Save, Sliders, Text } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

const TOOLS = [
    {
        id: "resize",
        label: "Resize",
        icon: Expand,
        isActive: true,
    },
    {
        id: "crop",
        label: "Crop",
        icon: Crop,
    },
    {
        id: "adjust",
        label: "Adjust",
        icon: Sliders,
    },
    {
        id: "text",
        label: "Text",
        icon: Text,
    },
    {
        id: "background",
        label: "AI Background",
        icon: Palette,
        proOnly: true,
    },
    {
        id: "ai_extender",
        label: "AI Image Extender",
        icon: Maximize2,
        proOnly: true,
    },
    {
        id: "ai_edit",
        label: "AI Editing",
        icon: Eye,
        proOnly: true,
    },
];



const EXPORT_FORMATS = [
    {
        format: "PNG",
        quality: 1.0,
        label: "PNG (High Quality)",
        extension: "png",
    },
    {
        format: "JPEG",
        quality: 0.9,
        label: "JPEG (90% Quality)",
        extension: "jpg",
    },
    {
        format: "JPEG",
        quality: 0.8,
        label: "JPEG (80% Quality)",
        extension: "jpg",
    },
    {
        format: "WEBP",
        quality: 0.9,
        label: "WebP (90% Quality)",
        extension: "webp",
    },
];




function EditorTopbar({ project }) {
    const router = useRouter()
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [restrictedTool, setRestrictedTool] = useState(null)


    const { activeTool, onToolChange, canvasEditor } = useCanvas()
    const { hasAccess, canExport, isFree } = usePlanAccess();



    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState(null);


    // Undo/Redo state
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);

    // Save canvas state to undo stack
    const saveToUndoStack = () => {
        if (!canvasEditor || isUndoRedoOperation) return;
        //This function saves current canvas data.
        //canvas doesn't exist and undo/redo is happening

        const canvasState = JSON.stringify(canvasEditor.toJSON());
        //Convert canvas into JSON string.
        //This is like taking a snapshot of canvas.

        // Update undo history.
        setUndoStack((prev) => {
            const newStack = [...prev, canvasState];
            //Add new canvas state to old stack.
            // Limit undo stack to 20 items to prevent memory issues
            if (newStack.length > 20) {
                newStack.shift();
                //Keep only last 20 states.To avoid memory issues.
            }
            return newStack;
        });

        // Clear redo stack when new action is performed
        setRedoStack([]);
    };

    // Setup undo/redo listeners
    useEffect(() => {
        if (!canvasEditor) return;

        // Save initial state
        setTimeout(() => {
            if (canvasEditor && !isUndoRedoOperation) {
                const initialState = JSON.stringify(canvasEditor.toJSON());
                setUndoStack([initialState]);
                //Saves first canvas state.This becomes starting point for undo.
            }
        }, 1000);

        const handleCanvasModified = () => {
            if (!isUndoRedoOperation) {
                // Debounce state saving to avoid too many saves
                setTimeout(() => {
                    if (!isUndoRedoOperation) {
                        saveToUndoStack();
                    }
                }, 500);
            }
        };

        // Listen to canvas events that should trigger state save
        canvasEditor.on("object:modified", handleCanvasModified);
        canvasEditor.on("object:added", handleCanvasModified);
        canvasEditor.on("object:removed", handleCanvasModified);
        canvasEditor.on("path:created", handleCanvasModified);

        return () => {
            canvasEditor.off("object:modified", handleCanvasModified);
            canvasEditor.off("object:added", handleCanvasModified);
            canvasEditor.off("object:removed", handleCanvasModified);
            canvasEditor.off("path:created", handleCanvasModified);
        };
    }, [canvasEditor, isUndoRedoOperation]);

    // Undo function
    const handleUndo = async () => {
        if (!canvasEditor || undoStack.length <= 1) return;

        setIsUndoRedoOperation(true);

        try {
            // Move current state to redo stack
            const currentState = JSON.stringify(canvasEditor.toJSON());
            setRedoStack((prev) => [...prev, currentState]);

            // Remove last state from undo stack and apply the previous one
            const newUndoStack = [...undoStack];
            newUndoStack.pop(); // Remove current state
            const previousState = newUndoStack[newUndoStack.length - 1];

            if (previousState) {
                await canvasEditor.loadFromJSON(JSON.parse(previousState));
                canvasEditor.requestRenderAll();
                setUndoStack(newUndoStack);
                toast.success("Undid last action");
            }
        } catch (error) {
            console.error("Error during undo:", error);
            toast.error("Failed to undo action");
        } finally {
            setTimeout(() => setIsUndoRedoOperation(false), 100);
        }
    };



    // Redo function
    const handleRedo = async () => {
        if (!canvasEditor || redoStack.length === 0) return;

        setIsUndoRedoOperation(true);

        try {
            // Get the latest state from redo stack
            const newRedoStack = [...redoStack];
            const nextState = newRedoStack.pop();

            if (nextState) {
                // Save current state to undo stack
                const currentState = JSON.stringify(canvasEditor.toJSON());
                setUndoStack((prev) => [...prev, currentState]);

                // Apply the redo state
                await canvasEditor.loadFromJSON(JSON.parse(nextState));
                canvasEditor.requestRenderAll();
                setRedoStack(newRedoStack);
                toast.success("Redid last action");
            }
        } catch (error) {
            console.error("Error during redo:", error);
            toast.error("Failed to redo action");
        } finally {
            setTimeout(() => setIsUndoRedoOperation(false), 100);
        }
    };


    const { data: user } = useConvexQuery(api.users.getCurrentUser)


    const handleBackToDashboard = () => {
        router.push("/dashboard")
    }

    const handleToolChange = (toolId) => {
        if (!hasAccess(toolId)) {
            setrestrictedTool(toolId)
            setShowUpgradeModal(true)
            return;
        }

        onToolChange(toolId)
    }

    const { mutate: updateProject, isLoading: isSaving } = useConvexQueryMutation(
        api.projects.updateProject
    )




    const handleResetToOriginal = async () => {
        if (!canvasEditor || !project || !project.originalImageURL) {
            toast.error("No original image found to reset to");
            return;
        }

        try {

            // Clear canvas and reset state
            canvasEditor.clear();
            canvasEditor.backgroundColor = "#ffffff";
            canvasEditor.backgroundImage = null;

            // Load original image
            const fabricImage = await FabricImage.fromURL(project.originalImageURL, {
                crossOrigin: "anonymous",
            });

            // Calculate proper scaling
            const imgAspectRatio = fabricImage.width / fabricImage.height;
            const canvasAspectRatio = project.width / project.height;
            const scale =
                imgAspectRatio > canvasAspectRatio
                    ? project.width / fabricImage.width
                    : project.height / fabricImage.height;

            fabricImage.set({
                left: project.width / 2,
                top: project.height / 2,
                originX: "center",
                originY: "center",
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
            });

            fabricImage.filters = [];
            canvasEditor.add(fabricImage);
            canvasEditor.centerObject(fabricImage);
            canvasEditor.setActiveObject(fabricImage);
            canvasEditor.requestRenderAll();

            // Save the reset state
            const canvasJSON = canvasEditor.toJSON();
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON,
                currentImageURL: project.originalImageURL,
                activeTransformation: undefined,
                backgroundRemoved: false,
            });


            toast.success("Canvas reset to original image");


        } catch (error) {
            console.error("Error resetting canvas:", error);
            toast.error("Failed to reset canvas. Please try again.");


        }
    }


    // Manual save functionality
    const handleManualSave = async () => {
        if (!canvasEditor || !project) {
            toast.error("Canvas not ready for saving");
            return;
        }

        try {
            const canvasJSON = canvasEditor.toJSON();
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON,
            });
            toast.success("Project saved successfully!");
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error("Failed to save project. Please try again.");

        }
    }




    const handleExport = async (exportConfig) => {
        if (!canvasEditor || !project) {
            toast.error("Canvas not ready for export");
            return;
        }

        // Check export limits for free users
        if (!canExport(user?.exportsThisMonth || 0)) {
            setRestrictedTool("export");
            setShowUpgradeModal(true);
            return;
        }

        setIsExporting(true);
        setExportFormat(exportConfig.format);

        try {
            // Store current canvas state for restoration
            const currentZoom = canvasEditor.getZoom();
            const currentViewportTransform = [...canvasEditor.viewportTransform];

            // Reset zoom and viewport for accurate export
            canvasEditor.setZoom(1);
            canvasEditor.setViewportTransform([1, 0, 0, 1, 0, 0]);
            canvasEditor.setDimensions({
                width: project.width,
                height: project.height,
            });
            canvasEditor.requestRenderAll();

            // Export the canvas
            const dataURL = canvasEditor.toDataURL({
                format: exportConfig.format.toLowerCase(),
                quality: exportConfig.quality,
                multiplier: 1,
            });

            // Restore original canvas state
            canvasEditor.setZoom(currentZoom);
            canvasEditor.setViewportTransform(currentViewportTransform);
            canvasEditor.setDimensions({
                width: project.width * currentZoom,
                height: project.height * currentZoom,
            });
            canvasEditor.requestRenderAll();

            // Download the image
            const link = document.createElement("a");
            link.download = `${project.title}.${exportConfig.extension}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Image exported as ${exportConfig.format}!`);
        } catch (error) {
            console.error("Error exporting image:", error);
            toast.error("Failed to export image. Please try again.");
        } finally {
            setIsExporting(false);
            setExportFormat(null);
        }
    };



    return <>
        <div>
            <div className='flex items-center justify-between mb-4'>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToDashboard}
                    className="text-white hover:text-gray-300"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    All Projects
                </Button>


                <h1 className="font-extrabold capitalize">{project.title}</h1>

                <div>

                    <div className="flex items-center gap-3">

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetToOriginal}
                            disabled={isSaving || !project.originalImageURL}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </>
                            )}
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleManualSave}
                            disabled={isSaving || !canvasEditor}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save
                                </>
                            )}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="glass"
                                    size="sm"
                                    disabled={isExporting || !canvasEditor}
                                    className="gap-2"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Exporting {exportFormat}...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Export
                                            <ChevronDown className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align='end'
                                className="w-56 bg-slate-800 border-slate-700"
                            >
                                <DropdownMenuGroup className="px-3 text-sm text-white/70">
                                    <DropdownMenuLabel> Export Resolution: {project.width} × {project.height}px </DropdownMenuLabel>

                                </DropdownMenuGroup>
                                <DropdownMenuSeparator className="bg-slate-700" />

                                {EXPORT_FORMATS.map((config, index) => (
                                    <DropdownMenuItem
                                        key={index}
                                        onClick={() => handleExport(config)}
                                        className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                    >
                                        <FileImage className="h-4 w-4" />
                                        <div className="flex-1">
                                            <div className="font-medium">{config.label}</div>
                                            <div className="text-xs text-white/50">
                                                {config.format} • {Math.round(config.quality * 100)}%
                                                quality
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}


                                {isFree && (

                                    <>
                                        <DropdownMenuSeparator className="bg-slate-700" />
                                        <div className="px-3 py-2 text-xs text-white/50">
                                            Free Plan: {user?.exportsThisMonth || 0}/20 exports this
                                            month
                                            {(user?.exportsThisMonth || 0) >= 20 && (
                                                <div className="text-amber-400 mt-1">
                                                    Upgrade to Pro for unlimited exports
                                                </div>
                                            )}
                                        </div>
                                    </>

                                )}


                            </DropdownMenuContent>
                        </DropdownMenu>




                    </div>



                </div>

            </div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    {TOOLS?.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = activeTool === tool.id
                        const hasToolAccess = hasAccess(tool.id)

                        return (
                            <Button
                                key={tool.id}
                                variant={isActive ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleToolChange(tool.id)}
                                className={`gap-2 relative ${isActive
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "text-white hover:text-gray-300 hover:bg-gray-100"
                                    } ${!hasToolAccess ? "opacity-60" : ""}`}
                            >
                                <Icon className="h-4 w-4" />
                                {tool.label}
                                {tool.proOnly && !hasToolAccess && (
                                    <Lock className="h-3 w-3 text-amber-400" />
                                )}
                            </Button>
                        )
                    })}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        onClick={handleUndo}
                        variant="ghost"
                        size="sm"
                        className="text-white">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleRedo}
                        variant="ghost"
                        size="sm"
                        className="text-white">
                        <RotateCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>

        <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => {
                setShowUpgradeModal(false)
                setrestrictedTool(null)
            }}
            restrictedTool={restrictedTool}
            reason={restrictedTool === "export"
                ? "free plan is limited to 20 export per month Upgrade to Pro for unlimited exports" : undefined
            }

        />




    </>
}

export default EditorTopbar