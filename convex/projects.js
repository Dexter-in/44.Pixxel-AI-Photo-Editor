import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// create project
export const create = mutation({
    // passing arguments
     args: {
        title: v.string(),
        originalImageURL: v.optional(v.string()),
        currentImageURL: v.optional(v.string()),
        thumbnailURL: v.optional(v.string()),
        width: v.number(),
        height: v.number(),
        canvasState: v.optional(v.any()),
        folderId: v.optional(v.id("folders")), // Add this
    },
    handler: async (ctx, args) => {
        // FIXED: Replaced ctx.runQuery (not allowed in handlers) with direct DB lookup
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        if (user.plan === "free") {
            const projectCount = await ctx.db
                .query("projects") // FIXED: Pluralized table name to match schema
                .withIndex('by_user', (q) => q.eq("userId", user._id)) // FIXED: Use user._id instead of user.id
                .collect();

            if (projectCount.length >= 3) {
                throw new Error("Free users can only have 3 projects. Upgrade to premium");
            }
        }

        // FIXED: Assigned insertion to variable to prevent unreachable code below
        const projectId = await ctx.db.insert("projects", {
            title: args.title,
            userId: user._id,
            originalImageURL: args.originalImageURL,
            currentImageURL: args.currentImageURL,
            thumbnailURL: args.thumbnailURL,
            width: args.width,
            height: args.height,
            canvasState: args.canvasState,
            folderId: args.folderId, // Add this
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // FIXED: This code is now reachable because we removed the 'return' from the insert call above
        await ctx.db.patch(user._id, {
            projectsUsed: user.projectsUsed + 1,
            updatedAt: Date.now(),
        });

        return projectId;
    }
})

export const getProjectsByFolder = query({
    args: { folderId: v.optional(v.id("folders")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        
        const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
        if (!user) return [];
        
        if (!args.folderId) {
            return await ctx.db.query("projects").withIndex("by_user_updatedAt", (q) => q.eq("userId", user._id)).order("desc").collect();
        }
        
        const folder = await ctx.db.get(args.folderId);
        if (!folder || folder.userId !== user._id) return [];
        
        return await ctx.db.query("projects").withIndex("by_folder", (q) => q.eq("folderId", args.folderId)).collect();
    },
});

// getting user projects
export const getUserProjects = query({
    handler: async (ctx) => {
        // FIXED: Replaced invalid ctx.runQuery with direct DB lookup
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const projects = await ctx.db
            .query("projects") // FIXED: Pluralized table name
            .withIndex("by_user_updatedAt", (q) => q.eq("userId", user._id)) // FIXED: Matched index name and used user._id
            .order("desc")
            .collect();

        return projects;
    },
})

// deleting the projects 
export const deleteProject = mutation({
    args: {
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const project = await ctx.db.get(args.projectId);
        if (!project || project.userId !== user._id) {
            throw new Error("Unauthorized or project not found");
        }

        await ctx.db.delete(args.projectId);

        await ctx.db.patch(user._id, {
            projectsUsed: Math.max(0, user.projectsUsed - 1),
            updatedAt: Date.now(),
        });
    },
});

// getting single project
export const getProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        const project = await ctx.db.get(args.projectId);

        if (!project || !user || project.userId !== user._id) {
            return null;
        }

        return project;
    },
});

// updating the project
export const updateProject = mutation({
    args: {
        projectId: v.id("projects"),
        canvasState: v.optional(v.any()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        currentImageURL: v.optional(v.string()),
        thumbnailURL: v.optional(v.string()),
        activeTransformation: v.optional(v.string()),
        backgroundRemoved: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        const project = await ctx.db.get(args.projectId);

        if (!project) {
            throw new Error("project not found");
        }

        if (!user || project.userId !== user._id) {
            throw new Error("Access Denied");
        }

        const updateData = {
            updatedAt: Date.now(),
        };

        if (args.canvasState !== undefined) {
            updateData.canvasState = args.canvasState;
        }
        if (args.width !== undefined) {
            updateData.width = args.width;
        }
        if (args.height !== undefined) {
            updateData.height = args.height;
        }
        if (args.currentImageURL !== undefined) {
            updateData.currentImageURL = args.currentImageURL;
        }
        if (args.thumbnailURL !== undefined) {
            updateData.thumbnailURL = args.thumbnailURL;
        }
        if (args.activeTransformation !== undefined) {
            updateData.activeTransformation = args.activeTransformation;
        }
        if (args.backgroundRemoved !== undefined) {
            updateData.backgroundRemoved = args.backgroundRemoved;
        }

        await ctx.db.patch(args.projectId, updateData);

        return args.projectId;
    },

    

    
});