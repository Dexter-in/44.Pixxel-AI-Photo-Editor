
// Import Fabric.js filters for image processing
import { filters } from 'fabric';
// Import React and the useState hook for local state management
import React, { useState } from 'react'
// Import the custom Button component from the UI library
import { Button } from '@/components/ui/button'
// Import the RotateCcw icon from Lucide React for the reset functionality
import { RotateCcw } from 'lucide-react';
// Import the custom Slider component for adjustment controls
import { Slider } from '@/components/ui/slider';
// Import the useCanvas hook to access the shared canvas editor instance
import { useCanvas } from '@/app/context/context';

/**
 * Configuration array for all available image filters.
 * Each object defines the UI behavior and how it maps to Fabric.js filters.
 */
const FILTER_CONFIGS = [
    {
        key: "brightness", // Unique identifier for state
        label: "Brightness", // Display label in UI
        min: -100, // Minimum slider value
        max: 100, // Maximum slider value
        step: 1, // Slider increment step
        defaultValue: 0, // Default value when reset
        filterClass: filters.Brightness, // The corresponding Fabric.js filter class
        valueKey: "brightness", // The property name expected by the Fabric filter
        transform: (value) => value / 100, // Function to convert UI value to Fabric value
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
        transform: (value) => value * (Math.PI / 180), // Convert degrees to radians
        suffix: "°", // Units displayed next to the value
    },
];

/**
 * Utility to generate an object containing all filters set to their default values.
 */
const DEFAULT_VALUES = FILTER_CONFIGS.reduce((acc, config) => {
    acc[config.key] = config.defaultValue
    return acc

}, {})

/**
 * AdjustControls Component: Provides a UI for adjusting image properties on the canvas.
 */
const AdjustControls = () => {
    // State to track the current value of each filter
    const [filterValues, setFilterValues] = useState(DEFAULT_VALUES);
    // State to track if a filter application is currently in progress (prevents UI lag)
    const [isApplying, setIsApplying] = useState(false);
    // Access the global canvas editor instance from context
    const { canvasEditor } = useCanvas();

    /**
     * Helper to find which image on the canvas should be edited.
     * Prioritizes the active (selected) object, falls back to the first image found.
     */
    const getActiveImage = () => {
        // Return null if the canvas editor hasn't initialized
        if (!canvasEditor) return null;
        // Get the object currently selected by the user
        const activeObject = canvasEditor.getActiveObject();

        // If an image is selected, return it directly
        if (activeObject && activeObject.type === "image") return activeObject

        // Fallback: look through all objects on the canvas for any image
        const objects = canvasEditor.getObjects();
        return objects.find((obj) => obj.type === "image") || null;
    }


    /**
     * Applies the current filter settings to the target image on the canvas.
     * @param {Object} newValues - The updated filter values to apply.
     */
    const applyFilters = async (newValues) => {
        // Determine which image to apply filters to 
        const imageObject = getActiveImage()
        // If no image is available or a filter is already being processed, stop here
        if (!imageObject || isApplying) return

        // Set loading state to prevent concurrent applications
        setIsApplying(true)

        try {
            // Array to hold the new Fabric filter instances
            const filtersToApply = []

            // Iterate through our filter configurations to build the filter array
            FILTER_CONFIGS.forEach((config) => {
                const value = newValues[config.key]

                // Only create and add filters that aren't at their default value
                if (value !== config.defaultValue) {
                    const transformedValue = config.transform(value)
                    filtersToApply.push(
                        new config.filterClass({
                            [config.valueKey]: transformedValue
                        })
                    )
                }
            })

            // Update the image object's internal filters array
            imageObject.filters = filtersToApply

            // Wait for the filters to be processed and the canvas to re-render
            await new Promise((resolve) => {
                imageObject.applyFilters() // Core Fabric.js method to process pixels
                canvasEditor.renderAll()   // Refresh the visual canvas display
                setTimeout(resolve, 50)    // Small delay to ensure browser paints
            })

        } catch (error) {
            // Log any errors that occur during the image processing
            console.error("Error applying filters", error)
        } finally {
            // Always reset the applying state, even on error
            setIsApplying(false)
        }

    }




    /**
     * Event handler for when a slider value changes.
     * @param {string} filterKey - The key of the filter being adjusted.
     * @param {number|number[]} value - The new value from the slider.
     */
    const handleValueChange = (filterKey, value) => {
        // Combine the updated value with existing filter state
        const newValue = {
            ...filterValues,
            [filterKey]: Array.isArray(value) ? value[0] : value
        }

        // Update local React state to refresh the UI
        setFilterValues(newValue);
        // Trigger the canvas update with the new values
        applyFilters(newValue)
    }

    /**
     * Resets all filters back to their initial default values.
     */
    const resetFilters = () => {
        setFilterValues(DEFAULT_VALUES)
        applyFilters(DEFAULT_VALUES)
    }








    return (
        <div className='space-y-6'>
            {/* Header section with title and Reset button */}
            <div className='flex justify-between items-center'>
                <h3 className='text-sm font-medium text-white'>Image Adjustments</h3>
                <Button
                    variant='ghost'
                    size='sm'
                    onClick={resetFilters}
                    className="text-white/70 hover:text-white"
                >
                    <RotateCcw className='h-4 w-4 mr-2' />
                    Reset
                </Button>
            </div>

            {/* Render a control block for every configured filter */}
            {FILTER_CONFIGS.map((config) => (
                <div key={config.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                        {/* Label for the filter */}
                        <label className="text-sm text-white">{config.label}</label>
                        {/* Current value display with optional suffix */}
                        <span className='text-xs text-white/70'>
                            {filterValues[config.key]}
                            {config.suffix || ""}
                        </span>
                    </div>
                    {/* UI Slider for real-time adjustments */}
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

            {/* Static informational footer */}
            <div className="mt-6 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-white/70">
                    Adjustments are applied in real-time. Use the Reset button to restore
                    original values.
                </p>
            </div>

            {/* Visual spinner shown only while filters are processing */}
            {isApplying && (
                <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                    <span className="ml-2 text-xs text-white/70">
                        Applying filters...
                    </span>
                </div>
            )}

        </div>
    )
}

export default AdjustControls
