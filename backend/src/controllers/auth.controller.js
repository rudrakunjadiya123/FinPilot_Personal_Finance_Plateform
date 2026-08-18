// ═══════════════════════════════════════════════════════════
// FINPILOT — Auth Controller
// Handlers for register, login, refresh, profile, export, etc.
// Enforces rules from SRS: Modules 1 & 15.
// ═══════════════════════════════════════════════════════════

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/db");
const redis = require("../config/redis");
const { AppError } = require("../middleware/errorHandler");
const { sendEmail } = require("../services/email.service");
const validators = require("../validators/auth.validator");

// Helper to generate access and refresh tokens
async function createAuthTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
  );

  // Generate an opaque random string for the refresh token
  const refreshToken = crypto.randomBytes(40).toString("hex");

  // Store in Redis with TTL matching JWT_REFRESH_EXPIRY (e.g., 7 days)
  // Converting '7d' logic to SECONDS. Defaulting to 7 days = 604800s.
  const ttl = 7 * 24 * 60 * 60; 
  await redis.set(`refresh:${userId}:${refreshToken}`, "valid", "EX", ttl);

  return { accessToken, refreshToken };
}

// ── Register ──────────────────────────────────────────────
async function register(req, res) {
  const data = validators.registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError("Email is already in use", 409, "EMAIL_IN_USE");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
  });

  const { accessToken, refreshToken } = await createAuthTokens(user.id);

  // Send refresh token as httpOnly cookie natively matching Login behavior
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });

  res.status(201).json({
    message: "Registration successful",
    accessToken,
    user: { id: user.id, name: user.name, email: user.email },
  });
}

// ── Login ─────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = validators.loginSchema.parse(req.body);

  // Use generic invalid credentials message as per SRS Edge Cases
  const invalidMessage = "Invalid credentials";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(invalidMessage, 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(invalidMessage, 401, "INVALID_CREDENTIALS");
  }

  const { accessToken, refreshToken } = await createAuthTokens(user.id);

  // Send refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });

  res.status(200).json({ accessToken });
}

// ── Refresh Token ─────────────────────────────────────────
async function refresh(req, res) {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401, "REFRESH_MISSING");
  }

  // To check validation, we'd need the userId. But we only have the token opaque string.
  // We can scan or, better pattern: Store as `refresh:{token}` => `userId` (Value is userId).
  // Let's look it up. Since our pattern above `refresh:{userId}:{refreshToken}` was used,
  // we actually don't know the userId here just from the request (it's expired, probably).
  // Workaround: We'll scan or rewrite how we save it. Let's lookup via key search.
  
  // Note: KEYS or SCAN is slow. Let's instead assume standard pattern is storing refreshToken as the key:
  // Key: `refresh_token:${refreshToken}` -> Value: `userId`
  const redisKey = `refresh_token:${refreshToken}`;
  const userId = await redis.get(redisKey);

  if (!userId) {
    throw new AppError("Invalid or expired refresh token", 401, "REFRESH_INVALID");
  }

  // Delete old refresh token (rotate)
  await redis.del(redisKey);
  
  // Create new tokens
  const newTokens = await createAuthTokens(userId);

  // Send new refresh token as httpOnly cookie
  res.cookie("refreshToken", newTokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ accessToken: newTokens.accessToken });
}

// Rewriting createAuthTokens to support the new lookup structure efficiently
async function createAuthTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const ttl = 7 * 24 * 60 * 60; 
  // Key = refreshToken, Value = userId
  await redis.set(`refresh_token:${refreshToken}`, userId, "EX", ttl);

  return { accessToken, refreshToken };
}

// ── Logout ────────────────────────────────────────────────
async function logout(req, res) {
  const refreshToken = req.cookies?.refreshToken;
  
  if (refreshToken) {
    await redis.del(`refresh_token:${refreshToken}`);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
}

// ── Get Profile ───────────────────────────────────────────
async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      name: true,
      email: true,
      currency: true,
      monthlyIncomeTarget: true,
      reminderDaysBefore: true,
      reminderEmailOn: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  res.status(200).json(user);
}

// ── Update Profile ────────────────────────────────────────
async function updateProfile(req, res) {
  const data = validators.updateProfileSchema.parse(req.body);

  const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      currency: true,
      monthlyIncomeTarget: true,
      reminderDaysBefore: true,
      reminderEmailOn: true,
    },
  });

  res.status(200).json(updatedUser);
}

// ── Request Password Reset ────────────────────────────────
async function requestPasswordReset(req, res) {
  const { email } = validators.requestPasswordResetSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Store in Redis with 1 hour TTL
    await redis.set(`pwreset:${hashedToken}`, user.id, "EX", 3600);

    const resetLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: "Finpilot - Password Reset Request",
      html: `<p>You requested a password reset. Click below to continue:</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>This link expires in 1 hour.</p>
             <p>If you didn't request this, ignore this email.</p>`,
    });
  }

  // Always return same generic response to prevent email enumeration
  res.status(200).json({ message: "If that email exists, we sent a password reset link." });
}

// ── Reset Password ────────────────────────────────────────
async function resetPassword(req, res) {
  const { token, newPassword } = validators.resetPasswordSchema.parse(req.body);

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const userId = await redis.get(`pwreset:${hashedToken}`);

  if (!userId) {
    throw new AppError("Invalid or expired reset token", 400, "INVALID_TOKEN");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Delete the reset token
  await redis.del(`pwreset:${hashedToken}`);
  
  // For security, ideally we'd also invalidate all existing refresh tokens here 
  // (would require indexing all refresh tokens by user, which is a bit more complex,
  // but acceptable as a future enhancement).

  res.status(200).json({ message: "Password reset successful" });
}

// ── Delete Account ────────────────────────────────────────
async function deleteAccount(req, res) {
  const userId = req.userId;

  // Prims cascade deletes handle related records (Loans, L/B, etc)
  await prisma.user.delete({
    where: { id: userId },
  });

  // Invalidate any dashboard caches
  await redis.keys(`cashflow:${userId}:*`).then(keys => keys.length && redis.del(keys));
  await redis.del(`networth:${userId}`);
  
  // Clear refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Account deleted successfully" });
}

// ── Export Data ───────────────────────────────────────────
async function exportData(req, res) {
  const userId = req.userId;

  const data = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      loans: { include: { emiSchedule: true } },
      lendBorrowRecords: { include: { repayments: true } },
      incomeEntries: true,
      chatSessions: { include: { messages: true } },
    }
  });

  if (!data) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  // Scrub password hash before exporting
  delete data.passwordHash;

  res.status(200).json(data);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  deleteAccount,
  exportData,
};
