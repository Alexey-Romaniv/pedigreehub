"use client";

import { defineRecipe } from "@chakra-ui/react";

/**
 * Рецепт инпута формы для Chakra UI v3
 *
 * Использует токены из Figma для стилизации инпута
 * Имеет варианты: outline, filled
 * Имеет размеры: sm, md, lg
 */
export const formInputRecipe = defineRecipe({
    className: "form-input peer",
    base: {
        width: "100%",
        borderRadius: "4px",
        transition: "all 0.2s ease-in-out",
        outline: "none",
        outlineWidth: "0px !important",
        fontWeight: "medium",
        color: "contentBlack01",
        boxSizing: "border-box",
        borderColor: "input",
    

        _hover: {
            borderColor: "inputActive",
            outlineWidth: "0",
        },
        _focus: {
            borderColor: "inputActive",
            outlineWidth: "0",
        },
        _focusWithin:{
            borderColor: "inputActive",
            outlineWidth: "0",
        },
        _placeholder: {
            color: "contentGrey",
            textStyle: "{fontSizes.12}",
        },
        _focusVisible: {
            borderColor: "inputActive",
            outline: "none",
            outlineWidth: "0px !important",
        },
        _active: {
            borderColor: "inputActive",
            outline: "none",
            outlineWidth: "0",
        },
        _invalid: {
            borderColor: "red.500",
            boxShadow: "0 0 0 1px red.500",
            _focusVisible: {
                borderColor: "red.500",
                boxShadow: "0 0 0 1px red.500",
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
                outline: "none",
                borderColor: "input",
                outlineWidth: "0px !important",
            },
            filled: {
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "transparent",
                _hover: {
                    backgroundColor: "backgroundGreyDark",
                },
            },
        },
        size: {
            sm: {
                fontSize: "12px",
                px: "12",
                py: "8",
                h: "36px",
            },
            md: {
                fontSize: "12px",
                px: "16",
                py: "8",
                h: "36px",
            },
            lg: {
                fontSize: "14",
                px: "8px",
                py: "12px",
                textStyle: "labelMSemibold",
                h: "48px",
            },
        },
    },
    defaultVariants: {
        variant: "outline",
        size: "md",
    },
});

export default formInputRecipe;
