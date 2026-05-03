"use client"

import { useCanvas } from '@/app/context/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FabricImage } from 'fabric/';
import { Download, ImageIcon, Loader2, Palette, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';




const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

/**
 * BackgroundControls Component
 * Provides UI and logic for managing canvas backgrounds including AI background removal,
 * setting solid colors, and searching/setting Unsplash images as backgrounds.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.project - The current project containing dimensions and image URLs
 */
const BackgroundControls = ({ project }) => {

    const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [searchQuery, setSearchQuery] = useState("");
    const [unsplashImages, setUnsplashImages] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedImageId, setSelectedImageId] = useState(null);
    /**
     * Retrieves the primary image object from the canvas.
     * @returns {fabric.Image|null} The main image object or null if not found
     */
    const getMainImage = () => {
        if (!canvasEditor) return null

        const objects = canvasEditor.getObjects()
        return objects.find((obj) => obj.type === "image")
    }

    /**
     * Handles the AI background removal process.
     * Extracts the background using ImageKit's background removal feature,
     * replacing the current image on the canvas with the processed one while retaining its properties.
     */
    const handleBackgroundRemoval = async () => {
        const mainImage = getMainImage()

        if (!mainImage || !project) return


        setProcessingMessage("Removing background with AI...")

        try {
            const currentImageURL = project.currentImageURL || project.originalImageURL;

            //It checks if the image is hosted on ImageKit.
            // If yes → it adds a background removal transformation.
            // If not → it keeps the original URL.
            const bgRemovedUrl = currentImageURL?.includes("ik.imagekit.io")
                ? `${currentImageURL.split("?")[0]}?tr=e-bgremove`
                : currentImageURL;

            // It loads an image from a URL and converts it into a Fabric.js image object that you can use inside a canvas.
            const processingIamge = await FabricImage.fromURL(bgRemovedUrl, {
                crossOrigin: "anonymous", //
            })


            const currentProps = {
                left: mainImage.left,
                top: mainImage.top,
                scaleX: mainImage.scaleX,
                scaleY: mainImage.scaleY,
                angle: mainImage.angle,
                originX: mainImage.originX,
                originY: mainImage.originY,
            };

            canvasEditor.remove(mainImage); // remove original image 
            processingIamge.set(currentProps) // Apply saved properties 
            canvasEditor.add(processingIamge) //Add processed  image


            processingIamge.setCoords()

            canvasEditor.setActiveObject(processingIamge)
            canvasEditor.calcOffset()
            canvasEditor.requestRenderAll()

        } catch (error) {

            console.error("Error removing background:", error);
            toast.error("Failed to remove background. Please try again.");
        } finally {
            setProcessingMessage(null);
        }

    }
    /**
     * Applies the currently selected solid color as the canvas background.
     */
    const handleColorBackground = () => {
        if (!canvasEditor) return

        canvasEditor.backgroundColor = backgroundColor
        canvasEditor.requestRenderAll();
    }
    /**
     * Searches the Unsplash API for images based on the user's search query.
     * Updates the local state with the results or handles errors if the fetch fails.
     */
    const searchUnsplashImages = async () => {

        if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) return
        setIsSearching(true) // show loading state 
        try {
            const response = await fetch(
                `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`,
                {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to search images");

            const data = await response.json();
            setUnsplashImages(data.results || []);
        } catch (error) {
            console.error("Error searching Unsplash:", error);
            alert("Failed to search images. Please try again.");
        } finally {
            setIsSearching(false);
        }

    }

    console.log(unsplashImages)

    /**
     * Triggers the Unsplash image search when the user presses the 'Enter' key in the search input.
     * @param {KeyboardEvent} e - The key press event
     */
    const handleSearchKeyPress = (e) => {
        if (e.key === "Enter") {
            searchUnsplashImages();
        }
    }

    /**
     * Downloads a selected image from Unsplash and sets it as the canvas background.
     * Ensures proper scaling to cover the entire canvas area and triggers Unsplash's download tracking.
     * 
     * @param {string} imageUrl - The direct URL of the image to load
     * @param {string} imageId - The Unsplash image ID for tracking downloads
     */
    const handleImageBackground = async (imageUrl, imageId) => {

        setSelectedImageId(imageId)

        try {
            // Download and trigger Unsplash download endpoint (required by Unsplash API)
            if (UNSPLASH_ACCESS_KEY) {
                fetch(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                    },
                }).catch(() => { }); // Silent fail for download tracking
            }

            // Create fabric image from URL
            const fabricImage = await FabricImage.fromURL(imageUrl, {
                crossOrigin: "anonymous",
            });
            // USE PROJECT DIMENSIONS instead of canvas dimensions for proper scaling
            const canvasWidth = project.width; // Logical canvas width
            const canvasHeight = project.height; // Logical canvas height

            // Calculate scales
            const scaleX = canvasWidth / fabricImage.width;
            const scaleY = canvasHeight / fabricImage.height;

            const scale = Math.max(scaleX, scaleY);

            fabricImage.set({
                scaleX: scale,
                scaleY: scale,
                originX: "center",
                originY: "center",
                left: canvasWidth / 2, // Use project dimensions
                top: canvasHeight / 2, // Use project dimensions
            });

            // Set background and render
            canvasEditor.backgroundImage = fabricImage;
            canvasEditor.requestRenderAll();
            setSelectedImageId(null);



        } catch (error) {
            console.error("Error setting background image:", error);
            alert("Failed to set background image. Please try again.");
            setSelectedImageId(null);
        }

    }

    /**
     * Clears any currently set canvas background, removing both solid colors and background images.
     */
    const handleRemoveBackground = () => {
        if (!canvasEditor) return;

        // Clear both background color and image
        canvasEditor.backgroundColor = null;
        canvasEditor.backgroundImage = null;
        canvasEditor.requestRenderAll();

    }



    return (
        <div className="space-y-6 relative h-full">
            <div className="space-y-4 pb-4 border-b border-white/10">
                <div>
                    <h3 className="text-sm font-medium text-white mb-2">
                        AI Background Removal
                    </h3>
                    <p className="text-xs text-white/70 mb-4">
                        Automatically remove the background from your image using AI
                    </p>
                </div>

                <Button
                    onClick={handleRemoveBackground}
                    disabled={processingMessage || !getMainImage()}
                    className="w-full"
                    variant="primary"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Image Background
                </Button>

                {/* //show warning if  no image is available  */}
                {!getMainImage() && (
                    <p className='text-xs text-amber-400'>
                        please add an image to canvas first to remove its background
                    </p>
                )}
            </div>
            <Tabs defaultValue="color" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                    <TabsTrigger
                        value="color"
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                    >
                        <Palette className="h-4 w-4 mr-2" />
                        Color
                    </TabsTrigger>
                    <TabsTrigger
                        value="image"
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Image
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="color" className="space-y-4 mt-6">
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">
                            Solid Color Background
                        </h3>
                        <p className="text-xs text-white/70 mb-4">
                            Choose a solid color for your canvas background
                        </p>
                    </div>

                    <div className="space-y-4">
                        <HexColorPicker
                            color={backgroundColor}
                            onChange={setBackgroundColor}
                            style={{ width: "100%" }}
                        />

                        <div className="flex items-center gap-2">
                            <Input
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                placeholder="#ffffff"
                                className="flex-1 bg-slate-700 border-white/20 text-white"
                            />
                            <div
                                className="w-10 h-10 rounded border border-white/20"
                                style={{ backgroundColor }}
                            />
                        </div>

                        <Button
                            onClick={handleColorBackground}
                            className="w-full"
                            variant="primary"
                        >
                            <Palette className="h-4 w-4 mr-2" />
                            Apply Color
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 mt-6">
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">
                            Image Background
                        </h3>
                        <p className="text-xs text-white/70 mb-4">
                            Search and use high-quality images from Unsplash
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            placeholder="Search for backgrounds..."
                            className="flex-1 bg-slate-700 border-white/20 text-white"
                        />
                        <Button
                            onClick={searchUnsplashImages}
                            disabled={isSearching || !searchQuery.trim()}
                            variant="primary"
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {unsplashImages?.length > 0 && (
                        <div className='space-y-3'>
                            <h4 className='text-sm font-medium text-white'>
                                Search Results ({unsplashImages?.length})
                            </h4>

                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                {unsplashImages.map((image) => (
                                    <div key={image.id}
                                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400 transition-colors"
                                        onClick={() =>
                                            handleImageBackground(image.urls.regular, image.id)
                                        }
                                    >
                                        <img
                                            src={image.urls.small}
                                            alt={image.alt_description || "Background image"}
                                            className="w-full h-24 object-cover"
                                        />
                                        {/* Loading overlay */}
                                        {selectedImageId === image.id && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Download className="h-5 w-5 text-white" />
                                        </div>

                                        {/* Attribution */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                                            <p className="text-xs text-white/80 truncate">
                                                by {image.user.name}
                                            </p>
                                        </div>


                                    </div>


                                ))}
                            </div>
                        </div>


                    )}
                    {/* Empty state */}
                    {!isSearching && unsplashImages?.length === 0 && searchQuery && (
                        <div className="text-center py-8">
                            <ImageIcon className="h-12 w-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/70 text-sm">
                                No images found for "{searchQuery}"
                            </p>
                            <p className="text-white/50 text-xs">
                                Try a different search term
                            </p>
                        </div>
                    )}
                    {/* Initial state */}
                    {!searchQuery && unsplashImages?.length === 0 && (
                        <div className="text-center py-8">
                            <Search className="h-12 w-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/70 text-sm">
                                Search for background images
                            </p>
                            <p className="text-white/50 text-xs">Powered by Unsplash</p>
                        </div>
                    )}


                </TabsContent>

            </Tabs>
            <div className="pt-4 border-t border-white/10 bottom-0 w-full">
                <Button
                    onClick={handleRemoveBackground}
                    className="w-full"
                    variant="outline"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Canvas Background
                </Button>
            </div>


        </div >
    )
}

export default BackgroundControls