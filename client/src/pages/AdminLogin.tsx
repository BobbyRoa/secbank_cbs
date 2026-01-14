import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

/**
 * Secbank Admin Login Page - Swiss Banking Minimalism Design
 * 
 * Design Philosophy:
 * - Split-screen layout: Left side for branding, right side for login form
 * - Deep Navy background with gold accents
 * - Minimalist form with clear visual hierarchy
 * - Professional, trustworthy aesthetic
 * - Smooth transitions and micro-interactions
 */

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      console.log("Login attempt:", formData);
      setIsLoading(false);
      // In a real app, this would authenticate the user
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(45deg, transparent 24%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1) 76%, transparent 77%, transparent), linear-gradient(45deg, transparent 24%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 25px 25px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Secbank</h1>
            </div>
            <p className="text-xl text-white/90">
              Core Banking System
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Secure Admin Access
            </h2>
            <p className="text-lg text-white/80">
              Manage your banking operations with enterprise-grade security and precision.
            </p>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
              </div>
              <div>
                <p className="font-semibold">Session-Based Security</p>
                <p className="text-sm text-white/70">Secure authentication with encrypted sessions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
              </div>
              <div>
                <p className="font-semibold">Real-Time Operations</p>
                <p className="text-sm text-white/70">Manage customers, accounts, and transactions instantly</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
              </div>
              <div>
                <p className="font-semibold">Comprehensive Audit Trail</p>
                <p className="text-sm text-white/70">Track all transactions and user activities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="relative z-10 text-sm text-white/60 border-t border-white/10 pt-6">
          <p>&copy; 2026 Secbank. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-primary">Secbank</span>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Admin Login</h1>
            <p className="text-muted-foreground">Access your banking dashboard</p>
          </div>

          {/* Login Card */}
          <Card className="border-border shadow-lg">
            <CardHeader className="hidden lg:block">
              <CardTitle className="text-2xl text-primary">Admin Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the Secbank dashboard
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-primary">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="admin"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="h-11 border-border focus:border-accent focus:ring-accent transition-all duration-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Demo: admin
                  </p>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-primary">
                      Password
                    </Label>
                    <a href="#" className="text-xs text-accent hover:text-accent/80 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="h-11 border-border focus:border-accent focus:ring-accent pr-10 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Demo: admin123
                  </p>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-border cursor-pointer accent-accent"
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Remember me for 24 hours
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    <span className="font-semibold text-primary">Demo Credentials:</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Username: <span className="font-mono font-semibold">admin</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Password: <span className="font-mono font-semibold">admin123</span>
                  </p>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
                <p>
                  Need help?{" "}
                  <a href="#" className="text-accent hover:text-accent/80 transition-colors font-semibold">
                    Contact support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              🔒 This login page uses secure session-based authentication. Your credentials are encrypted and never stored in plain text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
