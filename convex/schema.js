import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        tokenIdentifier: v.string(),
        imageUrl: v.optional(v.string()),

        plan: v.union(v.literal("free"), v.literal("pro")),

        //Usage tracking plan limits
        projectsUsed: v.number(),
        exportsThisMonth: v.number(),

        createdAt: v.number(),
        updatedAt: v.number(),


    }).index("by_token", ["tokenIdentifier"])
        .index("by_email", ["email"])
        .searchIndex("search_name", { searchField: "name" }),//User Search 



    projects: defineTable({
        title: v.string(),
        userId: v.id("users"),


        //canvas dimension and state 
        canvasState: v.any(), //fabric.js canvas JSON (objects, layers, etc)
        width: v.number(),
        height: v.number(),

        //image pipline -tarcks image transformation 
        originalImageURL: v.optional(v.string()),
        currentImageURL: v.optional(v.string()),
        thumbnailURL: v.optional(v.string()),

        //imageKit 
        activeTransformation: v.optional(v.string()), //current imageKit URL params 

        //AI features state - tracks what AI PROCESSING HAS Been applied
        backgroundRemoved: v.optional(v.boolean()),//Has background been removed

        //organization
        folderId: v.optional(v.id("folders")), //optional folder

        //Timestamp 
        createdAt: v.number(),
        updatedAt: v.number(),


    }).index("by_user", ["userId"])
        .index("by_user_updatedAt", ["userId", "updatedAt"])
        .index("by_folder", ["folderId"]),


    folders: defineTable({
        name: v.string(),
        userId: v.id("users"),
        createdAt: v.number(),

    }).index("by_user", ["userId"])



    //     Plan limits Example 
    //     - free : 3 projects, 20 exports / month, basic features only
    // - pro Unlimited projects / exports, all AI features, priority support
});