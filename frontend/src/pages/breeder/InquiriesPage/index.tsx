import { InquiryList, useReceivedInquiries } from '@/modules/inquiries'

const BreederInquiriesPage = () => {
  const { data, isLoading, isError, refetch } = useReceivedInquiries()

  return (
    <InquiryList
      title="Przychodzące zapytania"
      inquiries={data}
      isLoading={isLoading}
      isError={isError}
      role="breeder"
      basePath="/breeder/inquiries"
      emptyText="Nie masz jeszcze żadnych zapytań"
      emptyHint="Gdy kupujący wyśle zapytanie do Twojego ogłoszenia, pojawi się tutaj."
      onRetry={() => refetch()}
    />
  )
}

export default BreederInquiriesPage
