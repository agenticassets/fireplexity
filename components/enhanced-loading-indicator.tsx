'use client'

import { Search, Database, Brain, Sparkles, TrendingUp, Building, BarChart3 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface EnhancedLoadingIndicatorProps {
  searchStatus: string
  isLoading: boolean
}

export function EnhancedLoadingIndicator({ searchStatus, isLoading }: EnhancedLoadingIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [pulseIntensity, setPulseIntensity] = useState(0)

  // Realistic progress simulation based on actual search phases
  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    const progressSteps = [
      { threshold: 15, duration: 1500 },   // Initial search
      { threshold: 45, duration: 2500 },   // Content analysis
      { threshold: 85, duration: 3000 },   // AI processing
      { threshold: 100, duration: 1000 }   // Completion
    ]

    let totalTime = 0
    progressSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index)
        // Smooth progress animation
        const startProgress = index === 0 ? 0 : progressSteps[index - 1].threshold
        const targetProgress = step.threshold
        
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const increment = (targetProgress - startProgress) / (step.duration / 50)
            const newProgress = Math.min(prev + increment, targetProgress)
            if (newProgress >= targetProgress) {
              clearInterval(progressInterval)
            }
            return newProgress
          })
        }, 50)
      }, totalTime)
      totalTime += step.duration
    })
  }, [isLoading])

  // Pulse animation for active state
  useEffect(() => {
    if (!isLoading) return
    
    const interval = setInterval(() => {
      setPulseIntensity(prev => (prev + 1) % 100)
    }, 50)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  const steps = [
    { 
      icon: Search, 
      text: 'Searching real estate sources', 
      description: 'Scanning industry databases and reports',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30'
    },
    { 
      icon: Database, 
      text: 'Analyzing market data', 
      description: 'Processing property and market insights',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30'
    },
    { 
      icon: Brain, 
      text: 'Generating insights', 
      description: 'Creating comprehensive analysis',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-950/30'
    }
  ]

  const currentStepData = steps[currentStep] || steps[0]

  return (
    <div className="opacity-0 animate-fade-up [animation-duration:500ms] [animation-fill-mode:forwards]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-black dark:text-white" />
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Answer</h2>
      </div>
      
      <div className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-700 ${
        currentStepData.bgColor
      }`}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${currentStepData.color} animate-pulse`}
            style={{ 
              transform: `scale(${1 + pulseIntensity * 0.001})`,
              opacity: 0.1 + (pulseIntensity * 0.002)
            }}
          />
        </div>
        
        <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6">
          {/* Main status display */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center shadow-lg`}>
                <currentStepData.icon className="w-6 h-6 text-white" />
              </div>
              {/* Rotating ring */}
              <div className="absolute inset-0 rounded-xl border-2 border-current opacity-20 animate-spin" 
                   style={{ animationDuration: '3s' }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {searchStatus || currentStepData.text}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {currentStepData.description}
              </p>
              
              {/* Enhanced progress bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 bg-gradient-to-r ${currentStepData.color} rounded-full transition-all duration-300 ease-out relative`}
                    style={{ width: `${progress}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                                  translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Analyzing</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div key={index} className="flex flex-col items-center relative">
                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute top-4 left-6 w-16 h-0.5 transition-colors duration-500 ${
                      isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500 relative z-10 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg' 
                      : isActive 
                      ? `bg-gradient-to-br ${step.color} shadow-lg scale-110` 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Icon className={`w-4 h-4 ${
                        isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    )}
                    
                    {/* Pulse effect for active step */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping" />
                    )}
                  </div>
                  
                  <span className={`text-xs text-center max-w-16 transition-colors duration-300 ${
                    isActive ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.text.split(' ').slice(-2).join(' ')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
