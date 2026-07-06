"use client";

import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Рецепт тултипа для Chakra UI v3
 *
 * Использует токены из Figma для стилизации тултипа
 * Имеет варианты: default, dark, light
 * Имеет размеры: sm, md, lg
 */
export const tooltipRecipe = defineSlotRecipe({
    slots: ["root", "trigger", "content", "arrow", "arrowTip"],
    base: {
        content: {
            borderRadius: "4px",
            px: "12px",
            py: "2px",
            maxWidth: "300px",
            textStyle: "labelM",
            color: "contentBlack01",
            backgroundColor: "backgroundPrimary",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
            transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
        },
    },
    variants: {
        variant: {
            default: {
                content: {
                    color: "contentBlack01",
                    backgroundColor: "backgroundPrimary",
                },
            },
            dark: {
                content: {
                    color: "contentBlack01",
                    backgroundColor: "backgroundD",
                },
            },
            light: {
                content: {
                    backgroundColor: "backgroundPrimary",
                    color: "contentBlack01",
                    border: "1px solid",
                    borderColor: "linePrimary",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                },
            },
        },
        size: {
            sm: {
                content: {
                    px: "8px",
                    py: "6px",
                    fontSize: "12px",
                    maxWidth: "200px",
                },
            },
            md: {
                content: {
                    px: "12px",
                    py: "8px",
                    fontSize: "12px",
                    maxWidth: "300px",
                },
            },
            lg: {
                content: {
                    px: "16px",
                    py: "12px",
                    fontSize: "14px",
                    maxWidth: "400px",
                },
            },
        },
    },
    defaultVariants: {
        variant: "default",
        size: "md",
    },
});

export default tooltipRecipe;
