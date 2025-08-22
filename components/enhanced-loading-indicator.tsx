'use client'

import { Loader2, Search, FileText, Brain, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

interface EnhancedLoadingIndicatorProps {
  searchStatus: string
  isLoading: boolean
}

export function EnhancedLoadingIndicator({ searchStatus, isLoading }: EnhancedLoadingIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dots, setDots] = useState('')

  // Animated dots
  useEffect(() => {
    if (!isLoading) return
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  // Progress through steps
  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0)
      return
    }

    const steps = [
      { icon: Search, text: 'Searching for sources', duration: 2000 },
      { icon: FileText, text: 'Analyzing content', duration: 3000 },
      { icon: Brain, text: 'Generating answer', duration: 4000 }
    ]

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  const steps = [
    { icon: Search, text: 'Searching for sources', color: 'text-blue-500' },
    { icon: FileText, text: 'Analyzing content', color: 'text-green-500' },
    { icon: Brain, text: 'Generating answer', color: 'text-purple-500' }
  ]

  return (
    <div className="opacity-0 animate-fade-up [animation-duration:500ms] [animation-fill-mode:forwards]">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-black dark:text-white" />
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Answer</h2>
      </div>
      
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index <= currentStep
            const isCompleted = index < currentStep
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                    : isActive 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-xs text-center transition-colors duration-300 ${
                  isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.text}
                </span>
              </div>
            )
          })}
        </div>

        {/* Current Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800 animate-pulse"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {searchStatus || steps[currentStep]?.text || 'Processing your request'}
              <span className="text-blue-500">{dots}</span>
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Rotating Orbs Animation */}
        <div className="flex justify-center mt-4">
          <div className="relative">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce absolute left-4" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce absolute left-8" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
