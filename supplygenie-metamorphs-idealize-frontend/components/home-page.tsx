"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Zap,
  LogOut,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserType {
  name: string
  email: string
  avatar?: string
  uid: string
}

interface HomePageProps {
  user: UserType | null
  onViewChange: (view: "home" | "login" | "signup" | "chat") => void
  onLogout: () => void
  isAnimating: boolean
}

// Reusable style constants
const STYLE_CONSTANTS = {
  avatarBase: "w-8 h-8 md:w-10 md:h-10 bg-zinc-800 border border-zinc-700",
  dropdownBase: "bg-zinc-900 border-zinc-800",
}

const UserAvatarDropdown = ({ user, onLogout }: { user: UserType; onLogout: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
        <Avatar className={STYLE_CONSTANTS.avatarBase}>
          <AvatarFallback className="text-xs text-white bg-zinc-800">
            {user.name.split(" ").map((n) => n[0]).join("") || "U"}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={`w-56 ${STYLE_CONSTANTS.dropdownBase}`}>
      <div className="px-2 py-1.5">
        <p className="text-sm font-medium text-white">{user.name}</p>
        <p className="text-xs text-zinc-400">{user.email}</p>
      </div>
      <DropdownMenuSeparator className="bg-zinc-800" />
      <DropdownMenuItem onClick={onLogout} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
        <LogOut className="w-4 h-4 mr-2" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

const LogoImage = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <img src="/logo.png" alt="SupplyGenie Logo" className={className} style={style} />
)

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "AI-Powered Search",
    description: "Find suppliers instantly with intelligent matching algorithms",
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Compliance Tracking",
    description: "Ensure all suppliers meet your regulatory requirements",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Smart Conversations",
    description: "Refine your search through natural language interactions",
  },
]

export default function HomePage({ user, onViewChange, onLogout, isAnimating }: HomePageProps) {
  return (
    <div
      className={`min-h-screen bg-zinc-950 text-white transition-opacity duration-300 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <LogoImage className="h-8 md:h-10 w-auto" />
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <UserAvatarDropdown user={user} onLogout={onLogout} />
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onViewChange("login")}
                  className="text-zinc-300 hover:text-white text-sm md:text-base"
                >
                  Sign In
                </Button>
                <Button onClick={() => onViewChange("signup")} className="bg-white text-black hover:bg-zinc-200 text-sm md:text-base">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-20">
          <div className="flex-1 space-y-6 md:space-y-8 text-center md:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Find Perfect Suppliers
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mx-auto md:mx-0">
                AI-powered supply chain advisor that helps you discover, evaluate, and connect with suppliers based on your exact requirements.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button
                size="lg"
                onClick={() => onViewChange(user ? "chat" : "signup")}
                className="bg-white text-black hover:bg-zinc-200 h-12 px-6 md:px-8"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end mt-8 md:mt-0">
            <img src="/home_page_image.png" alt="SupplyGenie Home" className="max-w-xs md:max-w-sm lg:max-w-xl w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Choose SupplyGenie?</h2>
          <p className="text-zinc-400 text-base md:text-lg">
            Streamline your supplier discovery process with intelligent automation
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-4 md:p-6 text-center space-y-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-sm md:text-base text-zinc-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 md:p-12 text-center space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to Transform Your Supply Chain?</h2>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
              Join thousands of businesses already using SupplyGenie to find reliable suppliers faster than ever.
            </p>
            <Button
              size="lg"
              onClick={() => onViewChange(user ? "chat" : "signup")}
              className="bg-white text-black hover:bg-zinc-200 h-12 px-6 md:px-8"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
