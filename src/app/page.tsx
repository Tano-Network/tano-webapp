"use client"
import { useEffect, useState } from "react"
import type React from "react"
import { useRouter } from "next/router";
import { Layers, TrendingUp, Shield, ChevronsRight, Zap, Users, Globe, ArrowRight } from "lucide-react"
import Link from "next/link"
import { HomeHeader } from "@/components/HomeHeader"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string | number
  description?: string
  delay?: number
}
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  delay?: number
}
/**
 * A card component for displaying a statistic, with a gradient background
 * and a loading state.
 *
 * @param {React.ReactNode} icon - The icon to display
 * @param {string} label - The label to display
 * @param {string | number} value - The value to display
 * @param {string | number} [subValue] - An optional sub-value to display
 * @param {string} [description] - An optional description to display
 * @param {number} [delay=0] - The animation delay in milliseconds
 */
const StatCard = ({ icon, label, value, subValue, description, delay = 0 }: StatCardProps) => (
  <Card
    className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
    style={{
      animationName: "slideInUp",
      animationDuration: "0.6s",
      animationTimingFunction: "ease-out",
      animationFillMode: "forwards",
      animationDelay: `${delay}ms`,
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="relative">
      <div className="bg-primary/10 p-3 rounded-xl mb-4 border border-primary/20 w-fit group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      <CardDescription className="text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
        {label}
      </CardDescription>
      <CardTitle className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
        {value}
      </CardTitle>
      {subValue && (
        <div className="text-sm text-green-500 dark:text-green-400 font-medium group-hover:text-green-600 transition-colors">
          {subValue}
        </div>
      )}
      {description && (
        <div className="text-xs text-muted-foreground mt-2 group-hover:text-muted-foreground/70 transition-colors">
          {description}
        </div>
      )}
    </CardHeader>
  </Card>
)

/**
 * A card component for displaying a feature, with a gradient background
 * and a loading state.
 *
 * @param {React.ReactNode} icon - The icon to display
 * @param {string} title - The title to display
 * @param {string} description - The description to display
 * @param {string | null} badge - The badge to display, or null for no badge
 * @param {number} [delay=0] - The animation delay in milliseconds
 */

const FeatureCard = ({ icon, title, description, badge, delay = 0 }: FeatureCardProps) => (
  <Card
    className="group hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/20 hover:-translate-y-1"
    style={{
      animationName: "slideInUp",
      animationDuration: "0.6s",
      animationTimingFunction: "ease-out",
      animationFillMode: "forwards",
      animationDelay: `${delay}ms`,
    }}
  >
    <CardHeader>
      <div className="flex items-start justify-between mb-4">
        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        {badge && (
          <Badge variant="secondary" className="group-hover:scale-105 transition-transform">
            {badge}
          </Badge>
        )}
      </div>
      <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{title}</CardTitle>
      <CardDescription className="text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80 transition-colors">
        {description}
      </CardDescription>
    </CardHeader>
  </Card>
)

/**
 * The homepage of the Tano Finance app.
 *
 * This component is responsible for rendering the main landing page of the
 * application. It includes a hero section with a background animation, a
 * statistics section with real-time metrics, and a features section describing
 * the benefits of using Tano Finance.
 *
 * The page is animated using CSS animations and transitions, with a loading
 * state that fades in the content after the page has finished loading.
 */
export default function HomePage() {
  const [pageLoaded, setPageLoaded] = useState(false)

  useEffect(() => {
    setPageLoaded(true)
  }, [])

  return (
    <div className={cn("transition-all duration-700", pageLoaded ? "opacity-100" : "opacity-0")}>
      <HomeHeader />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="relative max-w-6xl mx-auto text-center">
          <Badge
            variant="secondary"
            className="mb-6 text-sm px-4 py-2 animate-bounce hover:animate-none transition-all cursor-default"
          >
            🚀 Now Live on Testnet
          </Badge>

          <h1
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-purple-500 mb-6 leading-tight"
            style={{
              animationName: "slideInDown",
              animationDuration: "0.8s",
              animationTimingFunction: "ease-out",
              animationFillMode: "forwards",
            }}
          >
            Tano Finance
          </h1>

          <div
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
            style={{
              animationName: "slideInUp",
              animationDuration: "0.8s",
              animationTimingFunction: "ease-out",
              animationDelay: "0.2s",
              animationFillMode: "forwards",
              opacity: 0,
            }}
          >
            Unlock the power of your cryptocurrency. Earn sustainable yield and participate in the future of
            decentralized finance.
          </div>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            style={{
              animationName: "slideInUp",
              animationDuration: "0.8s",
              animationTimingFunction: "ease-out",
              animationDelay: "0.4s",
              animationFillMode: "forwards",
              opacity: 0,
            }}
          >
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <Link href="/select" className="flex items-center gap-2">
                Launch App
                <ChevronsRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 bg-transparent hover:scale-105 transition-all duration-300"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Platform Statistics</h2>
            <div className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Real-time metrics from our growing ecosystem
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Layers size={24} className="text-primary" />}
              label="Total Value Locked"
              value="$12.3M"
              subValue="+2.5% (24h)"
              description="Across all vaults and pools"
              delay={0}
            />
            <StatCard
              icon={<TrendingUp size={24} className="text-primary" />}
              label="Average APY"
              value="15.2%"
              subValue="Stability Pool"
              description="Competitive yields"
              delay={100}
            />
            <StatCard
              icon={<Users size={24} className="text-primary" />}
              label="Active Users"
              value="2,847"
              subValue="+12% (7d)"
              description="Growing community"
              delay={200}
            />
            <StatCard
              icon={<Shield size={24} className="text-primary" />}
              label="Vaults Active"
              value="3"
              subValue="More coming"
              description="Secure and audited"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Why Choose Tano Finance?</h2>
            <div className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Built for the future of DeFi with security, transparency, and user experience at the core
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield size={24} className="text-primary" />}
              title="Security First"
              description="Multi-signature wallets, smart contract audits, and battle-tested protocols ensure your assets are always protected."
              badge="Audited"
              delay={0}
            />
            <FeatureCard
              icon={<Zap size={24} className="text-primary" />}
              title="High Performance"
              description="Optimized smart contracts and efficient yield strategies deliver maximum returns with minimal gas costs."
              badge="Optimized"
              delay={100}
            />
            <FeatureCard
              icon={<Globe size={24} className="text-primary" />}
              title="Cross-Chain Ready"
              description="Built to expand across multiple blockchains, bringing DeFi opportunities to every ecosystem."
              badge="Coming Soon"
              delay={200}
            />
            <FeatureCard
              icon={<TrendingUp size={24} className="text-primary" />}
              title="Sustainable Yields"
              description="Carefully designed tokenomics and yield strategies ensure long-term sustainability and growth."
              delay={300}
            />
            <FeatureCard
              icon={<Users size={24} className="text-primary" />}
              title="Community Driven"
              description="Governance token holders shape the future of the protocol through decentralized decision making."
              delay={400}
            />
            <FeatureCard
              icon={<Layers size={24} className="text-primary" />}
              title="Composable DeFi"
              description="Seamlessly integrate with other DeFi protocols to maximize your yield farming strategies."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Ready to Start Earning?</h2>
          <div className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users already earning yield on their crypto assets with Tano Finance.
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 hover:scale-105 transition-all duration-300 group">
              <Link href="/select" className="flex items-center gap-2">
                Get Started Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 bg-transparent hover:scale-105 transition-all duration-300"
            >
              <Link href="/earn">Explore Earn</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
