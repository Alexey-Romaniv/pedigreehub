"use client";

import { defineRecipe } from "@chakra-ui/react";

/**
 * Рецепт кнопки для Chakra UI v3
 *
 * Использует токены из Figma для стилизации кнопки
 * Имеет варианты: solid, outline, ghost, link
 * Имеет размеры: sm, md, lg
 */

export const buttonRecipe = defineRecipe({
    // className: "button",
    base: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "buttonBorder",
        transition: "all 0.2s ease-in-out",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
        textAlign: "center",
        lineHeight: "1.2",
        outline: "none",
        position: "relative",
        whiteSpace: "nowrap",
        userSelect: "none",
    
        _disabled: {
            color: "contentGrey",
            backgroundColor: "buttonInactive",
            cursor: "not-allowed",
            boxShadow: "none",
            pointerEvents: "none",
            textStyle: "labelM",
            opacity: 1
        },
    },
    variants: {
        variant: {
            solid: {
                bg: "buttonOrange",
                color: "buttonTextWhiteB",
                _hover: {
                    bg: "buttonOrange",
                    filter: "brightness(0.9)", // вместо opacity
                    _disabled: {
                        bg: "buttonOrange",
                        filter: "none",
                    },
                },
                _active: {
                    opacity: 0.8,
                },
                _disabled: {
                    bg: "buttonInactive",
                    color: "contentGrey",
                    fontWeight: "normal",
                },
            },
            outline: {
                bg: "transparent",
                color: "buttonTextBlack",
                borderWidth: "1px",
                borderColor: "linePrimary",

                _hover: {
                    bg: "backgroundGrey",
                    _disabled: {
                        bg: "linePrimary",
                    },
                },
                _active: {
                    bg: "backgroundGrey",
                },
                _disabled: {
                    bg: "transparent",
                    color: "contentGrey",
                    borderColor: "buttonBorderA",
                },
            },
            ghost: {
                bg: "transparent",
                color: "contentBlack",
                _hover: {
                    bg: "backgroundGrey",
                    
                },
                _active: {
                    bg: "backgroundGrey",
                },
                _disabled: {
                    bg: "transparent",
                },
            },
            link: {
                bg: "transparent",
                color: "buttonOrange",
                height: "auto",
                padding: 0,
                verticalAlign: "baseline",
                lineHeight: "normal",
                _hover: {
                    textDecoration: "underline",
                    _disabled: {
                        textDecoration: "none",
                    },
                },
                _active: {
                    color: "green.700",
                },
            },
            unstyled: {
                bg: "transparent",
                color: "inherit",
                display: "inline",
                lineHeight: "inherit",
                m: 0,
                p: 0,
                height: "auto",
                minHeight: "auto",
                border: "none",
                borderRadius: 0,
                fontWeight: "inherit",
                _hover: {
                    bg: "transparent",
                },
                _active: {
                    bg: "transparent",
                },
                _focus: {
                    boxShadow: "none",
                },
            },
        },
        size: {
            sm: {
                fontSize: "12",
                px: "12",
                py: "8",
                h: "auto",
                minH: "32px",
            },
            md: {
                fontSize: "14",
                px: "16",
                py: "8",
                h: "auto",
                minH: "36px",
            },
            lg: {
                fontSize: "16",
                px: "12",
                py: "8",
                h: "auto",
                minH: "48px",
            },
        },
        radius: {
            none: {
                borderRadius: "none",
            },
            sm: {
                borderRadius: "textfield",
            },
            md: {
                borderRadius: "button",
            },
        },
    },
    defaultVariants: {
        variant: "solid",
        size: "md",
        radius: "sm",
    },
    compoundVariants: [
        {
            variant: "link",
            size: ["sm", "md", "lg"],
            css: {
                px: 0,
                py: 0,
                minH: "auto",
                h: "auto",
            },
        },
    ],
});

export default buttonRecipe;
