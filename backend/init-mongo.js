// MongoDB initialization script for ACODE LAB
// This script runs when the MongoDB container starts for the first time

// Switch to the ACODE LAB database
db = db.getSiblingDB('acode_lab');

// Create collections with validation
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["email", "username", "hashed_password", "user_type"],
            properties: {
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                username: {
                    bsonType: "string",
                    minLength: 3,
                    maxLength: 50
                },
                hashed_password: {
                    bsonType: "string"
                },
                user_type: {
                    enum: ["user", "company", "admin"]
                }
            }
        }
    }
});

db.createCollection('posts', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["author_id", "content", "post_type", "created_at"],
            properties: {
                author_id: {
                    bsonType: "objectId"
                },
                content: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 5000
                },
                post_type: {
                    enum: ["text", "project", "achievement"]
                },
                created_at: {
                    bsonType: "date"
                }
            }
        }
    }
});

db.createCollection('store_items', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "description", "price", "item_type"],
            properties: {
                name: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 100
                },
                price: {
                    bsonType: "int",
                    minimum: 0
                },
                item_type: {
                    enum: ["badge", "theme", "feature", "boost"]
                }
            }
        }
    }
});

db.createCollection('jobs', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["title", "description", "company_id", "created_at"],
            properties: {
                title: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 200
                },
                description: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 5000
                },
                company_id: {
                    bsonType: "objectId"
                },
                created_at: {
                    bsonType: "date"
                }
            }
        }
    }
});

db.createCollection('articles', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["title", "content", "author_id", "category", "created_at"],
            properties: {
                title: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 200
                },
                content: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 10000
                },
                author_id: {
                    bsonType: "objectId"
                },
                category: {
                    enum: ["programming", "design", "business", "tutorial", "news"]
                },
                created_at: {
                    bsonType: "date"
                }
            }
        }
    }
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.posts.createIndex({ "author_id": 1, "created_at": -1 });
db.posts.createIndex({ "created_at": -1 });
db.store_items.createIndex({ "item_type": 1 });
db.jobs.createIndex({ "company_id": 1, "created_at": -1 });
db.jobs.createIndex({ "created_at": -1 });
db.articles.createIndex({ "author_id": 1, "created_at": -1 });
db.articles.createIndex({ "category": 1, "created_at": -1 });
db.articles.createIndex({ "created_at": -1 });

// Create admin user if it doesn't exist
const adminUser = db.users.findOne({ "email": "admin@acodelab.com" });
if (!adminUser) {
    db.users.insertOne({
        email: "admin@acodelab.com",
        username: "admin",
        hashed_password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5wJmC", // admin123
        user_type: "admin",
        first_name: "Admin",
        last_name: "User",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        profile: {
            bio: "System Administrator",
            avatar_url: null,
            location: null,
            website: null
        },
        stats: {
            points: 1000,
            posts_count: 0,
            followers_count: 0,
            following_count: 0
        }
    });
    print("Admin user created successfully");
}

// Create sample store items if they don't exist
const storeItemsCount = db.store_items.countDocuments();
if (storeItemsCount === 0) {
    const sampleItems = [
        {
            name: "Premium Badge",
            description: "Exclusive badge to show your premium status",
            price: 100,
            item_type: "badge",
            image_url: null,
            effects: {
                points_bonus: 10,
                visibility_boost: 1.2
            },
            requirements: {
                min_level: 5,
                min_posts: 10
            },
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            name: "Dark Theme",
            description: "Elegant dark theme for your profile",
            price: 50,
            item_type: "theme",
            image_url: null,
            effects: {
                profile_customization: true
            },
            requirements: {
                min_level: 2,
                min_posts: 5
            },
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            name: "Post Boost",
            description: "Boost your post visibility for 24 hours",
            price: 25,
            item_type: "boost",
            image_url: null,
            effects: {
                visibility_boost: 2.0,
                duration_hours: 24
            },
            requirements: {
                min_level: 1,
                min_posts: 1
            },
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        }
    ];
    
    db.store_items.insertMany(sampleItems);
    print("Sample store items created successfully");
}

print("MongoDB initialization completed successfully!");
