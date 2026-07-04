"use client";

import { defineRecipe } from "@chakra-ui/react";
import { figmaTokens } from "../figma.tokens.generated";

/**
 * Рецепт ссылки для Chakra UI v3
 *
 * Использует токены из Figma для стилизации ссылки
 * Имеет варианты: primary, secondary, plain
 */
export const formLinkRecipe = defineRecipe({
    className: "form-link",
    base: {
        cursor: "pointer",
        textDecoration: "none",
        outline: "none",
        transition: "all 0.2s ease-in-out",
        _focusVisible: {
            boxShadow: `0 0 0 2px ${figmaTokens.semanticColors.light.button.buttonGreen}`,
            borderRadius: "sm",
        },
        _disabled: {
            opacity: 0.6,
            cursor: "not-allowed",
            pointerEvents: "none",
        },
    },
    variants: {
        variant: {
            primary: {
                color: figmaTokens.semanticColors.light.button.buttonGreen,
                fontWeight: "medium",
                _hover: {
                    textDecoration: "underline",
                },
            },
            secondary: {
                color: "gray.600",
                fontWeight: "normal",
                _hover: {
                    color: figmaTokens.semanticColors.light.button.buttonGreen,
                    textDecoration: "underline",
                },
            },
            plain: {
                color: "inherit",
                fontWeight: "normal",
                _hover: {
                    textDecoration: "underline",
                },
            },
        },
        size: {
            sm: {
                fontSize: "14",
            },
            md: {
                fontSize: "16",
            },
            lg: {
                fontSize: "18",
            },
        },
    },
    defaultVariants: {
        variant: "primary",
        size: "md",
    },
});

export default formLinkRecipe;
