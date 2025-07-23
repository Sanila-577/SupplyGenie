"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import LoginPage from "@/components/login-page"

export default function Login() {
  const router = useRouter()
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLogin = async () => {
    setLoginError(null)
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      router.push("/chat")
    } catch (error: any) {
      setLoginError(error.message || "Login failed")
    }
  }

  const handleViewChange = (newView: "home" | "login" | "signup" | "chat") => {
    setIsAnimating(true)
    setTimeout(() => {
      if (newView === "home") router.push("/")
      if (newView === "signup") router.push("/signup")
      if (newView === "chat") router.push("/chat")
      setIsAnimating(false)
    }, 300)
  }

  return (
    <LoginPage
      loginEmail={loginEmail}
      loginPassword={loginPassword}
      loginError={loginError}
      isAnimating={isAnimating}
      onEmailChange={setLoginEmail}
      onPasswordChange={setLoginPassword}
      onLogin={handleLogin}
      onViewChange={handleViewChange}
    />
  )
}
