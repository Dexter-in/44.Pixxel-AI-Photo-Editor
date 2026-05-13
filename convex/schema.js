import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        tokenIdentifier: v.string(),
        imageUrl: v.optional(v.string()),

        plan: v.union(v.literal("free"), v.literal("pro")),

        // Usage tracking plan limits
        projectsUsed: v.number(),
        exportsThisMonth: v.number(),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_token", ["tokenIdentifier"])
        .index("by_email", ["email"])
        .searchIndex("search_name", { searchField: "name" }),

    projects: defineTable({
        title: v.string(),
        userId: v.id("users"),

        // canvas dimension and state
        canvasState: v.any(), // fabric.js canvas JSON
        width: v.number(),
        height: v.number(),

        // image pipeline - tracks image transformation
        originalImageURL: v.optional(v.string()),
        currentImageURL: v.optional(v.string()),
        thumbnailURL: v.optional(v.string()),

        // imageKit
        activeTransformation: v.optional(v.string()),

        // AI features state
        backgroundRemoved: v.optional(v.boolean()),

        // organization
        folderId: v.optional(v.id("folders")),

        // Timestamp
        createdAt: v.number(),
        updatedAt: v.number(),

        
    })
        .index("by_user", ["userId"])
        .index("by_user_updatedAt", ["userId", "updatedAt"])
        .index("by_folder", ["folderId"]),



folders: defineTable({
  name: v.string(),
  userId: v.id("users"),
  icon: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  isFavorite: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
});