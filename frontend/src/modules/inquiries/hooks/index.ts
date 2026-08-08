import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inquiriesApi } from '../api'
import type { CreateInquiryData } from '../types'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage, type ApiError } from '@/shared/api'

export const useMyInquiries = () => {
  return useQuery({
    queryKey: ['myInquiries'],
    queryFn: inquiriesApi.getMy,
  })
}

export const useReceivedInquiries = () => {
  return useQuery({
    queryKey: ['receivedInquiries'],
    queryFn: inquiriesApi.getReceived,
  })
}

export const useInquiry = (id: string | undefined) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['inquiry', id],
    queryFn: () => inquiriesApi.getById(id!),
    enabled: !!id,
    // Переписка должна быть живой: кэш стухает сразу, активный тред поллится,
    // завершённые (closed/purchase_confirmed) не опрашиваются
    staleTime: 0,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (status === 'closed' || status === 'purchase_confirmed') return false
      return 15000
    },
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 403 || status === 400) return false
      return failureCount < 2
    },
  })

  // Сервер сбрасывает unread-счётчик при GET треда — списки должны это узнать,
  // иначе красный бейдж висит до конца staleTime
  const lastMessageAt = query.data?.lastMessageAt
  useEffect(() => {
    if (!lastMessageAt) return
    queryClient.invalidateQueries({ queryKey: ['myInquiries'] })
    queryClient.invalidateQueries({ queryKey: ['receivedInquiries'] })
  }, [lastMessageAt, queryClient])

  return query
}

const invalidateInquiryQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string
) => {
  queryClient.invalidateQueries({ queryKey: ['myInquiries'] })
  queryClient.invalidateQueries({ queryKey: ['receivedInquiries'] })
  if (id) {
    queryClient.invalidateQueries({ queryKey: ['inquiry', id] })
  }
}

export const useCreateInquiry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInquiryData) => inquiriesApi.create(data),
    onSuccess: () => {
      toaster.success({ title: 'Zapytanie zostało wysłane' })
      invalidateInquiryQueries(queryClient)
    },
    onError: (error: ApiError) => {
      toaster.error({
        title: getApiErrorMessage(error, 'Nie udało się wysłać zapytania'),
      })
    },
  })
}

export const useSendInquiryMessage = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) => inquiriesApi.sendMessage(id, message),
    onSuccess: (inquiry) => {
      queryClient.setQueryData(['inquiry', id], inquiry)
      queryClient.invalidateQueries({ queryKey: ['myInquiries'] })
      queryClient.invalidateQueries({ queryKey: ['receivedInquiries'] })
    },
    onError: (error: ApiError) => {
      toaster.error({
        title: getApiErrorMessage(error, 'Nie udało się wysłać wiadomości'),
      })
    },
  })
}

export const useCloseInquiry = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => inquiriesApi.close(id),
    onSuccess: () => {
      toaster.success({ title: 'Zapytanie zostało zamknięte' })
      invalidateInquiryQueries(queryClient, id)
    },
    onError: (error: ApiError) => {
      toaster.error({
        title: getApiErrorMessage(error, 'Nie udało się zamknąć zapytania'),
      })
    },
  })
}

export const useConfirmPurchase = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => inquiriesApi.confirmPurchase(id),
    onSuccess: () => {
      toaster.success({
        title: 'Zakup został potwierdzony',
        description: 'Możesz teraz wystawić opinię hodowcy.',
      })
      invalidateInquiryQueries(queryClient, id)
    },
    onError: (error: ApiError) => {
      toaster.error({
        title: getApiErrorMessage(error, 'Nie udało się potwierdzić zakupu'),
      })
    },
  })
}
