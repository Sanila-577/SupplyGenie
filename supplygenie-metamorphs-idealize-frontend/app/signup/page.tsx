"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import SignupPage from "@/components/signup-page"

export default function Signup() {
  const router = useRouter()
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupError, setSignupError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSignup = async () => {
    setSignupError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
      const user = userCredential.user
      if (signupName) {
        await updateProfile(user, { displayName: signupName })
      }
      router.push("/chat")
    } catch (error: any) {
      setSignupError(error.message || "Signup failed")
    }
  }

  const handleViewChange = (newView: "home" | "login" | "signup" | "chat") => {
    setIsAnimating(true)
    setTimeout(() => {
      if (newView === "home") router.push("/")
      if (newView === "login") router.push("/login")
      if (newView === "chat") router.push("/chat")
      setIsAnimating(false)
    }, 300)
  }

  return (
    <SignupPage
      signupName={signupName}
      signupEmail={signupEmail}
      signupPassword={signupPassword}
      signupError={signupError}
      isAnimating={isAnimating}
      onNameChange={setSignupName}
      onEmailChange={setSignupEmail}
      onPasswordChange={setSignupPassword}
      onSignup={handleSignup}
      onViewChange={handleViewChange}
    />
  )
}
