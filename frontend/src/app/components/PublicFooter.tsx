import { Link } from 'react-router-dom'
import { Box, Container, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { LuPawPrint } from 'react-icons/lu'

const FOOTER_COLUMNS = [
  {
    title: 'Dla kupujących',
    links: [
      { path: '/catalog', label: 'Katalog szczeniąt' },
      { path: '/register', label: 'Załóż konto' },
    ],
  },
  {
    title: 'Dla hodowców',
    links: [
      { path: '/register/breeder', label: 'Zostań hodowcą' },
      { path: '/login', label: 'Zaloguj się' },
    ],
  },
]

export const PublicFooter = () => {
  return (
    <Box as="footer" bg="backgroundGrey" borderTop="1px solid" borderColor="linePrimary" mt="auto">
      <Container maxW="container.xl" py="40">
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="40">
          <Box>
            <Flex align="center" gap="10px" mb="12">
              <Box
                w="30px"
                h="30px"
                bg="contentBlack01"
                borderRadius="8px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <LuPawPrint size={15} color="white" />
              </Box>
              <Text textStyle="titleSerifL" color="contentBlack01">
                PedigreeHub
              </Text>
            </Flex>
            <Text textStyle="labelM" color="contentGrey" maxW="280px">
              Platforma legalnej sprzedaży psów rasowych w Polsce — ze zweryfikowanymi hodowcami i
              pełną dokumentacją.
            </Text>
          </Box>

          {FOOTER_COLUMNS.map((col) => (
            <Box key={col.title}>
              <Text textStyle="labelMono" color="contentGrey" mb="16">
                {col.title}
              </Text>
              <Flex direction="column" gap="10px">
                {col.links.map((link) => (
                  <Link key={link.path} to={link.path}>
                    <Text
                      textStyle="labelM"
                      color="contentBlack01"
                      _hover={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                      {link.label}
                    </Text>
                  </Link>
                ))}
              </Flex>
            </Box>
          ))}
        </SimpleGrid>

        <Flex
          mt="40"
          pt="24"
          borderTop="1px solid"
          borderColor="linePrimary"
          justify="space-between"
          align="center"
          direction={{ base: 'column', md: 'row' }}
          gap="12"
        >
          <Text textStyle="labelS" color="contentGrey">
            © 2026 PedigreeHub
          </Text>
          <Text textStyle="labelMonoS" color="contentGrey">
            Rodowody ZKwP · Mikroczip ISO 11784/85 · Biała Lista VAT
          </Text>
        </Flex>
      </Container>
    </Box>
  )
}
