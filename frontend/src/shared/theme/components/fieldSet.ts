// src/shared/theme/components/fieldSet.ts
"use client";

import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Рецепт для Fieldset в Chakra UI v3
 *
 * Слоты: root, legend, content, helperText, errorText
 * Размеры: sm, md, lg
 */
export const fieldSetRecipe = defineSlotRecipe({
    slots: ["root", "legend", "content", "helperText", "errorText"],
    base: {
        root: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "4",
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
        },
        legend: {
            fontWeight: "medium",
            color: "fg",
        },
        content: {
            display: "flex",
            flexDirection: "column",
            gap: "4",
        },
        helperText: {
            color: "fg.muted",
            fontSize: "sm",
        },
        errorText: {
            color: "red.500",
            fontSize: "sm",
        },
    },
    variants: {
        size: {
            sm: {
                legend: { fontSize: "sm" },
                helperText: { fontSize: "xs" },
                errorText: { fontSize: "xs" },
            },
            md: {
                legend: { fontSize: "md" },
                helperText: { fontSize: "sm" },
                errorText: { fontSize: "sm" },
            },
            lg: {
                legend: { fontSize: "lg" },
                helperText: { fontSize: "md" },
                errorText: { fontSize: "md" },
            },
        },
    },
    defaultVariants: {
        size: "md",
    },
});

export default fieldSetRecipe;
