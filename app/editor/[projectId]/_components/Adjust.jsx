"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { filters } from "fabric";
import { useCanvas } from "@/app/context/context";

/**
 * Filter configurations for image adjustments
 * Defines the range, defaults, and Fabric.js filter classes for each adjustment type
 */
const FILTER_CONFIGS = [
    {
        key: "brightness",
        label: "Brightness",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Brightness,
        valueKey: "brightness",
        // Fabric.js Brightness filter expects values between -1 and 1
        transform: (value) => value / 100,
    },
    {
        key: "contrast",
        label: "Contrast",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Contrast,
        valueKey: "contrast",
        // Fabric.js Contrast filter expects values between -1 and 1
        transform: (value) => value / 100,
    },
    {
        key: "saturation",
        label: "Saturation",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Saturation,
        valueKey: "saturation",
        // Fabric.js Saturation filter expects values between -1 and 1
        transform: (value) => value / 100,
    },
    {
        key: "vibrance",
        label: "Vibrance",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Vibrance,
        valueKey: "vibrance",
        // Fabric.js Vibrance filter expects values between -1 and 1
        transform: (value) => value / 100,
    },
    {
        key: "blur",
        label: "Blur",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Blur,
        valueKey: "blur",
        // Fabric.js Blur filter expects values between 0 and 1
        transform: (value) => value / 100,
    },
    {
        key: "hue",
        label: "Hue",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: 0,
        filterClass: filters.HueRotation,
        valueKey: "rotation",
        // Fabric.js HueRotation filter expects values in Radians
        transform: (value) => value * (Math.PI / 180),
        suffix: "°",
    },
];

/**
 * Default values object generated from FILTER_CONFIGS
 * Used for state initialization and filter resetting
 */
const DEFAULT_VALUES = FILTER_CONFIGS.reduce((acc, config) => {
    acc[config.key] = config.defaultValue;
    return acc;
}, {});

/**
 * AdjustControls Component
 * Provides a UI for adjusting image properties like brightness, contrast, etc.
 * Interacts with Fabric.js canvas to apply filters in real-time.
 */
export function AdjustControls() {
    // State to store current slider values
    const [filterValues, setFilterValues] = useState(DEFAULT_VALUES);
    // State to track if a filter application is currently in progress
    const [isApplying, setIsApplying] = useState(false);
    // Access the global canvas editor context
    const { canvasEditor } = useCanvas();

    /**
     * Finds the target image object on the canvas.
     * Prioritizes the active (selected) object if it's an image,
     * otherwise finds the first image object available.
     */
    const getActiveImage = () => {
        if (!canvasEditor) return null;
        const activeObject = canvasEditor.getActiveObject();
        // Check if currently selected object is an image
        if (activeObject && activeObject.type === "image") return activeObject;
        // If not, look for any image object on the canvas
        const objects = canvasEditor.getObjects();
        return objects.find((obj) => obj.type === "image") || null;
    };

    /**
     * Applies the current set of filter values to the active image object.
     * Uses Fabric.js filter classes defined in FILTER_CONFIGS.
     * @param {Object} newValues - The new filter values to apply
     */
    const applyFilters = async (newValues) => {
        const imageObject = getActiveImage();
        // Don't proceed if no image or if already processing
        if (!imageObject || isApplying) return;

        setIsApplying(true);

        try {
            const filtersToApply = [];

            // Iterate through configs and create Fabric filter instances for non-default values
            FILTER_CONFIGS.forEach((config) => {
                const value = newValues[config.key];
                // Only apply filter if it's different from the default (0/neutral)
                if (value !== config.defaultValue) {
                    const transformedValue = config.transform(value);
                    filtersToApply.push(
                        new config.filterClass({
                            [config.valueKey]: transformedValue,
                        })
                    );
                }
            });

            // Assign the constructed filters array to the image object
            imageObject.filters = filtersToApply;

            // Apply filters and re-render canvas
            await new Promise((resolve) => {
                imageObject.applyFilters();
                canvasEditor.requestRenderAll();
                // Brief delay to allow for processing and UI responsiveness
                setTimeout(resolve, 50);
            });
        } catch (error) {
            console.error("Error applying filters:", error);
        } finally {
            setIsApplying(false);
        }
    };

    /**
     * Handles slider value changes for a specific filter.
     * Updates local state and triggers filter application.
     * @param {string} filterKey - The key of the filter being changed
     * @param {number|number[]} value - The new value from the slider
     */
    const handleValueChange = (filterKey, value) => {
        const newValues = {
            ...filterValues,
            [filterKey]: Array.isArray(value) ? value[0] : value,
        };
        setFilterValues(newValues);
        applyFilters(newValues);
    };

    /**
     * Resets all filter values to their defaults and updates the image.
     */
    const resetFilters = () => {
        setFilterValues(DEFAULT_VALUES);
        applyFilters(DEFAULT_VALUES);
    };

    /**
     * Extracts current filter values from a Fabric.js image object.
     * Reverses the transformations to map back to slider ranges.
     * @param {fabric.Image} imageObject - The image object to extract filters from
     * @returns {Object} - Key-value pairs of extracted filter values
     */
    const extractFilterValues = (imageObject) => {
        if (!imageObject?.filters?.length) return DEFAULT_VALUES;

        const extractedValues = { ...DEFAULT_VALUES };

        imageObject.filters.forEach((filter) => {
            // Find the matching config for this filter instance
            const config = FILTER_CONFIGS.find(
                (c) => c.filterClass.name === filter.constructor.name
            );
            if (config) {
                const filterValue = filter[config.valueKey];
                // Special handling for Hue which is in Radians
                if (config.key === "hue") {
                    extractedValues[config.key] = Math.round(
                        filterValue * (180 / Math.PI)
                    );
                } else {
                    // Reverse the transform (value / 100)
                    extractedValues[config.key] = Math.round(filterValue * 100);
                }
            }
        });

        return extractedValues;
    };

    /**
     * Synchronize component state with the current image's filters
     * whenever the canvas editor or active object changes.
     */
    useEffect(() => {
        const imageObject = getActiveImage();
        if (imageObject?.filters) {
            const existingValues = extractFilterValues(imageObject);
            setFilterValues(existingValues);
        }
    }, [canvasEditor]);

    // Render empty state if canvas editor is not initialized
    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">
                    Load an image to start adjusting
                </p>
            </div>
        );
    }

    // Render empty state if no image is found on the canvas
    const activeImage = getActiveImage();
    if (!activeImage) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">
                    Select an image to adjust filters
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header section with title and Reset button */}
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-white">Image Adjustments</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-white/70 hover:text-white"
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            </div>

            {/* List of adjustment sliders generated from FILTER_CONFIGS */}
            {FILTER_CONFIGS.map((config) => (
                <div key={config.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm text-white">{config.label}</label>
                        <span className="text-xs text-white/70">
                            {filterValues[config.key]}
                            {config.suffix || ""}
                        </span>
                    </div>
                    <Slider
                        value={[filterValues[config.key]]}
                        onValueChange={(value) => handleValueChange(config.key, value)}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className="w-full"
                    />
                </div>
            ))}

            {/* User guidance info box */}
            <div className="mt-6 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-white/70">
                    Adjustments are applied in real-time. Use the Reset button to restore
                    original values.
                </p>
            </div>

            {/* Visual feedback during asynchronous filter processing */}
            {isApplying && (
                <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                    <span className="ml-2 text-xs text-white/70">
                        Applying filters...
                    </span>
                </div>
            )}
        </div>
    );
}