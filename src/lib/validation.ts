import { NextRequest } from "next/server";

// Input validation utilities
export function validateSearchParam(search: string | null): string {
  if (!search) return "";
  
  // Remove potentially dangerous characters and limit length
  const sanitized = search
    .replace(/[<>\"'&]/g, "") // Remove HTML/script injection characters
    .trim()
    .substring(0, 100); // Limit length
  
  return sanitized;
}

export function validatePageParam(page: string | null): number {
  if (!page) return 1;
  
  const parsed = parseInt(page, 10);
  if (isNaN(parsed) || parsed < 1) return 1;
  if (parsed > 1000) return 1000; // Reasonable upper limit
  
  return parsed;
}

export function validateLimitParam(limit: string | null): number {
  if (!limit) return 10000; // Default to show all channels
  
  const parsed = parseInt(limit, 10);
  if (isNaN(parsed) || parsed < 1) return 10000;
  if (parsed > 100000) return 100000; // Very high upper limit to effectively show all
  
  return parsed;
}

export function validateCategoryId(categoryId: string): boolean {
  // Allow only alphanumeric characters and hyphens
  const validPattern = /^[a-zA-Z0-9-]+$/;
  return validPattern.test(categoryId) && categoryId.length <= 50;
}

export function validateCountryCode(countryCode: string): boolean {
  // Allow only lowercase letters, 2-3 characters
  const validPattern = /^[a-z]{2,3}$/;
  return validPattern.test(countryCode);
}

export function validateLanguageCode(languageCode: string): boolean {
  // Allow only lowercase letters, 2-4 characters
  const validPattern = /^[a-z]{2,4}$/;
  return validPattern.test(languageCode);
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  // Get IP from headers (Next.js doesn't expose request.ip in serverless)
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const now = Date.now();
  
  const current = rateLimitMap.get(ip);
  
  // If no record or the window has expired, reset the counter
  if (!current || now - current.resetTime >= windowMs) {
    rateLimitMap.set(ip, { count: 1, resetTime: now });
    return true;
  }
  
  // Check if limit exceeded
  if (current.count >= limit) {
    return false;
  }
  
  // Increment counter
  current.count++;
  return true;
}

// CORS headers
export function addCorsHeaders(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

// Security headers
export function addSecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}
