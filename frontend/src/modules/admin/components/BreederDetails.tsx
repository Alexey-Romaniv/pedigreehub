import { Badge, Box, Flex, Link, Skeleton, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { LuExternalLink } from 'react-icons/lu'
import { BREEDER_BADGES } from '@/shared/constants/badges'
import { adminApi } from '../api'
import type { AdminBreederDetails, AdminBreederDocument } from '../types'

// В BREEDER_BADGES нет email_verified — подписываем отдельно, для прочих неизвестных id
// показываем сырое значение
const extraBadgeLabels: Record<string, string> = {
  email_verified: 'Email potwierdzony',
}

const badgeLabel = (id: string) =>
  BREEDER_BADGES.find((b) => b.id === id)?.label ?? extraBadgeLabels[id] ?? id

interface BreederDetailsProps {
  breederId: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Oczekuje', color: 'orange' },
  verified: { label: 'Zweryfikowany', color: 'green' },
  rejected: { label: 'Odrzucony', color: 'red' },
}

const levelLabels: Record<string, string> = {
  new: 'Nowa hodowla',
  verified: 'Zweryfikowana',
  trusted: 'Zaufana',
  professional: 'Profesjonalna',
}

// NIP хранится десятью цифрами — показываем в привычном формате 123-456-78-90
const formatNip = (nip: string) =>
  /^\d{10}$/.test(nip) ? `${nip.slice(0, 3)}-${nip.slice(3, 6)}-${nip.slice(6, 8)}-${nip.slice(8)}` : nip

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pl-PL') : '—')

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Flex gap="8" align="baseline" wrap="wrap">
    <Text textStyle="labelS" color="contentGrey" minW="140px">
      {label}
    </Text>
    <Box flex="1" minW="0">
      {children}
    </Box>
  </Flex>
)

const DocumentLink = ({ label, document }: { label: string; document?: AdminBreederDocument }) => {
  if (!document?.fileUrl) {
    return (
      <Row label={label}>
        <Text textStyle="labelM" color="contentGrey">
          Brak
        </Text>
      </Row>
    )
  }

  return (
    <Row label={label}>
      <Link
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        textStyle="labelM"
        color="contentBlack01"
        textDecoration="underline"
      >
        {document.originalName || 'Otwórz dokument'}
        <LuExternalLink size={14} />
      </Link>
    </Row>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box>
    <Text textStyle="labelSSemibold" color="contentGrey" mb="8" textTransform="uppercase">
      {title}
    </Text>
    <Flex direction="column" gap="8">
      {children}
    </Flex>
  </Box>
)

export const BreederDetails = ({ breederId }: BreederDetailsProps) => {
  const { data, isLoading, error } = useQuery<AdminBreederDetails>({
    queryKey: ['adminBreeder', breederId],
    queryFn: () => adminApi.getBreederById(breederId),
  })

  if (isLoading) {
    return <Skeleton h="220px" borderRadius="12px" />
  }

  if (error || !data) {
    return (
      <Box bg="backgroundPrimary" border="1px solid" borderColor="linePrimary" borderRadius="12px" p="16">
        <Text textStyle="labelM" color="contentGrey">
          Nie udało się załadować danych hodowcy
        </Text>
      </Box>
    )
  }

  const v = data.verification
  const status = statusLabels[v.status] ?? statusLabels.pending

  return (
    <Box
      bg="backgroundPrimary"
      border="1px solid"
      borderColor="linePrimary"
      borderRadius="12px"
      p="16"
      mt="12"
    >
      <Flex direction="column" gap="16">
        <Section title="Hodowla">
          <Row label="Nazwa">
            <Text textStyle="labelMSemibold" color="contentBlack01">
              {data.kennelName}
            </Text>
          </Row>
          <Row label="Nr ZKwP/FCI">
            <Text textStyle="labelM" color="contentBlack01">
              {data.kennelRegistration || '—'}
            </Text>
          </Row>
          <Row label="Lokalizacja">
            <Text textStyle="labelM" color="contentBlack01">
              {[data.city, data.region].filter(Boolean).join(', ') || '—'}
              {data.address ? ` • ${data.address}` : ''}
            </Text>
          </Row>
          <Row label="Status weryfikacji">
            <Badge colorPalette={status.color} size="sm">
              {status.label}
            </Badge>
          </Row>
          <Row label="Poziom">
            <Badge colorPalette="gray" size="sm">
              {levelLabels[v.level] ?? v.level}
            </Badge>
          </Row>
        </Section>

        <Section title="Dane firmy (NIP)">
          {v.nip ? (
            <>
              <Row label="NIP">
                <Flex gap="8" align="center" wrap="wrap">
                  <Text textStyle="labelMSemibold" color="contentBlack01">
                    {formatNip(v.nip)}
                  </Text>
                  <Badge colorPalette={v.nipVerified ? 'green' : 'orange'} size="sm">
                    {v.nipVerified ? 'Zweryfikowany' : 'Niezweryfikowany'}
                  </Badge>
                </Flex>
              </Row>
              <Row label="Nazwa firmy">
                <Text textStyle="labelM" color="contentBlack01">
                  {v.nipCompanyName || '—'}
                </Text>
              </Row>
              <Row label="PKD">
                <Text textStyle="labelM" color="contentBlack01">
                  {v.nipPkd || '—'}
                </Text>
              </Row>
              <Row label="Data weryfikacji">
                <Text textStyle="labelM" color="contentBlack01">
                  {formatDate(v.nipVerifiedAt)}
                </Text>
              </Row>
              <Link
                href={`https://www.podatki.gov.pl/wykaz-podatnikow-vat-wyszukiwarka/?nip=${v.nip}`}
                target="_blank"
                rel="noopener noreferrer"
                textStyle="labelS"
                color="contentGrey"
                textDecoration="underline"
              >
                Sprawdź w Białej liście VAT
                <LuExternalLink size={12} />
              </Link>
            </>
          ) : (
            <Text textStyle="labelM" color="contentGrey">
              Hodowca nie podał NIP-u
            </Text>
          )}
        </Section>

        <Section title="Dokumenty">
          <DocumentLink label="Zaświadczenie ZKwP" document={v.zkwpDocument} />
          <Row label="ZKwP zweryfikowany">
            <Text textStyle="labelM" color="contentBlack01">
              {v.zkwpVerified ? `Tak • ${formatDate(v.zkwpVerifiedAt)}` : 'Nie'}
              {v.zkwpNote ? ` • ${v.zkwpNote}` : ''}
            </Text>
          </Row>
          <DocumentLink label="Dokument tożsamości" document={v.identityDocument} />
          <Row label="Tożsamość zweryfikowana">
            <Text textStyle="labelM" color="contentBlack01">
              {v.identityVerified ? `Tak • ${formatDate(v.identityVerifiedAt)}` : 'Nie'}
            </Text>
          </Row>
        </Section>

        {data.badges?.length > 0 && (
          <Section title="Odznaki">
            <Flex gap="8" wrap="wrap">
              {data.badges.map((badge) => (
                <Badge key={badge} colorPalette="gray" size="sm">
                  {badgeLabel(badge)}
                </Badge>
              ))}
            </Flex>
          </Section>
        )}
      </Flex>
    </Box>
  )
}
