"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import HomePage from "@/components/home-page"

interface UserType {
  name: string
  email: string
  avatar?: string
  uid: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleViewChange = (newView: "home" | "login" | "signup" | "chat") => {
    setIsAnimating(true)
    setTimeout(() => {
      if (newView === "login") router.push("/login")
      if (newView === "signup") router.push("/signup")
      if (newView === "chat") router.push("/chat")
      setIsAnimating(false)
    }, 300)
  }

  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || "User",
          email: firebaseUser.email || "",
          uid: firebaseUser.uid,
        })
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <HomePage
      user={user}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
      isAnimating={isAnimating}
    />
  )
}
