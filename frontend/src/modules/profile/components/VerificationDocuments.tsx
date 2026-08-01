import { Box, Stack, Text, Button, Flex, Input, Spinner, Dialog, Portal } from '@chakra-ui/react'
import { 
  LuFileText, LuShield, LuBriefcase, LuAward, LuUpload, 
  LuCheck, LuX, LuClock, LuTriangleAlert, LuEye, LuPencil, LuBadgeCheck
} from 'react-icons/lu'
import { useRef, useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi, breederApi, type DocumentInfo } from '../api'
import { toaster } from '@/shared/theme/toaster'
import { DocumentUploadMultiple } from './DocumentUploadMultiple'
import { StatusPill } from '@/shared/ui'

interface DocumentUploadProps {
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  documentType: string
  existingDoc: DocumentInfo | null
  isUploading?: boolean
  onUpload: (file: File, type: string) => void
  onRemove: (doc: DocumentInfo) => void
}

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'approved') return <StatusPill label="Zatwierdzony" tone="default" icon={LuCheck} />
  if (status === 'rejected') return <StatusPill label="Odrzucony" tone="negative" icon={LuX} />
  return <StatusPill label="W trakcie weryfikacji" tone="muted" icon={LuClock} />
}

const DocumentUpload = ({ 
  icon: Icon, title, description, badge, documentType,
  existingDoc, isUploading, onUpload, onRemove,
}: DocumentUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleClick = () => {
    if (!isUploading && !existingDoc) inputRef.current?.click()
  }
  
  const handleFile = useCallback((file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toaster.error({ title: 'Nieprawidłowy format pliku', description: 'Dozwolone: PDF, JPG, PNG, WebP' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toaster.error({ title: 'Plik za duży', description: 'Maksymalny rozmiar: 10MB' })
      return
    }
    onUpload(file, documentType)
  }, [documentType, onUpload])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!existingDoc && !isUploading) setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (existingDoc || isUploading) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (existingDoc?.fileUrl) window.open(existingDoc.fileUrl, '_blank')
  }

  const isApproved = existingDoc?.status === 'approved'
  const isRejected = existingDoc?.status === 'rejected'
  
  return (
    <Box
      border="2px dashed"
      borderColor={isDragOver ? 'positive' : existingDoc ? (isApproved ? 'positive' : isRejected ? 'statusTextRed' : 'lineSecondary') : 'linePrimary'}
      borderRadius="12px"
      p="16"
      cursor={isUploading || existingDoc ? 'default' : 'pointer'}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      bg={isDragOver ? 'statusBackgroundGreen' : existingDoc ? (isApproved ? 'statusBackgroundGreen' : isRejected ? 'statusBackgroundRed' : 'backgroundGrey') : 'backgroundPrimary'}
      opacity={isUploading ? 0.7 : 1}
      _hover={!isUploading && !existingDoc ? { borderColor: 'lineSecondary', bg: 'backgroundGrey' } : undefined}
      transition="all 0.2s"
    >
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleChange} style={{ display: 'none' }} />
      
      <Flex gap="16" align="flex-start">
        <Box 
          w="44px" h="44px" 
          bg={existingDoc ? (isApproved ? 'positive' : isRejected ? 'statusTextRed' : 'contentBlack01') : 'backgroundGrey'} 
          borderRadius="10px" 
          display="flex" alignItems="center" justifyContent="center" flexShrink={0}
        >
          {isUploading ? (
            <Spinner size="sm" color="white" />
          ) : existingDoc ? (
            isRejected ? <LuX size={22} color="white" /> : <LuCheck size={22} color="white" />
          ) : (
            <Box color="contentGrey" display="inline-flex"><Icon size={22} /></Box>
          )}
        </Box>
        
        <Box flex="1">
          <Flex align="center" gap="8" mb="4" flexWrap="wrap">
            <Text textStyle="labelMSemibold" color="contentBlack01">{title}</Text>
            {badge && <StatusPill label={badge} tone="muted" />}
          </Flex>
          
          {isUploading ? (
            <Text textStyle="labelS" color="contentGrey">Przesyłanie...</Text>
          ) : existingDoc ? (
            <Box>
              <Flex align="center" gap="8" flexWrap="wrap">
                <Text textStyle="labelS" color="contentBlack01" flex="1" truncate>
                  {existingDoc.originalName || existingDoc.fileName}
                </Text>
                <StatusBadge status={existingDoc.status} />
              </Flex>
              
              {/* Причина отклонения */}
              {isRejected && existingDoc.rejectionReason && (
                <Box mt="8" p="8" bg="statusBackgroundRed" borderRadius="6px">
                  <Text textStyle="labelS" color="statusTextRed">
                    Powód odrzucenia: {existingDoc.rejectionReason}
                  </Text>
                </Box>
              )}

              {/* Кнопки действий */}
              <Flex gap="8" mt="12">
                <Button variant="outline" size="xs" onClick={handlePreview}>
                  <LuEye size={14} /> Podgląd
                </Button>
                {existingDoc.status !== 'approved' && (
                  <Button 
                    variant="outline" 
                    size="xs" 
                    color="statusTextRed" 
                    borderColor="statusTextRed"
                    onClick={(e) => { e.stopPropagation(); onRemove(existingDoc) }}
                  >
                    <LuX size={14} /> Usuń
                  </Button>
                )}
              </Flex>
            </Box>
          ) : (
            <Text textStyle="labelS" color="contentGrey">
              {isDragOver ? 'Upuść plik tutaj...' : description}
            </Text>
          )}
        </Box>
        
        {!existingDoc && !isUploading && (
          <Box color="contentGrey">
            <LuUpload size={20} />
          </Box>
        )}
      </Flex>
    </Box>
  )
}

// Диалог подтверждения удаления
const DeleteConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  fileName,
  isDeleting 
}: { 
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fileName: string
  isDeleting: boolean
}) => (
  <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
    <Portal>
      <Dialog.Backdrop bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content bg="backgroundPrimary" borderRadius="16px" p="24" maxW="400px" mx="16">
          <Dialog.Header p="0" mb="16">
            <Dialog.Title>
              <Text textStyle="titleMBold" color="contentBlack01">Usunąć dokument?</Text>
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body p="0" mb="24">
            <Text textStyle="labelM" color="contentGrey">
              Czy na pewno chcesz usunąć dokument "{fileName}"? Tej operacji nie można cofnąć.
            </Text>
          </Dialog.Body>
          <Dialog.Footer p="0" display="flex" gap="12" justifyContent="flex-end">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Anuluj
            </Button>
            <Button
              bg="negative"
              color="white"
              onClick={onConfirm}
              loading={isDeleting}
            >
              Usuń
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)

export const VerificationDocuments = () => {
  const queryClient = useQueryClient()
  const [nip, setNip] = useState('')
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<DocumentInfo | null>(null)
  const [isEditingNip, setIsEditingNip] = useState(false)

  const { data: docsData, isLoading } = useQuery({
    queryKey: ['myDocuments'],
    queryFn: () => documentsApi.getMyDocuments(),
  })

  const {
    data: breederData,
    isLoading: isBreederLoading,
    isError: isBreederError,
  } = useQuery({
    queryKey: ['breederProfile'],
    queryFn: () => breederApi.getMe(),
  })

  const breeder = breederData?.data
  const nipVerified = breeder?.verification?.nipVerified
  const verificationStatus = breeder?.verification?.status

  const documents = docsData?.data || []
  const getDoc = (type: string) => documents.find(d => d.type === type) || null
  const getDocs = (type: string) => documents.filter(d => d.type === type)
  
  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => documentsApi.upload(file, type),
    onMutate: ({ type }) => setUploadingType(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] })
      toaster.success({ title: 'Dokument przesłany' })
    },
    onError: () => toaster.error({ title: 'Błąd przesyłania' }),
    onSettled: () => setUploadingType(null),
  })

  const uploadMultipleMutation = useMutation({
    mutationFn: ({ files, type }: { files: File[]; type: string }) => 
      documentsApi.uploadMultiple(files, type),
    onMutate: ({ type }) => setUploadingType(type),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] })
      toaster.success({ 
        title: 'Dokumenty przesłane', 
        description: `Przesłano ${results.length} ${results.length === 1 ? 'plik' : 'plików'}` 
      })
    },
    onError: () => toaster.error({ title: 'Błąd przesyłania' }),
    onSettled: () => setUploadingType(null),
  })

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] })
      toaster.success({ title: 'Dokument usunięty' })
      setDeleteDoc(null)
    },
    onError: () => toaster.error({ title: 'Błąd usuwania' }),
  })

  const nipMutation = useMutation({
    mutationFn: breederApi.verifyNip,
    onSuccess: (data) => {
      if (data.data.verified) {
        queryClient.invalidateQueries({ queryKey: ['breederProfile'] })
        toaster.success({ title: 'NIP zweryfikowany', description: data.data.companyName })
        setIsEditingNip(false)
        setNip('')
      } else {
        toaster.error({ title: 'Błąd weryfikacji NIP', description: data.data.error })
      }
    },
    onError: () => toaster.error({ title: 'Błąd weryfikacji NIP' }),
  })

  const handleUpload = (file: File, type: string) => uploadMutation.mutate({ file, type })
  const handleUploadMultiple = (files: File[], type: string) => 
    uploadMultipleMutation.mutate({ files, type })
  const handleRemove = (doc: DocumentInfo) => setDeleteDoc(doc)
  const confirmDelete = () => {
    if (deleteDoc) deleteMutation.mutate(deleteDoc._id)
  }

  const zkwpDoc = getDoc('zkwp_certificate')
  const hasRequiredDoc = !!zkwpDoc

  if (isLoading || isBreederLoading) {
    return (
      <Box p="40" textAlign="center">
        <Spinner size="lg" color="contentGrey" />
      </Box>
    )
  }

  if (isBreederError) {
    return (
      <Box p="40" textAlign="center">
        <Text textStyle="labelM" color="contentGrey">
          Nie udało się załadować profilu hodowcy. Odśwież stronę.
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      {verificationStatus === 'verified' ? (
        <Flex align="center" gap="12" bg="backgroundGrey" p="16" borderRadius="12px" border="1px solid" borderColor="linePrimary" mb="24">
          <Box color="contentBlack01" display="inline-flex" flexShrink={0}>
            <LuBadgeCheck size={22} />
          </Box>
          <Text textStyle="labelM" color="contentBlack01">
            Twój profil hodowcy jest zweryfikowany. Dodatkowe dokumenty zwiększają zaufanie kupujących.
          </Text>
        </Flex>
      ) : verificationStatus === 'rejected' ? (
        <Box bg="backgroundPrimary" p="20" borderRadius="12px" border="1px solid" borderColor="negative" mb="24">
          <Flex align="center" gap="12" mb="8">
            <Box color="negative" display="inline-flex"><LuTriangleAlert size={24} /></Box>
            <Text textStyle="titleSBold" color="contentBlack01">Weryfikacja odrzucona</Text>
          </Flex>
          <Text textStyle="labelM" color="contentBlack01">
            Prześlij poprawiony certyfikat ZKwP, aby ponownie ubiegać się o weryfikację profilu.
          </Text>
        </Box>
      ) : !hasRequiredDoc ? (
        <Box bg="statusBackgroundGreyLight" p="20" borderRadius="12px" border="1px solid" borderColor="linePrimary" mb="24">
          <Flex align="center" gap="12" mb="8">
            <Box color="contentGrey" display="inline-flex"><LuTriangleAlert size={24} /></Box>
            <Text textStyle="titleSBold" color="contentBlack01">Wymagana weryfikacja</Text>
          </Flex>
          <Text textStyle="labelM" color="contentBlack01">
            Prześlij certyfikat ZKwP, aby aktywować profil hodowcy i dodawać ogłoszenia.
          </Text>
        </Box>
      ) : (
        <Flex align="center" gap="12" bg="backgroundGrey" p="16" borderRadius="12px" border="1px solid" borderColor="linePrimary" mb="24">
          <Box color="contentGrey" display="inline-flex" flexShrink={0}>
            <LuClock size={22} />
          </Box>
          <Text textStyle="labelM" color="contentBlack01">
            Dokumenty przesłane — profil oczekuje na weryfikację przez moderatora.
          </Text>
        </Flex>
      )}

      <Stack gap="16">
        <Box>
          <Flex align="center" gap="8" mb="12">
            <Box w="8px" h="8px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleSBold" color="contentBlack01">Dokumenty wymagane</Text>
          </Flex>

          <DocumentUpload
            icon={LuFileText}
            title="Certyfikat ZKwP"
            description="Przeciągnij i upuść plik lub kliknij, aby wybrać (PDF, JPG, PNG)"
            documentType="zkwp_certificate"
            existingDoc={zkwpDoc}
            isUploading={uploadingType === 'zkwp_certificate'}
            onUpload={handleUpload}
            onRemove={handleRemove}
          />
        </Box>

        <Box>
          <Flex align="center" gap="8" mb="12">
            <Box w="8px" h="8px" bg="positive" borderRadius="full" />
            <Text textStyle="titleSBold" color="contentBlack01">Dokumenty dodatkowe</Text>
            <Text textStyle="labelS" color="contentGrey">(zwiększają zaufanie)</Text>
          </Flex>

          <Stack gap="12">
            <DocumentUpload
              icon={LuShield}
              title="Dokument tożsamości"
              description="Paszport lub dowód osobisty"
              badge="Tożsamość potwierdzona"
              documentType="identity"
              existingDoc={getDoc('identity')}
              isUploading={uploadingType === 'identity'}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />

            <Box
              border="1px solid"
              borderColor={nipVerified ? 'contentBlack01' : 'linePrimary'}
              borderRadius="12px"
              p="16"
              bg={nipVerified ? 'backgroundGrey' : 'backgroundPrimary'}
            >
              <Flex gap="16" align="flex-start">
                <Box
                  w="44px" h="44px"
                  bg={nipVerified ? 'contentBlack01' : 'backgroundGrey'}
                  borderRadius="10px"
                  display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                >
                  {nipVerified ? (
                    <LuCheck size={22} color="white" />
                  ) : (
                    <Box color="contentGrey" display="inline-flex"><LuBriefcase size={22} /></Box>
                  )}
                </Box>
                
                <Box flex="1">
                  <Flex align="center" gap="8" mb="4" flexWrap="wrap">
                    <Text textStyle="labelMSemibold" color="contentBlack01">NIP firmy</Text>
                    {nipVerified ? (
                      <StatusPill label="Zweryfikowany" tone="default" icon={LuBadgeCheck} />
                    ) : (
                      <StatusPill label="Legalna działalność" tone="muted" />
                    )}
                  </Flex>
                  
                  {nipVerified && !isEditingNip ? (
                    // Показываем верифицированные данные
                    <Box>
                      <Text textStyle="labelM" color="contentBlack01" mb="4">
                        {breeder?.verification?.nipCompanyName}
                      </Text>
                      <Flex align="center" gap="8">
                        {breeder?.verification?.nip && (
                          <Text textStyle="labelMonoS" color="contentGrey">
                            NIP {breeder.verification.nip}
                          </Text>
                        )}
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          onClick={() => setIsEditingNip(true)}
                        >
                          <LuPencil size={14} /> Zmień
                        </Button>
                      </Flex>
                    </Box>
                  ) : (
                    // Форма ввода NIP
                    <Box>
                      <Text textStyle="labelS" color="contentGrey" mb="12">
                        Weryfikacja automatyczna w Białej Liście VAT (Ministerstwo Finansów)
                      </Text>
                      <Flex gap="8">
                        <Input
                          placeholder="np. 1234567890"
                          value={nip}
                          onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          maxLength={10}
                          flex="1"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => nipMutation.mutate(nip)}
                          disabled={nip.length !== 10 || nipMutation.isPending}
                          loading={nipMutation.isPending}
                        >
                          Sprawdź
                        </Button>
                        {isEditingNip && (
                          <Button 
                            variant="ghost" 
                            onClick={() => { setIsEditingNip(false); setNip('') }}
                          >
                            Anuluj
                          </Button>
                        )}
                      </Flex>
                    </Box>
                  )}
                </Box>
              </Flex>
            </Box>

            <DocumentUploadMultiple
              icon={LuAward}
              title="Dyplomy i nagrody"
              description="Przeciągnij i upuść pliki lub kliknij, aby wybrać (można przesłać wiele)"
              badge="Nagrodzona hodowla"
              documentType="award"
              existingDocs={getDocs('award')}
              isUploading={uploadingType === 'award'}
              onUpload={handleUploadMultiple}
              onRemove={handleRemove}
            />

            <DocumentUploadMultiple
              icon={LuFileText}
              title="Rodowody psów hodowlanych"
              description="Przeciągnij i upuść pliki lub kliknij, aby wybrać (można przesłać wiele)"
              badge="Potwierdzona praca hodowlana"
              documentType="pedigree"
              existingDocs={getDocs('pedigree')}
              isUploading={uploadingType === 'pedigree'}
              onUpload={handleUploadMultiple}
              onRemove={handleRemove}
            />
          </Stack>
        </Box>
      </Stack>

      {/* Диалог подтверждения удаления */}
      <DeleteConfirmDialog
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={confirmDelete}
        fileName={deleteDoc?.originalName || deleteDoc?.fileName || ''}
        isDeleting={deleteMutation.isPending}
      />
    </Box>
  )
}
