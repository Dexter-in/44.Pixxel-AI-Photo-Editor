"use client" // Marks this as a Client Component for Next.js

/**
 * NEW PROJECT MODAL COMPONENT
 * This component handles the creation of new projects, including image uploads and title assignment.
 * It also manages plan-based restrictions and project limits.
 */

// Import hook to check user's plan status (Free vs. Pro) and creation permissions
import usePlanAccess from '@/components/hooks/use-plan-access';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge';
import React, { useState } from 'react'
import { api } from '@/convex/_generated/api';
import { useConvexQuery, useConvexQueryMutation } from '@/components/hooks/use-convex-query';
import { Crown, ImageIcon, Loader2, Upload, X, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
import { UpgradeModal } from '@/components/upgrade-model';



/**
 * fileToBase64: Helper to convert a File object to a base64 string
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * getImageDimensions: Helper to get width and height of an image file
 */
const getImageDimensions = (file) => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };
        img.src = url;
    });
};

const NewProjectModal = ({ isOpen, onClose }) => {
    const [projectTitle, setProjectTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showUpgradeModal, setShowUpgradeModel] = useState(false);

    const handleClose = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setProjectTitle("")
        setIsUploading(false)
        onClose()
    }

    const { isFree, canCreateProject } = usePlanAccess();
    const router = useRouter();
    const { data: projects } = useConvexQuery(api.projects.getUserProjects);
    const { mutate: createProject } = useConvexQueryMutation(api.projects.create);

    const currentProjectCount = projects?.length || 0;
    const canCreate = canCreateProject(currentProjectCount);

    const handleCreateProject = async () => {
        if (!canCreate) {
            setShowUpgradeModel(true)
            return;
        }

        if (!selectedFile || !projectTitle.trim()) {
            toast.error("Please upload an image and enter a project title")
            return;
        }

        setIsUploading(true)

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("FileName", selectedFile.name);

            const response = await fetch("/api/imagekit/upload", {
                method: "POST",
                body: formData,
            });

            const uploadData = await response.json();

            if (!uploadData.success) {
                throw new Error(uploadData.error || "Upload failed");
            }
            // Create project in Convex

            const projectId = await createProject({
                title: projectTitle.trim(),
                originalImageURL: uploadData.url,
                currentImageURL: uploadData.url,
                thumbnailURL: uploadData.thumbnailUrl,
                width: uploadData.width || 800,
                height: uploadData.height || 600,
                canvasState: null,
            })



            toast.success("Project created successfully!");

            router.push(`/editor/${projectId}`)

        } catch (error) {
            console.error("Error creating project:", error);
            toast.error("Failed to create project");
        } finally {
            setIsUploading(false);
        }

    }

    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            setProjectTitle(nameWithoutExt || "Untitled Project");
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
        },
        maxFiles: 1,
        maxSize: 20 * 1024 * 1024,
    });

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        {isFree && (
                            <Badge variant="secondary" className="bg-slate-700 text-white/70">
                                {currentProjectCount}/3 projects
                            </Badge>
                        )}
                    </DialogHeader>

                    <div className='space-y-6'>
                        {isFree && currentProjectCount === 2 && (
                            <Alert className='bg-amber-500/10 border-amber-500/20'>
                                <Crown className='h-5 w-5 text-amber-400' />
                                <AlertDescription>
                                    <div className='font-semibold text-amber-400 mb-1'>
                                        {currentProjectCount === 2 ? "Last Free Project" : "Project Limit Reached"}
                                    </div>
                                    {currentProjectCount === 2
                                        ? "This will be your last free project. Upgrade to Pixxel Pro for unlimited projects."
                                        : "Free plan is limited to 3 projects. Upgrade to Pixxel Pro to create more projects."}
                                </AlertDescription>
                            </Alert>
                        )}

                        {!selectedFile ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive
                                    ? "border-cyan-400 bg-cyan-400/5"
                                    : "border-white/20 hover:border-white/40"
                                    } ${!canCreate ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="h-12 w-12 text-white/50 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {isDragActive ? "Drop your image here" : "Upload an Image"}
                                </h3>
                                <p className="text-white/70 mb-4">
                                    {canCreate
                                        ? "Drag and drop your image, or click to browse"
                                        : "Upgrade to Pro to create more projects"}
                                </p>
                                <p className="text-sm text-white/50">
                                    Supports PNG, JPG, WEBP up to 20MB
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-6'>
                                <div className='relative'>
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-64 object-cover rounded-xl border border-white/10"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            setProjectTitle("");
                                        }}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project-title" className="text-white">
                                        Project Title
                                    </Label>
                                    <Input
                                        id="project-title"
                                        type="text"
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        placeholder="Enter project name..."
                                        className="bg-slate-700 border-white/20 text-white placeholder-white/50 focus:border-cyan-400 focus:ring-cyan-400"
                                    />
                                </div>

                                <div className="bg-slate-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <ImageIcon className="h-5 w-5 text-cyan-400" />
                                        <div>
                                            <p className="text-white font-medium">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-white/70 text-sm">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isUploading}
                            className="text-white/70 hover:text-white"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleCreateProject}
                            disabled={!selectedFile || !projectTitle.trim() || isUploading}
                            variant="primary"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Project"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModel(false)}
                restrictedTool="projects"
                reason="Free plan is limited to 3 projects. Upgrade to Pro for unlimited projects and access to all AI editing tools."
            />
        </>

    );
};

export default NewProjectModal;