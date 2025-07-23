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
  User,
} from "lucide-react"

interface SignupPageProps {
  signupName: string
  signupEmail: string
  signupPassword: string
  signupError: string | null
  isAnimating: boolean
  onNameChange: (name: string) => void
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSignup: () => void
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

export default function SignupPage({ 
  signupName, 
  signupEmail, 
  signupPassword, 
  signupError, 
  isAnimating,
  onNameChange, 
  onEmailChange, 
  onPasswordChange, 
  onSignup, 
  onViewChange 
}: SignupPageProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div
      className={`min-h-screen bg-zinc-950 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-6xl flex items-center justify-center">
        {/* Left side - Signup Form */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center space-y-4">
              <div className={STYLE_CONSTANTS.logoContainer} style={{ height: '48px' }}>
                 <LogoImage style={{ height: '48px', maxWidth: '100%', width: 'auto' }} />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-medium text-white">Create your account</CardTitle>
                <p className="text-sm text-zinc-400">Start finding suppliers with SupplyGenie</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      placeholder="Full name"
                      value={signupName}
                      onChange={e => onNameChange(e.target.value)}
                      className={`${STYLE_CONSTANTS.inputWithIcon} ${STYLE_CONSTANTS.inputBase}`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={signupEmail}
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
                      value={signupPassword}
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
              {signupError && <div className="text-red-500 text-sm text-center">{signupError}</div>}
              <Button
                onClick={onSignup}
                className="w-full h-11 bg-white text-black hover:bg-zinc-200"
              >
                Create Account
              </Button>
              <div className="text-center space-y-4">
                <p className="text-sm text-zinc-400">
                  Already have an account?{" "}
                  <button onClick={() => onViewChange("login")} className="text-white hover:underline font-medium">
                    Sign in
                  </button>
                </p>
                <button onClick={() => onViewChange("home")} className="text-sm text-zinc-500 hover:text-zinc-400">
                  ← Back to home
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side - Image */}
        <div className="hidden lg:flex lg:w-1/2 lg:pl-8">
          <img 
            src="/create_acc_page.png" 
            alt="Create account illustration" 
            className="w-full h-auto max-h-[600px] object-contain"
          />
        </div>
      </div>
    </div>
  )
}
