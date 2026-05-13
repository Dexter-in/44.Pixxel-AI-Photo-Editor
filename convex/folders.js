import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const getCurrentUser = async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
};

export const createFolder = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        
        return await ctx.db.insert("folders", {
            name: args.name,
            userId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const getFolders = query({
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];
        
        return await ctx.db.query("folders").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    },
});

export const renameFolder = mutation({
    args: { folderId: v.id("folders"), name: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        
        const folder = await ctx.db.get(args.folderId);
        if (!folder || folder.userId !== user._id) throw new Error("Access denied");
        
        await ctx.db.patch(args.folderId, { name: args.name, updatedAt: Date.now() });
        
        // Return the updated folder
        return await ctx.db.get(args.folderId);
    },
});

export const deleteFolder = mutation({
    args: { folderId: v.id("folders") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        
        const folder = await ctx.db.get(args.folderId);
        if (!folder || folder.userId !== user._id) throw new Error("Access denied");
        
        // Unassign projects from this folder
        const projects = await ctx.db.query("projects").withIndex("by_folder", (q) => q.eq("folderId", args.folderId)).collect();
        for (const project of projects) {
            await ctx.db.patch(project._id, { folderId: undefined });
        }
        
        await ctx.db.delete(args.folderId);
    },
});