import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, BarChart3, Users, Zap, Lock, TrendingUp, LogIn } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

/**
 * Secbank Landing Page - Swiss Banking Minimalism Design
 * 
 * Design Philosophy:
 * - Extreme simplicity with mathematical precision
 * - Deep Navy (#0A1628) + Gold (#C9A962) color scheme
 * - Playfair Display for headlines, Inter for body
 * - Generous whitespace and subtle shadows
 * - Asymmetric, premium layout
 * - Smooth micro-interactions and transitions
 */

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-primary">Secbank</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-foreground hover:text-accent transition-colors duration-200">Features</a>
            <a href="#about" className="text-sm font-medium text-foreground hover:text-accent transition-colors duration-200">About</a>
            <a href="#contact" className="text-sm font-medium text-foreground hover:text-accent transition-colors duration-200">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/5 font-semibold transition-all duration-200"
              onClick={() => setLocation('/admin')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Admin Login
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 py-24 md:py-32 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-full hover:bg-accent/15 transition-colors">
                <span className="text-sm font-medium text-accent">Modern Banking Solution</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-primary leading-tight">
                Banking Reimagined
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Secbank delivers enterprise-grade core banking capabilities with elegant simplicity. Manage customers, accounts, and transactions with confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setLocation('/admin')}
              >
                Access Admin Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary/5 font-semibold transition-all duration-200">
                View Documentation
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div className="hover:translate-y-[-2px] transition-transform duration-200">
                <div className="text-2xl font-bold text-primary">5</div>
                <p className="text-sm text-muted-foreground">Branch Locations</p>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="hover:translate-y-[-2px] transition-transform duration-200">
                <div className="text-2xl font-bold text-primary">100%</div>
                <p className="text-sm text-muted-foreground">Secure Transactions</p>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="hover:translate-y-[-2px] transition-transform duration-200">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <p className="text-sm text-muted-foreground">Availability</p>
              </div>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="relative h-96 md:h-full hidden md:block animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <img
              src="/hero-bg.jpg"
              alt="Banking Security"
              className="w-full h-full object-cover rounded-lg shadow-premium hover:shadow-xl transition-shadow duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-lg"></div>
          </div>
        </div>

        {/* Decorative divider line */}
        <div className="divider-gradient"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Core Banking Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to manage modern banking operations with precision and elegance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card
              className="border-border card-hover cursor-pointer"
              onMouseEnter={() => setHoveredFeature(0)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredFeature === 0 ? 'bg-accent text-white scale-110' : 'bg-accent/10 text-accent'
                }`}>
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-primary">Customer Management</CardTitle>
                <CardDescription>
                  Efficiently manage customer profiles and relationships
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Create, update, and organize customer information with a streamlined interface designed for banking professionals.
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card
              className="border-border card-hover cursor-pointer"
              onMouseEnter={() => setHoveredFeature(1)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredFeature === 1 ? 'bg-accent text-white scale-110' : 'bg-accent/10 text-accent'
                }`}>
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-primary">Account Operations</CardTitle>
                <CardDescription>
                  Open and manage accounts across multiple branches
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generate unique account numbers, track balances, and maintain account status with complete transparency and control.
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card
              className="border-border card-hover cursor-pointer"
              onMouseEnter={() => setHoveredFeature(2)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredFeature === 2 ? 'bg-accent text-white scale-110' : 'bg-accent/10 text-accent'
                }`}>
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-primary">Transaction Processing</CardTitle>
                <CardDescription>
                  Handle deposits, withdrawals, and transfers
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Process transactions with unique reference numbers, automatic balance updates, and comprehensive audit trails.
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card
              className="border-border card-hover cursor-pointer"
              onMouseEnter={() => setHoveredFeature(3)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredFeature === 3 ? 'bg-accent text-white scale-110' : 'bg-accent/10 text-accent'
                }`}>
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="text-primary">Security & Compliance</CardTitle>
                <CardDescription>
                  Enterprise-grade security standards
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Session-based authentication, secure transaction handling, and comprehensive logging for regulatory compliance.
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card
              className="border-border card-hover cursor-pointer"
              onMouseEnter={() => setHoveredFeature(4)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredFeature === 4 ? 'bg-accent text-white scale-110' : 'bg-accent/10 text-accent'
                }`}>
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-primary">Branch Operations</CardTitle>
                <CardDescription>
                  Multi-branch support with unified reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Manage 5 branch locations with centralized dashboard, branch-specific balances, and consolidated analytics.
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card
              className="border-border card-hover cursor-pointer"
              onMouseEnter={() => setHoveredFeature(5)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredFeature === 5 ? 'bg-accent text-white scale-110' : 'bg-accent/10 text-accent'
                }`}>
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle className="text-primary">Real-time Analytics</CardTitle>
                <CardDescription>
                  Instant insights into banking metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Dashboard with real-time statistics, transaction breakdowns, and branch performance metrics at a glance.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="about" className="py-24 md:py-32">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <div className="relative h-96 hidden md:block">
              <img
                src="/feature-pattern.jpg"
                alt="Technology Stack"
                className="w-full h-full object-cover rounded-lg shadow-premium hover:shadow-xl transition-shadow duration-300"
              />
            </div>

            {/* Right: Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                  Built for Scale
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Secbank is engineered with modern technologies to ensure reliability, security, and performance at enterprise scale.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 hover:translate-x-1 transition-transform duration-200">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center hover:bg-accent/20 transition-colors">
                    <span className="text-accent font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Type-Safe Architecture</h3>
                    <p className="text-muted-foreground">Built with TypeScript for end-to-end type safety across frontend and backend.</p>
                  </div>
                </div>

                <div className="flex gap-4 hover:translate-x-1 transition-transform duration-200">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center hover:bg-accent/20 transition-colors">
                    <span className="text-accent font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Modern Stack</h3>
                    <p className="text-muted-foreground">React 19, Node.js, tRPC, and Drizzle ORM for optimal developer experience.</p>
                  </div>
                </div>

                <div className="flex gap-4 hover:translate-x-1 transition-transform duration-200">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center hover:bg-accent/20 transition-colors">
                    <span className="text-accent font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Database Integrity</h3>
                    <p className="text-muted-foreground">MySQL with Drizzle ORM ensures data consistency and ACID compliance.</p>
                  </div>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold w-full md:w-auto shadow-lg hover:shadow-xl transition-all duration-200">
                View Technical Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 md:py-32 bg-primary text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(45deg, transparent 24%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1) 76%, transparent 77%, transparent), linear-gradient(45deg, transparent 24%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 25px 25px'
          }}></div>
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to Transform Your Banking Operations?
              </h2>
              <p className="text-lg text-white/80">
                Join forward-thinking financial institutions using Secbank to streamline their core banking processes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg transition-all duration-200">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold transition-all duration-200">
                Schedule Demo
              </Button>
            </div>

            <p className="text-sm text-white/60">
              No credit card required. Full access to all features for 30 days.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 border-t border-border py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="font-bold text-primary">Secbank</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enterprise core banking system for modern financial institutions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-primary mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-primary mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors duration-200">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-primary mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2026 Secbank. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors duration-200">Twitter</a>
              <a href="#" className="hover:text-primary transition-colors duration-200">LinkedIn</a>
              <a href="#" className="hover:text-primary transition-colors duration-200">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
