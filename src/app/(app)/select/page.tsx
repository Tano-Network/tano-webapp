"use client"
import { useState } from "react"
import type React from "react"

import Link from "next/link"
import { ArrowRight, Users, Building2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/BackButton"

interface SelectionCardProps {
  title: string
  description: string
  features: string[]
  icon: React.ReactNode
  href: string
  badge?: string
  delay?: number
  userType: "retail" | "institutional"
}

const SelectionCard = ({
  title,
  description,
  features,
  icon,
  href,
  badge,
  delay = 0,
  userType,
}: SelectionCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const linkHref = `${href}?type=${userType}`

  return (
    <Card
      className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 hover:border-primary/30"
      style={{
        animationName: "slideInUp",
        animationDuration: "0.6s",
        animationTimingFunction: "ease-out",
        animationFillMode: "forwards",
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative text-center pb-4">
        {badge && (
          <Badge variant="secondary" className="w-fit mx-auto mb-4 animate-pulse">
            {badge}
          </Badge>
        )}

        <div className="bg-primary/10 p-6 rounded-2xl mb-6 border border-primary/20 w-fit mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>

        <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
          {title}
        </CardTitle>

        <CardDescription className="text-muted-foreground text-lg leading-relaxed group-hover:text-muted-foreground/80 transition-colors">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300"
              style={{
                animationName: isHovered ? "slideInLeft" : undefined,
                animationDuration: "0.3s",
                animationTimingFunction: "ease-out",
                animationFillMode: "forwards",
                animationDelay: `${delay + index * 50}ms`,
              }}
            >
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-300" />
              {feature}
            </div>
          ))}
        </div>

        <Button
          asChild
          className="w-full mt-6 text-lg py-6 group-hover:scale-105 transition-all duration-300 group/button"
        >
          <Link href={linkHref} className="flex items-center justify-center gap-2">
            Get Started
            <ArrowRight size={20} className="group-hover/button:translate-x-1 transition-transform duration-300" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SelectPage() {
  const [pageLoaded, setPageLoaded] = useState(false)

  useState(() => {
    setPageLoaded(true)
  })

  return (
    <div
      className={cn(
        "min-h-screen bg-background transition-all duration-700 flex items-center justify-center px-4",
        pageLoaded ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="max-w-6xl mx-auto py-20">
        <BackButton />
        {/* Header Section */}
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-6 text-sm px-4 py-2 animate-bounce hover:animate-none transition-all cursor-default"
          >
            <Sparkles size={16} className="mr-2" />
            Choose Your Experience
          </Badge>

          <h1
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-purple-500 mb-6 leading-tight"
            style={{
              animationName: "slideInDown",
              animationDuration: "0.8s",
              animationTimingFunction: "ease-out",
              animationFillMode: "forwards",
            }}
          >
            Welcome to Tano Finance
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
            Select the experience that best fits your needs and start earning with DeFi
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <SelectionCard
            title="Retail"
            description="Perfect for individual investors looking to mint, redeem, and earn with their crypto assets"
            features={[
              "Simple mint and redeem process",
              "Access to earning opportunities",
              "User-friendly interface",
              "Step-by-step guidance",
              "Lower minimum amounts",
            ]}
            icon={<Users size={48} className="text-primary" />}
            href="/retail-dashboard"
            badge="Most Popular"
            delay={0}
            userType="retail"
          />

          <SelectionCard
            title="Institutional"
            description="Advanced features for institutions, funds, and high-volume traders with vault management"
            features={[
              "Advanced vault management",
              "Institutional-grade security",
              "Higher yield opportunities",
              "Bulk operations support",
              "Dedicated support",
            ]}
            icon={<Building2 size={48} className="text-primary" />}
            href="/institutional-dashboard"
            badge="Professional"
            delay={200}
            userType="institutional"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="text-muted-foreground text-sm mb-4">Not sure which option is right for you?</div>
          <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-2">
              Learn More About Tano Finance
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}