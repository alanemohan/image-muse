import Database from "better-sqlite3";

const db = new Database("./data.db", { readonly: true });

console.log("📊 SQLite Database Summary\n");

// Check users
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
console.log(`👥 Users: ${userCount.count}`);

if (userCount.count > 0) {
  const users = db.prepare("SELECT id, email, full_name, is_admin, created_at FROM users").all();
  console.log("\nUser List:");
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.full_name || 'No name'}) ${user.is_admin ? '👑 ADMIN' : ''}`);
    console.log(`    Created: ${user.created_at}`);
  });
}

// Check images
const imageCount = db.prepare("SELECT COUNT(*) as count FROM images").get();
console.log(`\n🖼️  Images: ${imageCount.count}`);

if (imageCount.count > 0) {
  const images = db.prepare("SELECT id, name, title, created_at FROM images LIMIT 5").all();
  console.log("\nRecent Images:");
  images.forEach(img => {
    console.log(`  - ${img.title || img.name}`);
    console.log(`    ID: ${img.id}`);
  });
}

// Check favorites
const favCount = db.prepare("SELECT COUNT(*) as count FROM favorites").get();
console.log(`\n❤️  Favorites: ${favCount.count}`);

// Check settings
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM user_settings").get();
console.log(`⚙️  User Settings: ${settingsCount.count}`);

// Check AI logs
const logCount = db.prepare("SELECT COUNT(*) as count FROM ai_logs").get();
console.log(`📝 AI Logs: ${logCount.count}`);

db.close();
console.log("\n✅ Database check complete!");
