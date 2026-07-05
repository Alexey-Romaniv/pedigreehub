"use client";

import { nativeSelectAnatomy } from "@chakra-ui/react/anatomy";
import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Рецепт NativeSelect для Chakra UI v3
 *
 * Использует токены из Figma для стилизации нативного селекта
 * Имеет варианты: outline, subtle
 * Имеет размеры: xs, sm, md, lg
 */
export const nativeSelectRecipe = defineSlotRecipe({
    slots: nativeSelectAnatomy.keys(),
    base: {
        root: {
            width: "100%",
            outline: "none",
            position: "relative",
        },
        field: {
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderRadius: "sm",
            transition: "all 0.2s ease-in-out",
            overflow: "hidden",
            color: "contentBlack",
            borderColor: "input",
            _hover: {
                borderColor: "inputActive",
            },
            _focus: {
                borderColor: "inputActive",
            },
            _focusWithin: {
                borderColor: "inputActive",
            },
            _focusVisible: {
                borderColor: "inputActive",
                outline: "none",
            },
            _invalid: {
                borderColor: "red.500",
                boxShadow: "0 0 0 1px red.500",
            },
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
            _placeholder: {
                color: "contentGrey",
                textStyle: "labelS",
                fontWeight: "400",
            },
        },
        indicator: {
            color: "contentGrey",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
        },
    },
    variants: {
        size: {
            xs: {
                field: {
                    h: "32px",
                    minH: "32px",
                    fontSize: "14",
                    px: "12",
                    py: "8",
                },
            },
            sm: {
                field: {
                    h: "36px",
                    minH: "36px",
                    fontSize: "14",
                    px: "12",
                    py: "8",
                },
            },
            md: {
                field: {
                    h: "36px",
                    minH: "36px",
                    fontSize: "{fontSizes.14}",
                    px: "16",
                    py: "8",
                },
            },
            lg: {
                field: {
                    h: "48px",
                    minH: "48px",
                    fontSize: "14px",
                    px: "8px",
                    py: "12px",
                },
            },
        },
        variant: {
            outline: {
                field: {
                    borderWidth: "1px",
                    borderStyle: "solid",
                    _active: {
                        borderColor: "inputActive",
                    },
                    _focus: {
                        borderColor: "inputActive",
                    },
                    _focusWithin: {
                        borderColor: "inputActive",
                    },
                    _hover: {
                        borderColor: "inputActive",
                    },
                },
            },
            subtle: {
                field: {
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "transparent",
                    _hover: {
                        bg: "backgroundGreyDark",
                    },
                    _disabled: {},
                },
            },
        },
    },
    defaultVariants: {
        variant: "outline",
        size: "md",
    },
});

export default nativeSelectRecipe;
