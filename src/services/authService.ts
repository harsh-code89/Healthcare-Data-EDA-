// Simulated Backend for Authentication
// In a real production app, this would use fetch() to talk to an Express/Node backend,
// or use the Supabase/Firebase SDK. This local engine ensures zero-breakage on Vercel.

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
}

const USERS_DB_KEY = "vitelens-mock-users";

// Very basic string hashing to simulate secure password storage (DO NOT use in real production backend)
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// In-memory or localStorage based "database"
function getUsers(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(USERS_DB_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, any>) {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

export const authService = {
  async signUp(email: string, password: string, name: string): Promise<AuthSession> {
    await delay(800); // Simulate network
    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsers();

    if (users[normalizedEmail]) {
      throw new Error("An account with this email already exists.");
    }

    const newUser = {
      id: "usr_" + generateToken(),
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split("@")[0],
      passwordHash: hashString(password),
      createdAt: new Date().toISOString(),
    };

    users[normalizedEmail] = newUser;
    saveUsers(users);

    const token = "jwt_" + generateToken();
    return {
      user: { id: newUser.id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt },
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    };
  },

  async signIn(email: string, password: string): Promise<AuthSession> {
    await delay(600); // Simulate network
    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsers();
    const user = users[normalizedEmail];

    if (!user || user.passwordHash !== hashString(password)) {
      throw new Error("Invalid email or password.");
    }

    const token = "jwt_" + generateToken();
    return {
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };
  },

  async socialSignIn(provider: "google" | "github"): Promise<AuthSession> {
    await delay(1200); // Simulate OAuth redirect & callback
    const dummyEmail = `user@${provider}.demo.com`;
    const users = getUsers();
    
    let user = users[dummyEmail];
    if (!user) {
      user = {
        id: "usr_" + generateToken(),
        email: dummyEmail,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        passwordHash: hashString(generateToken()), // Random unguessable password
        createdAt: new Date().toISOString(),
      };
      users[dummyEmail] = user;
      saveUsers(users);
    }

    const token = "jwt_" + generateToken();
    return {
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };
  },

  async resetPasswordRequest(email: string): Promise<void> {
    await delay(800);
    // Always succeed to prevent email enumeration attacks
  },

  async verifyOTP(email: string, code: string): Promise<void> {
    await delay(500);
    if (code !== "123456") { // Hardcoded for demo
      throw new Error("Invalid verification code. Use 123456 for demo.");
    }
  },

  async changePassword(email: string, oldPassword: string, newPassword: string): Promise<void> {
    await delay(800);
    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsers();
    const user = users[normalizedEmail];

    if (!user || user.passwordHash !== hashString(oldPassword)) {
      throw new Error("Current password is incorrect.");
    }

    user.passwordHash = hashString(newPassword);
    saveUsers(users);
  },

  async updateProfile(email: string, newName: string): Promise<UserProfile> {
    await delay(500);
    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsers();
    const user = users[normalizedEmail];

    if (!user) throw new Error("User not found.");

    user.name = newName.trim();
    saveUsers(users);

    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  },
};
