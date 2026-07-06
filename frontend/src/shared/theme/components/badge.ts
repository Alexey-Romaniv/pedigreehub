"use client";

import { defineRecipe } from "@chakra-ui/react";
import { figmaTokens } from "../figma.tokens.generated";

export const badgeRecipe = defineRecipe({
    className: "badge",
    base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: figmaTokens.radii.button,
        textStyle: "labelMMedium",
        px: figmaTokens.space[12],
        py: figmaTokens.space[4],
        textTransform: "none",
        fontFamily: figmaTokens.fonts.body,
        textAlign: "center",
    },
    variants: {
        size: {
            sm: {
                px: figmaTokens.space[8],
                py: figmaTokens.space[2],
                textStyle: "labelS",
            },
            md: {
                px: figmaTokens.space[12],
                py: figmaTokens.space[4],
                textStyle: "labelMMedium",
            },
            lg: {
                px: "12px",
                py: "4px",
                textStyle: "labelMSemibold",
            },
        },
        colorPalette: {
            gray: {
                bg: "statusBackgroundGreyDark",
                color: "statusTextGreyDark",
            },
            blue: {
                bg: "statusBackgroundBlue",
                color: "statusTextBlue",
            },
            purple: {
                bg: "statusBackgroundPurple",
                color: "statusTextPurple",
            },
            orange: {
                bg: "statusTextOrange",
                color: "statusBackgroundOrange",
            },
            yellow: {
                bg: "statusTextOrange",
                color: "statusBackgroundOrange",
            },
            green: {
                bg: "statusBackgroundGreen",
                color: "statusTextGreen",
            },
            red: {
                bg: "statusBackgroundRed",
                color: "statusTextRed",
            },
            withdrawn: {
                bg: "statusBackgroundGreyLight",
                color: "statusTextGreyLight",
            },
            // Buy/Sell type badges with borders
            buy: {
                bg: "statusBackgroundGreen",
                color: "statusTextGreen",
                border: "1px solid",
                borderColor: "statusTextGreen",
            },
            sell: {
                bg: "statusBackgroundPurple",
                color: "statusTextPurple",
                border: "1px solid",
                borderColor: "statusTextPurple",
            },
        },
    },
    defaultVariants: {
        size: "sm",
        colorPalette: "gray",
    },
});

export default badgeRecipe;
