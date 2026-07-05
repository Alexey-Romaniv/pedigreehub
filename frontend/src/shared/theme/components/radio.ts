// src/shared/theme/components/radio.ts
"use client";

import { defineSlotRecipe } from "@chakra-ui/react";

export const radioRecipe = defineSlotRecipe({
    slots: ["root", "item", "itemHiddenInput", "itemControl", "itemText"],
    base: {
        root: {
            display: "flex",
            gap: "4",
        },
        item: {
            display: "inline-flex",
            alignItems: "center",
            gap: "2",
            cursor: "pointer",
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
        },
        itemControl: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: "1.4px",
            // borderColor: "lineSecondary",
            borderRadius: "full",
            width: "20px",
            height: "20px",
            color: "iconGreen",
            transition: "all 0.2s",
            // backgroundColor: "white",
            "&[data-state=checked]": {
                borderColor: "iconOrange !important",
                color: "iconOrange !important",
                _before: {
                    content: '""',
                    color: "iconGreen",
                    display: "inline-block",
                    borderRadius: "full",
                    bg: "iconGreen",
                },
            },
        },
        itemText: {
            color: "contentBlack",
            fontWeight: "normal",
        },
    },
    variants: {
        variant: {
            outline: {},
        },
        size: {
            sm: {
                itemControl: {
                    w: "16px",
                    h: "16px",
                    _checked: {},
                },
                itemText: {
                    fontSize: "14px",
                },
            },
            md: {
                itemControl: {
                    w: "20px",
                    h: "20px",
                    _checked: {},
                },
                itemText: {
                    fontSize: "16px",
                },
            },
            lg: {
                itemControl: {
                    width: "24px",
                    h: "24px",
                    _checked: {},
                },
                itemText: {
                    fontSize: "18px",
                },
            },
        },
    },
    defaultVariants: {
        size: "md",
        variant: "outline",
    },
});

export default radioRecipe;
