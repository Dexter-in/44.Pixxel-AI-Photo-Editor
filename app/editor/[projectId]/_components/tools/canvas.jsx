
"use client"

import { useCanvas } from "@/app/context/context";
import { useConvexQueryMutation } from "@/components/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";

import { Canvas, FabricImage } from "fabric";
import React, { useEffect, useRef, useState } from "react";

function CanvasEditor({ project }) {
    const canvasRef = useRef();
    const containerRef = useRef();
    const { canvasEditor, setCanvasEditor, activeTool, onToolChange } =
        useCanvas();
    const [isLoading, setIsLoading] = useState(false);

    const { mutate: updateProject } = useConvexQueryMutation(
        api.projects.updateProject
    );

    /**
     * Calculates the scale factor needed to fit the canvas within the current container
     * while maintaining the project's aspect ratio.
     */
    const calculateViewportScale = () => {
        if (!containerRef.current || !project) return 1;
        const container = containerRef.current;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        const scaleX = containerWidth / project.width;
        const scaleY = containerHeight / project.height;
        return Math.min(scaleX, scaleY, 1);
    };

    const activeCanvasRef = useRef(null);

    /**
     * Effect Hook: Initializes the Fabric.js canvas when the component mounts or the project changes.
     * Handles canvas setup, high DPI scaling, image loading, and state restoration.
     */
    useEffect(() => {
        if (!canvasRef.current || !project) return;

        /**
         * The core function that sets up the Fabric.js environment.
         */
        const initializeCanvas = async () => {
            // Check if already initialized on this specific element
            if (canvasRef.current?.fabric || activeCanvasRef.current) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const viewportScale = calculateViewportScale();
                const canvas = new Canvas(canvasRef.current, {
                    width: project.width,
                    height: project.height,
                    backgroundColor: "#ffffff",
                    preserveObjectStacking: true,
                    controlsAboveOverlay: true,
                    selection: true,
                });

                activeCanvasRef.current = canvas;

                // Sync both lower and upper canvas layers
                canvas.setDimensions(
                    {
                        width: project.width * viewportScale,
                        height: project.height * viewportScale,
                    },
                    { backstoreOnly: false }
                );

                canvas.setZoom(viewportScale);

                // High DPI handling
                const scaleFactor = window.devicePixelRatio || 1;
                if (scaleFactor > 1) {
                    const el = canvas.getElement();
                    if (el) {
                        el.width = project.width * scaleFactor;
                        el.height = project.height * scaleFactor;
                    }
                    canvas.getContext().scale(scaleFactor, scaleFactor);
                }

                // Load image
                if (project.currentImageURL || project.originalImageURL) {
                    try {
                        const imageUrl = project.currentImageURL || project.originalImageURL;
                        const fabricImage = await FabricImage.fromURL(imageUrl, {
                            crossOrigin: "anonymous",
                        });

                        const imgAspectRatio = fabricImage.width / fabricImage.height;
                        const canvasAspectRatio = project.width / project.height;
                        let scaleX, scaleY;

                        if (imgAspectRatio > canvasAspectRatio) {
                            scaleX = project.width / fabricImage.width;
                            scaleY = scaleX;
                        } else {
                            scaleY = project.height / fabricImage.height;
                            scaleX = scaleY;
                        }

                        fabricImage.set({
                            left: project.width / 2,
                            top: project.height / 2,
                            originX: "center",
                            originY: "center",
                            scaleX,
                            scaleY,
                            selectable: true,
                            evented: true,
                        });

                        canvas.add(fabricImage);
                        canvas.centerObject(fabricImage);
                    } catch (error) {
                        console.error("Error loading project image:", error);
                    }
                }

                // Load saved canvas state
                if (project.canvasState) {
                    try {
                        await canvas.loadFromJSON(project.canvasState);
                        canvas.requestRenderAll();
                    } catch (error) {
                        console.error("Error loading canvas state:", error);
                    }
                }

                canvas.calcOffset();
                canvas.requestRenderAll();

                // Signal completion to the context
                setCanvasEditor(canvas);

                setTimeout(() => {
                    window.dispatchEvent(new Event("resize"));
                }, 500);

            } catch (error) {
                console.error("Failed to ffinitialize canvas:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeCanvas();

        return () => {
            if (activeCanvasRef.current) {
                activeCanvasRef.current.dispose();
                activeCanvasRef.current = null;
                setCanvasEditor(null);
            }
        };
    }, [project?._id]);


    /**
     * Saves the current decorative state of the canvas (all objects, positions, etc.)
     * to the Convex database in JSON format.
     */
    const saveCanvaseState = async () => {

        if (!canvasEditor || !project) return

        try {

            //Export canvas to JSON format (include all the objects and propertirs)
            const canvasJSON = canvasEditor.toJSON();

            // Save to Convex Database 
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON
            })
        } catch (error) {

            console.log("Error saving the canvas state", error)

        }
    }


    /**
     * Effect Hook: Handles auto-saving whenever the canvas is modified.
     * Includes a 2-second debounce timer to prevent saving too frequently.
     */
    useEffect(() => {
        if (!canvasEditor) return

        let saveTimeOut
        //Debounse save Function -waits 2 sec after last changes
        const handleCanvasChange = () => {
            clearTimeout(saveTimeOut);
            saveTimeOut = setInterval(() => {
                saveCanvaseState();
            }, 2000) //2 sec delay
        };

        //Listen for canvas modification events 
        canvasEditor.on("object:modified", handleCanvasChange);// object transformed 
        canvasEditor.on("object:added", handleCanvasChange);// new obeject added 
        canvasEditor.on("object:removed", handleCanvasChange);// object removed

        return () => {
            clearTimeout(saveTimeOut);
            canvasEditor.off("object:modified", handleCanvasChange);
            canvasEditor.off("object:added", handleCanvasChange);
            canvasEditor.off("object:removed", handleCanvasChange);


        }


    }, [canvasEditor])




    /**
     * Effect Hook: Listens for window resize events to keep the canvas properly
     * scaled and centered in the browser window.
     */
    useEffect(() => {
        const handleResize = () => {
            if (!canvasEditor || !project) return


            //Recalculate optimal scale for new window size 
            const newScale = calculateViewportScale();
            canvasEditor.setDimensions(
                {
                    width: project.width * newScale,
                    height: project.height * newScale,
                },
                { backstoreOnly: false }
            );
            canvasEditor.setZoom(newScale);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();

        }
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [canvasEditor, project])


    useEffect(() => {
        if (!canvasEditor) return

        switch (activeTool) {
            case "crop":
                // Change cursor to crosshair for crop tool
                canvasEditor.defaultCursor = "crosshair"
                canvasEditor.hoverCursor = "crosshair"
                break;
            default:
                // Change cursor to default for other tools
                canvasEditor.defaultCursor = "default"
                canvasEditor.hoverCursor = "move"

        }

    }, [canvasEditor, activeTool])


    // Handle automatic tab switching when text is selected
    useEffect(() => {
        if (!canvasEditor || !onToolChange) return;

        const handleSelection = (e) => {
            const selectedObject = e.selected?.[0];
            if (selectedObject && selectedObject.type === "i-text") {
                onToolChange("text");
            }
        };

        canvasEditor.on("selection:created", handleSelection);
        canvasEditor.on("selection:updated", handleSelection);

        return () => {
            canvasEditor.off("selection:created", handleSelection);
            canvasEditor.off("selection:updated", handleSelection);
        };
    }, [canvasEditor, onToolChange]);






    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center bg-secondary w-full h-full overflow-hidden"
        >
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(45deg, #64748b 25%, transparent 25%),
            linear-gradient(-45deg, #64748b 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #64748b 75%),
            linear-gradient(-45deg, transparent 75%, #64748b 75%)`,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                        <p className="text-white/70 text-sm">Loading canvas...</p>
                    </div>
                </div>
            )}

            <div className="px-5">
                <canvas id="canvas" className="border" ref={canvasRef} />
            </div>
        </div>
    );
}

export default CanvasEditor;