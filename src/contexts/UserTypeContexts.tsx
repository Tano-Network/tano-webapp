"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type UserType = "retail" | "institutional" | null

interface UserTypeContextType {
  userType: UserType
  setUserType: (type: UserType) => void
  isRetail: boolean
  isInstitutional: boolean
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined)

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const [userType, setUserTypeState] = useState<UserType>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check URL parameters and localStorage on mount
  useEffect(() => {
    if (!mounted) return

    const urlType = searchParams.get("type") as UserType
    const storedType = localStorage.getItem("tano-user-type") as UserType

    if (urlType && (urlType === "retail" || urlType === "institutional")) {
      setUserTypeState(urlType)
      localStorage.setItem("tano-user-type", urlType)
    } else if (storedType && (storedType === "retail" || storedType === "institutional")) {
      setUserTypeState(storedType)
    }
  }, [searchParams, mounted])

  const setUserType = (type: UserType) => {
    setUserTypeState(type)
    if (mounted) {
      if (type) {
        localStorage.setItem("tano-user-type", type)
      } else {
        localStorage.removeItem("tano-user-type")
      }
    }
  }

  const value = {
    userType,
    setUserType,
    isRetail: userType === "retail",
    isInstitutional: userType === "institutional",
  }

  return <UserTypeContext.Provider value={value}>{children}</UserTypeContext.Provider>
}

export function useUserType() {
  const context = useContext(UserTypeContext)
  if (context === undefined) {
    throw new Error("useUserType must be used within a UserTypeProvider")
  }
  return context
}
