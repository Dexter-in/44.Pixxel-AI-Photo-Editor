"use client";

import { useParallax } from "./hooks/use-parallal";



export const FloatingShapes = () => {
    const scrollY = useParallax();

    const shapes = [
        {
            id: 1,
            size: "w-72 h-72",
            position: "top-20 left-10",
            gradient: "from-rose-500 to-orange-400",
        },
        {
            id: 2,
            size: "w-96 h-96",
            position: "top-1/3 right-10",
            gradient: "from-violet-600 to-indigo-500",
        },
        {
            id: 3,
            size: "w-64 h-64",
            position: "bottom-20 left-1/4",
            gradient: "from-amber-400 to-rose-500",
        },
        {
            id: 4,
            size: "w-80 h-80",
            position: "bottom-1/3 right-1/4",
            gradient: "from-teal-400 to-emerald-500",
        },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {shapes.map((shape) => (
                <div
                    key={shape.id}
                    className={`absolute ${shape.size} ${shape.position} bg-gradient-to-r ${shape.gradient} rounded-full blur-3xl opacity-20 animate-pulse`}
                    style={{
                        transform: `translateY(${scrollY * 0.5}px) rotate(${scrollY * 0.1}deg)`,
                    }}
                />
            ))}
        </div>
    );
};