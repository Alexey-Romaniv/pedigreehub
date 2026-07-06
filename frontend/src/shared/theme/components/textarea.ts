"use client";

import { defineRecipe } from "@chakra-ui/react";

/**
 * Рецепт textarea для Chakra UI v3
 *
 * Использует токены из Figma для стилизации textarea
 * Имеет размеры: sm, md, lg
 */
export const textareaRecipe = defineRecipe({
    className: "form-textarea peer",
    base: {
        width: "100%",
        borderRadius: "md",
        transition: "all 0.2s ease-in-out",
        outline: "none",
        outlineWidth: "0",
        fontWeight: "normal",
        color: "contentBlack",
        boxSizing: "border-box",
        _focusVisible: {
            borderColor: "inputActive",
            boxShadow: `0 0 0 1px inputActive`,
            outline: "none",
        },
        _invalid: {
            borderColor: "negative",
            boxShadow: "0 0 0 1px negative",
            _focusVisible: {
                borderColor: "negative",
                boxShadow: "0 0 0 1px negative",
            },
        },
        _disabled: {
            opacity: 0.6,
            cursor: "not-allowed",
            backgroundColor: "backgroundGrey",
        },
    },
    variants: {
        variant: {
            outline: {
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "lineSecondary",
                backgroundColor: "backgroundPrimary",
                _hover: {
                    borderColor: "inputHover",
                },
                _focus: {
                    borderColor: "inputHover",
                    outlineWidth: "0",
                },
            },
            filled: {
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "transparent",
                backgroundColor: "backgroundGrey",
                _hover: {
                    backgroundColor: "backgroundGreyDark",
                },
            },
        },
        size: {
            sm: {
                fontSize: "14",
                px: "12",
                py: "8",
            },
            md: {
                fontSize: "{fontSizes.14}",
                px: "16",
                py: "8",
            },
            lg: {
                fontSize: "18",
                px: "16",
                py: "12",
            },
        },
    },
    defaultVariants: {
        variant: "outline",
        size: "md",
    },
});

export default textareaRecipe;
