import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../api'

export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => 
      documentsApi.upload(file, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

