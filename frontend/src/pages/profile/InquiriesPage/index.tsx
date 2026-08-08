import { InquiryList, useMyInquiries } from '@/modules/inquiries'

const InquiriesPage = () => {
  const { data, isLoading, isError, refetch } = useMyInquiries()

  return (
    <InquiryList
      title="Moje zapytania"
      inquiries={data}
      isLoading={isLoading}
      isError={isError}
      role="buyer"
      basePath="/profile/inquiries"
      emptyText="Nie masz jeszcze żadnych zapytań"
      emptyHint="Znajdź szczeniaka w katalogu i wyślij zapytanie do hodowcy."
      onRetry={() => refetch()}
    />
  )
}

export default InquiriesPage
