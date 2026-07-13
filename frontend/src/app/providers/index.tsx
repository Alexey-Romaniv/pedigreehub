import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from '@/shared/theme/theme'
import { ColorModeProvider } from '@/shared/theme/color-mode'
import { Toaster } from '@/shared/theme/toaster'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

interface IProvidersProps {
  children: ReactNode
}

export const Providers = ({ children }: IProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <ColorModeProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
          <Toaster />
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  )
}
