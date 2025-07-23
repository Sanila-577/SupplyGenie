"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react"

interface LoginPageProps {
  loginEmail: string
  loginPassword: string
  loginError: string | null
  isAnimating: boolean
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onLogin: () => void
  onViewChange: (view: "home" | "login" | "signup" | "chat") => void
}

// Reusable style constants
const STYLE_CONSTANTS = {
  inputBase: "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500",
  inputWithIcon: "h-11 pl-10",
  inputWithPassword: "h-11 pl-10 pr-10",
  logoContainer: "mx-auto flex items-center justify-center",
}

const LogoImage = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <img src="/logo.png" alt="SupplyGenie Logo" className={className} style={style} />
)

export default function LoginPage({ 
  loginEmail, 
  loginPassword, 
  loginError, 
  isAnimating,
  onEmailChange, 
  onPasswordChange, 
  onLogin, 
  onViewChange 
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div
      className={`min-h-screen bg-zinc-950 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-6xl flex items-center justify-center">
        {/* Left side - Image */}
        <div className="hidden lg:flex lg:w-1/2 lg:pr-8">
          <img 
            src="/login_page.png" 
            alt="Login illustration" 
            className="w-full h-auto max-h-[600px] object-contain"
          />
        </div>
        
        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center space-y-4">
              <div className={STYLE_CONSTANTS.logoContainer} style={{ height: '48px' }}>
                 <LogoImage style={{ height: '48px', maxWidth: '100%', width: 'auto' }} />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-medium text-white">Welcome back</CardTitle>
                <p className="text-sm text-zinc-400">Sign in to your SupplyGenie account</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={loginEmail}
                      onChange={e => onEmailChange(e.target.value)}
                      className={`${STYLE_CONSTANTS.inputWithIcon} ${STYLE_CONSTANTS.inputBase}`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={e => onPasswordChange(e.target.value)}
                      className={`${STYLE_CONSTANTS.inputWithPassword} ${STYLE_CONSTANTS.inputBase}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-zinc-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              {loginError && <div className="text-red-500 text-sm text-center">{loginError}</div>}
              <Button
                onClick={onLogin}
                className="w-full h-11 bg-white text-black hover:bg-zinc-200"
              >
                Sign In
              </Button>
              <div className="text-center space-y-4">
                <p className="text-sm text-zinc-400">
                  Don't have an account?{" "}
                  <button onClick={() => onViewChange("signup")} className="text-white hover:underline font-medium">
                    Sign up
                  </button>
                </p>
                <button onClick={() => onViewChange("home")} className="text-sm text-zinc-500 hover:text-zinc-400">
                  ← Back to home
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
