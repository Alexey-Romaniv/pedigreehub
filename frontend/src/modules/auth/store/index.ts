import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Step1Data, Step2Data } from '../types'

interface BreederRegistrationState {
  currentStep: number
  step1Data: Step1Data | null
  step2Data: Step2Data | null
  isEmailChecked: boolean
  isEmailAvailable: boolean

  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setStep1Data: (data: Step1Data) => void
  setStep2Data: (data: Step2Data) => void
  setEmailChecked: (checked: boolean, available: boolean) => void
  reset: () => void
}

export const useBreederRegistrationStore = create<BreederRegistrationState>()(
  persist(
    (set) => ({
      currentStep: 0,
      step1Data: null,
      step2Data: null,
      isEmailChecked: false,
      isEmailAvailable: false,

      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 2) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
      setStep1Data: (data) => set({ step1Data: data }),
      setStep2Data: (data) => set({ step2Data: data }),
      setEmailChecked: (checked, available) => set({ isEmailChecked: checked, isEmailAvailable: available }),
      reset: () => set({
        currentStep: 0,
        step1Data: null,
        step2Data: null,
        isEmailChecked: false,
        isEmailAvailable: false,
      }),
    }),
    {
      name: 'pedigreehub-breeder-registration',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

