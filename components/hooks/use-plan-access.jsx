import { useAuth } from '@clerk/nextjs'
import React from 'react'

export default function usePlanAccess() {

    const { has } = useAuth();
    // check if user has pro plan. We must CALL the function.
    const isPro = has?.({ plan: "pro" }) || false;
    // check if user has free plan
    const isFree = !isPro;



    const planAccess = {

        //freee plan Tools
        resize: true,
        crop: true,
        adjust: true,
        text: true,

        //pro plan tools
        background: isPro,
        ai_extender: isPro,
        ai_edit: isPro
    }
    //helper function to check user has access to a specific tool

    const hasAccess = (toolId) => {
        return planAccess[toolId] === true;
    }

    //helper function to get restricted tools
    const getRestrictedTools = () => {
        return Object.entries(planAccess)
            .filter(([_, access]) => !access)
            .map(([toolId]) => toolId)
    }

    //helper function to check if user has reached the free plan limit
    const canCreateProject = (currentProjectCount) => {
        if (isPro) return true;
        return currentProjectCount < 3; //free plan limit is 3 projects
    }

    //helper function to check if user has reached the free export limit
    const canExport = (currentExportCount) => {
        if (isPro) return true;
        return currentExportCount < 20; //free plan limit is 10 exports
    }


    return {
        userPlan: isPro ? "pro" : "free_user",
        isPro,
        isFree,
        hasAccess,
        getRestrictedTools,
        canCreateProject,
        canExport,
        planAccess
    }

}

