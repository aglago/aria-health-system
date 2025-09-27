"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
  }
>(({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
  const [selectedTab, setSelectedTab] = React.useState(value || defaultValue || '')

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedTab(value)
    }
  }, [value])

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue)
    } else {
      setSelectedTab(newValue)
    }
  }

  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      data-orientation="horizontal"
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            selectedTab: value || selectedTab, 
            onValueChange: handleValueChange 
          } as any)
        }
        return child
      })}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { selectedTab?: string; onValueChange?: (value: string) => void }
>(({ className, children, selectedTab, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { 
          selectedTab, 
          onValueChange 
        } as any)
      }
      return child
    })}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    value: string;
    selectedTab?: string;
    onValueChange?: (value: string) => void;
  }
>(({ className, value, selectedTab, onValueChange, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      selectedTab === value
        ? "bg-background text-foreground shadow"
        : "text-muted-foreground hover:text-foreground",
      className
    )}
    onClick={() => onValueChange?.(value)}
    data-state={selectedTab === value ? "active" : "inactive"}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    value: string;
    selectedTab?: string;
  }
>(({ className, value, selectedTab, children, ...props }, ref) => {
  if (selectedTab !== value) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }