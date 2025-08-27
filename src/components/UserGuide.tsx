"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type GuideType = "mint" | "redeem" | "earn" | "vault"

interface GuideStep {
  title: string
  description: string
  tips?: string[]
  warning?: string
  important?: string
}

interface GuideContent {
  title: string
  description: string
  steps: GuideStep[]
  additionalInfo?: {
    title: string
    content: string
  }[]
}

const guideContent: Record<GuideType, GuideContent> = {
  mint: {

    title: "How to Mint Tokens ?",

    description: "Follow these steps for admin-assisted minting in retail.",
    steps: [
      {
        title: "Connect Your Wallet",
        description: "Ensure your wallet is connected and ready for transactions.",
        tips: ["Verify network connection", "Make sure you have some ETH for gas fees"],
      },
      {
        title: "Fill the Mint Form",
        description: "Provide user details and minting parameters in the form provided.",
        tips: ["Double-check all fields before submitting", "Use correct user wallet address"],
      },
      {
        title: "Send Tokens to Vault",
        description: "Transfer tokens to the vault address by scanning the QR code or copying the address.",
        tips: ["Use the exact address provided", "Confirm the vault address before sending"],
        warning: "Incorrect transfers cannot be reversed",
      },
      {
        title: "Wait for Confirmation",
        description: "Wait until the transaction is confirmed on the blockchain.",
        important: "Do not proceed until confirmation is visible in your wallet",
      },
      {
        title: "Copy Transaction Hash",
        description: "After confirmation, copy the transaction hash from your wallet.",
        tips: ["The hash starts with '0x'", "Keep it safe for validation"],
      },
      {

        title: "Validate & Mint using Connected Wallet ",

        description: "Paste the transaction hash into the mint request form and submit for processing.",
        tips: ["Ensure the hash is correct", "Check for typos before submission"],
      },
      {
        title: "Add Token to MetaMask",
        description: "After successful minting, add the newly minted token to your MetaMask wallet for easy tracking.",
        tips: ["Ensure you are on the correct network (Sepolia Testnet)", "Use the 'Add Token' feature in MetaMask and paste the token contract address"],
      },
    ],
    additionalInfo: [
      {
        title: "What is a Vault?",
        content: "A vault is a secure contract address where assets are stored before minting tokens.",
      },
      {
        title: "Why Validate?",
        content: "Validation ensures the transaction is legitimate and linked to the correct user.",
      },
      {
        title: "Why Validate?",
        content: "Validation ensures the transaction is legitimate and linked to the correct user.",
      },
    ],
  },

  redeem: {
    title: "How to Submit Redeem Request",
    description: "Redeem tokens securely by following these steps.",
    steps: [
      {
        title: "Connect Your Wallet",
        description: "Ensure your wallet is connected to the correct network.",
        tips: ["Confirm network settings", "Have some ETH for gas fees"],
      },
      {
        title: "Burn Tokens",
        description: "Burn the required amount of tokens you wish to redeem.",
        warning: "Burned tokens cannot be recovered",
      },
      {
        title: "Provide Native Token Address (if needed)",
        description: "If you have no previous mint request, provide your native token address.",
        tips: ["Double-check the address format", "Use an address you control"],
      },
      {
        title: "Submit Redeem Request",
        description: "Fill out the redeem form with required details and submit.",
      },
    ],
  },

  earn: {
    title: "How to Earn by Depositing Assets",
    description: "Deposit your assets to earn yield in selected vaults.",
    steps: [
      {
        title: "Connect Your Wallet",
        description: "Ensure your wallet is connected to the platform.",
      },
      {
        title: "Approve Vault Contract",
        description: "Approve the selected vault contract to spend your tokens.",
        tips: ["Approve only the amount you plan to deposit", "Verify contract address"],
      },
      {
        title: "Deposit Assets",
        description: "Deposit the approved assets into your chosen vault.",
        tips: ["Check vault APY before depositing", "Confirm the deposit transaction"],
      },
    ],
  },

  vault: {
    title: "How to Mint as a Whitelisted Institutional User",
    description: "Mint tokens using your admin-provided allowance.",
    steps: [
      {
        title: "Connect Your Wallet",
        description: "Ensure your institutional wallet is connected.",
      },
      {
        title: "Check Allowance",
        description: "Verify the allowance provided by the admin for minting.",
        tips: ["If allowance is zero, contact admin", "Check allowance in your dashboard"],
      },
      {
        title: "Mint from Allowance",
        description: "Use the provided allowance to mint tokens directly.",
        tips: ["Confirm mint amount before proceeding", "Verify mint transaction after completion"],
      },
    ],
  },
}

interface UserGuideProps {
  type: GuideType
  className?: string
}

export function UserGuide({ type, className }: UserGuideProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const guide = guideContent[type]

  const toggleStep = (stepIndex: number) => {
    setExpandedSteps(prev => {
      const newExpanded = new Set(prev)
      newExpanded.has(stepIndex) ? newExpanded.delete(stepIndex) : newExpanded.add(stepIndex)
      return newExpanded
    })
  }

  const expandAll = () => {
    setExpandedSteps(new Set(guide.steps.map((_, index) => index)))
  }

  const collapseAll = () => {
    setExpandedSteps(new Set())
  }

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {guide.steps.length} steps
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={expandAll} className="text-xs bg-transparent">
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs bg-transparent">
                Collapse All
              </Button>
            </div>

            <div className="space-y-4">
              {guide.steps.map((step, index) => (
                <Card key={index} className="border-border/50">
                  <Collapsible open={expandedSteps.has(index)} onOpenChange={() => toggleStep(index)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <CardTitle className="text-base">{step.title}</CardTitle>
                          </div>
                          {expandedSteps.has(index) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground mb-4">{step.description}</p>

                        {step.important && (
                          <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800 dark:text-orange-200">
                              <strong>Important:</strong> {step.important}
                            </AlertDescription>
                          </Alert>
                        )}

                        {step.warning && (
                          <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                              <strong>Warning:</strong> {step.warning}
                            </AlertDescription>
                          </Alert>
                        )}

                        {(step.tips ?? []).length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Tips:
                            </h4>
                            <ul className="space-y-1">
                              {(step.tips ?? []).map((tip, tipIndex) => (
                                <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>

            {(guide.additionalInfo ?? []).length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {(guide.additionalInfo ?? []).map((info, index) => (
                    <div key={index} className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-2">{info.title}</h4>
                      <p className="text-sm text-muted-foreground">{info.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
