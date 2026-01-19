export const LANGUAGES = [
  { id: "html", label: "HTML/Web", ext: "html" },
  { id: "javascript", label: "JavaScript", ext: "js" },
  { id: "typescript", label: "TypeScript", ext: "ts" },
  { id: "css", label: "CSS", ext: "css" },
  { id: "python", label: "Python", ext: "py" },
  { id: "json", label: "JSON", ext: "json" },
  { id: "sql", label: "SQL", ext: "sql" },
];

export const TEMPLATES: Record<string, string> = {
  // 1. HTML: Giao diện Glassmorphism hiện đại + Tailwind Animation
  html: `<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
  
  <div class="relative group w-full max-w-md">
    <div class="absolute -inset-1 bg-gradient-to-r from-pink-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
    
    <div class="relative px-7 py-6 bg-slate-900 ring-1 ring-gray-900/5 rounded-xl leading-none flex items-top justify-start space-x-6">
      
      <div class="space-y-2">
        <p class="text-slate-100 font-medium text-lg">System Notification</p>
        <p class="text-slate-400 text-sm">
          A new update is available for your dashboard.
          <br/>Version <span class="text-pink-400 font-mono">v4.0.2</span>
        </p>
        
        <div class="pt-6 flex gap-4">
          <button class="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 hover:shadow-indigo-500/40 active:scale-95">
            Update Now
          </button>
          
          <button class="px-6 py-2 rounded-full text-slate-400 text-sm font-semibold hover:text-white transition-colors">
            Dismiss
          </button>
        </div>
      </div>
      
    </div>
  </div>
</div>`,

  // 2. JS: Giả lập quá trình khởi động Server (Showcase Console xịn)
  javascript: `// 🚀 System Boot Sequence Simulation
// Click "Run" to see the logs in action!

const systemCheck = async () => {
  console.log("INITIALIZING SYSTEM...");
  
  // Helper for delay
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  await wait(800);
  console.log("› CPU Cores: ", 8);
  console.log("› Memory: ", "16GB");
  
  await wait(800);
  console.warn("⚠️ Warning: Temperature sensors calibrating...");
  
  await wait(1000);
  const services = [
    { name: "Auth Service", status: "OK", pid: 4021 },
    { name: "Database", status: "OK", pid: 4022 },
    { name: "Firewall", status: "ACTIVE", pid: 4024 }
  ];
  
  console.log("Starting Services...");
  console.log(services); // Check out the object highlighting!

  await wait(1200);
  // console.error("❌ Error: Payment Gateway connection timeout (Simulation)");
  
  await wait(800);
  console.log("✅ SYSTEM READY. Welcome back, Admin.");
};

systemCheck();`,

  // 3. TS: Interface ví dụ thực tế
  typescript: `// TypeScript Interface Example

interface UserProfile {
  id: string;
  username: string;
  roles: ('admin' | 'editor' | 'viewer')[];
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
  };
  lastLogin?: Date;
}

const currentUser: UserProfile = {
  id: "USR-8821",
  username: "neo_anderson",
  roles: ['admin'],
  settings: {
    theme: 'dark',
    notifications: true
  }
};

console.log("Current User Profile:");
console.log(currentUser);

// Try hovering over 'currentUser' properties!`,

  // 4. CSS: Hiệu ứng Neon Button
  css: `/* ✨ Neon Button Effect */

body {
  background: #0f172a;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: 'Inter', sans-serif;
}

.neon-btn {
  font-size: 24px;
  font-weight: bold;
  color: #0ff;
  background: transparent;
  border: 4px solid #0ff;
  padding: 1rem 2rem;
  border-radius: 10px;
  text-transform: uppercase;
  text-shadow: 0 0 10px #0ff;
  box-shadow: 0 0 20px #0ff, inset 0 0 20px #0ff;
  cursor: pointer;
  transition: 0.3s;
}

.neon-btn:hover {
  background: #0ff;
  color: #000;
  box-shadow: 0 0 50px #0ff, inset 0 0 20px #0ff;
}`,

  // 5. JSON: Config giả lập
  json: `{
  "app_name": "OverDesk Dashboard",
  "version": "2.5.0",
  "author": {
    "name": "Developer",
    "github": "@dev"
  },
  "features_enabled": {
    "dark_mode": true,
    "beta_access": false,
    "max_upload_size_mb": 50
  },
  "theme_colors": ["#1e293b", "#3b82f6", "#ef4444"]
}`,

  // 6. Python: Data Processing
  python: `# Data Processing Example

users = [
    {"name": "Alice", "role": "Admin", "score": 88},
    {"name": "Bob",   "role": "User",  "score": 42},
    {"name": "Eve",   "role": "User",  "score": 95}
]

# Find high scorers
high_scorers = [u["name"] for u in users if u["score"] > 80]

print(f"Total Users: {len(users)}")
print(f"High Scorers: {high_scorers}")

def calculate_average(data):
    total = sum(u["score"] for u in data)
    return total / len(data)

print(f"Average Score: {calculate_average(users):.2f}")`,

  // 7. SQL: Query phức tạp hơn chút
  sql: `-- Analyze User Activity

SELECT 
    u.username,
    COUNT(o.order_id) as total_orders,
    SUM(o.amount) as total_spent,
    MAX(o.order_date) as last_order
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.username
HAVING total_spent > 1000
ORDER BY total_spent DESC;`,
};
