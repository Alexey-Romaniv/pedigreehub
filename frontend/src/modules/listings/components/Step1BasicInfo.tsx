import {
  Box,
  Input,
  Stack,
  Field,
  Flex,
  Text,
  Button,
  NativeSelect,
  NumberInput,
  RadioGroup,
  Separator,
} from "@chakra-ui/react";
import { UseFormReturn, Controller } from "react-hook-form";
import {
  LuArrowRight,
  LuFileText,
  LuCalendar,
  LuTag,
} from "react-icons/lu";
import type { CreateListingFormData } from "../types";
import { BreedCombobox } from "@/shared/ui";

interface Step1Props {
  form: UseFormReturn<CreateListingFormData>;
  onNext: () => void;
}

export const Step1BasicInfo = ({ form, onNext }: Step1Props) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = form;

  const birthDate = watch("birthDate");

  const handleNext = async () => {
    const isValid = await trigger([
      "title",
      "breed",
      "birthDate",
      "gender",
      "color",
      "price",
    ]);
    if (isValid) {
      onNext();
    }
  };

  // Валидация даты: минимум 6 недель назад
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 6 * 7);
  const maxDate = new Date();

  return (
    <Box>
      <Stack gap="32">
        {/* Основная информация */}
        <Box>
          <Flex align="center" gap="12" mb="24">
            <Box w="4px" h="24px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleLBold" color="contentBlack01">
              Podstawowe informacje
            </Text>
          </Flex>
          <Stack gap="20">
            <Field.Root invalid={!!errors.title} w="full">
              <Field.Label
                textStyle="labelMSemibold"
                color="contentBlack01"
                mb="6"
              >
                Tytuł ogłoszenia
              </Field.Label>
              <Box position="relative" w="full">
                <Box
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  color="contentGrey"
                  zIndex="1"
                >
                  <LuFileText size={18} />
                </Box>
                <Input
                  placeholder="np. Szczenięta Golden Retriever - złote, zdrowe"
                  pl="40px"
                  {...register("title")}
                  onBlur={() => trigger("title")}
                />
              </Box>
              <Field.ErrorText textStyle="labelS" mt="4">
                {errors.title?.message}
              </Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.breed} w="full">
              <Field.Label
                textStyle="labelMSemibold"
                color="contentBlack01"
                mb="6"
              >
                Rasa
              </Field.Label>
              <Controller
                name="breed"
                control={form.control}
                render={({ field }) => (
                  <BreedCombobox
                    value={field.value ? [field.value] : []}
                    onValueChange={(ids) => {
                      field.onChange(ids[0] ?? "");
                      trigger("breed");
                    }}
                    invalid={!!errors.breed}
                    placeholder="Wyszukaj rasę, np. Labrador"
                    onBlur={() => trigger("breed")}
                  />
                )}
              />
              <Field.ErrorText textStyle="labelS" mt="4">
                {errors.breed?.message}
              </Field.ErrorText>
            </Field.Root>
          </Stack>
        </Box>

        <Separator />

        {/* Информация о щенке */}
        <Box>
          <Flex align="center" gap="12" mb="24">
            <Box w="4px" h="24px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleLBold" color="contentBlack01">
              Informacje o szczenięciu
            </Text>
          </Flex>
          <Stack gap="20">
            <Flex gap="16" flexDir={{ base: "column", md: "row" }}>
              <Field.Root invalid={!!errors.birthDate} flex="1">
                <Field.Label
                  textStyle="labelMSemibold"
                  color="contentBlack01"
                  mb="6"
                >
                  Data urodzenia
                </Field.Label>
                <Box position="relative" w="full">
                  <Box
                    position="absolute"
                    left="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="contentGrey"
                    zIndex="1"
                    pointerEvents="none"
                  >
                    <LuCalendar size={18} />
                  </Box>
                  <Input
                    type="date"
                    max={maxDate.toISOString().split("T")[0]}
                    pl="40px"
                    value={
                      birthDate
                        ? birthDate instanceof Date
                          ? birthDate.toISOString().split("T")[0]
                          : birthDate
                        : ""
                    }
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        setValue("birthDate", new Date(dateValue), {
                          shouldValidate: true,
                        });
                      } else {
                        setValue("birthDate", null, { shouldValidate: true });
                      }
                    }}
                  />
                </Box>
                <Text textStyle="labelS" color="contentGrey" mt="6">
                  Szczenię musi mieć minimum 6 tygodni (zgodnie z prawem)
                </Text>
                <Field.ErrorText textStyle="labelS" mt="4">
                  {errors.birthDate?.message}
                </Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.gender} flex="1">
                <Field.Label
                  textStyle="labelMSemibold"
                  color="contentBlack01"
                  mb="6"
                >
                  Płeć
                </Field.Label>
                <Controller
                  name="gender"
                  control={form.control}
                                    render={({ field }) => (
                    <RadioGroup.Root
                      value={field.value || ""}
                      onValueChange={(details) => {
                        field.onChange(details.value);
                        trigger("gender");
                      }}
                    >
                      <Flex gap="16">
                        <RadioGroup.Item value="male">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText>Samiec</RadioGroup.ItemText>
                        </RadioGroup.Item>
                        <RadioGroup.Item value="female">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText>Samica</RadioGroup.ItemText>
                        </RadioGroup.Item>
                      </Flex>
                    </RadioGroup.Root>
                  )}
                />
                <Field.ErrorText textStyle="labelS" mt="4">
                  {errors.gender?.message}
                </Field.ErrorText>
              </Field.Root>
            </Flex>

            <Flex gap="16" flexDir={{ base: "column", md: "row" }}>
              <Field.Root invalid={!!errors.color} flex="1">
                <Field.Label
                  textStyle="labelMSemibold"
                  color="contentBlack01"
                  mb="6"
                >
                  Umaszczenie
                </Field.Label>
                <Box position="relative" w="full">
                  <Box
                    position="absolute"
                    left="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="contentGrey"
                    zIndex="1"
                  >
                    <LuTag size={18} />
                  </Box>
                  <Input
                    placeholder="np. Złote, Czarne, Białe"
                    pl="40px"
                    {...register("color")}
                    onBlur={() => trigger("color")}
                  />
                </Box>
                <Field.ErrorText textStyle="labelS" mt="4">
                  {errors.color?.message}
                </Field.ErrorText>
              </Field.Root>

              <Field.Root flex="1">
                <Field.Label
                  textStyle="labelMSemibold"
                  color="contentBlack01"
                  mb="6"
                >
                  Imię szczenięcia{" "}
                  <Text as="span" color="contentGrey" fontWeight="regular">
                    (opcjonalnie)
                  </Text>
                </Field.Label>
                <Input
                  placeholder="Jeśli nie podano, będzie 'Szczenię'"
                  {...register("puppyName")}
                />
              </Field.Root>
            </Flex>
          </Stack>
        </Box>

        <Separator />

        {/* Цена */}
        <Box>
          <Flex align="center" gap="12" mb="24">
            <Box w="4px" h="24px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleLBold" color="contentBlack01">
              Cena
            </Text>
          </Flex>
          <Stack gap="20">
            <Field.Root invalid={!!errors.price} w="full" maxW="400px">
              <Field.Label
                textStyle="labelMSemibold"
                color="contentBlack01"
                mb="6"
              >
                Cena
              </Field.Label>
              <Flex gap="8" w="full">
                <Box flex="1">
                  <NumberInput.Root
                    value={watch("price") && watch("price") > 0 ? String(watch("price")) : ""}
                    onValueChange={(e) => {
                      const numValue = e.valueAsNumber
                      // Если значение пустое или 0, устанавливаем 0, но в инпуте будет пустая строка
                      if (isNaN(numValue) || numValue === 0 || e.value === "") {
                        setValue("price", 0, { shouldValidate: true })
                      } else {
                        setValue("price", numValue, { shouldValidate: true })
                      }
                    }}
                    allowMouseWheel
                  >
                    <NumberInput.Input onBlur={() => trigger("price")} />
                  </NumberInput.Root>
                </Box>
                <NativeSelect.Root w="96px" flexShrink={0}>
                  <NativeSelect.Field {...register("currency")} aria-label="Waluta">
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Flex>
              <Text textStyle="labelS" color="contentGrey" mt="6">
                Minimum 100
              </Text>
              <Field.ErrorText textStyle="labelS" mt="4">
                {errors.price?.message}
              </Field.ErrorText>
            </Field.Root>
          </Stack>
        </Box>

        <Flex
          justify="flex-end"
          mt="40"
          pt="32"
          borderTop="2px solid"
          borderColor="linePrimary"
        >
          <Button
            variant="solid"
            size="lg"
            onClick={handleNext}
            minW="160px"
          >
            Dalej <LuArrowRight />
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};
