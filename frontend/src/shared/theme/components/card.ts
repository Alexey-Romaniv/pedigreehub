"use client";

import { defineRecipe } from "@chakra-ui/react";
/**
 * Рецепт карточки для Chakra UI v3
 *
 * Использует токены из Figma для стилизации карточки
 * Имеет варианты: filled, outlined
 * Имеет размеры: sm, md, lg
 * Имеет уровни тени: flat, raised, elevated
 */
export const cardRecipe = defineRecipe({
    className: "card",
    base: {
        display: "flex",
        flexDirection: "column",
        borderRadius: "card",
        overflow: "hidden",
        width: "100%",
        position: "relative",
        transition: "all 0.2s ease-in-out",
    },
    variants: {
        variant: {
            filled: {
                bg: "background.backgroundWhite",
                color: "content.contentBlack",
            },
            outlined: {
                bg: "transparent",
                border: "1px solid",
                borderColor: "border.borderGrey",
                color: "content.contentBlack",
            },
        },
        size: {
            sm: {
                padding: "12px",
                gap: "8px",
            },
            md: {
                padding: "16px",
                gap: "12px",
            },
            lg: {
                padding: "24px",
                gap: "16px",
            },
        },
        shadow: {
            flat: {
                boxShadow: "none",
            },
            raised: {
                boxShadow: "sm",
            },
            elevated: {
                boxShadow: "md",
            },
        },
    },
    defaultVariants: {
        variant: "filled",
        size: "md",
        shadow: "flat",
    },
    compoundVariants: [
        {
            variant: "outlined",
            shadow: ["raised", "elevated"],
            css: {
                borderColor: "transparent",
            },
        },
    ],
});

export default cardRecipe;
