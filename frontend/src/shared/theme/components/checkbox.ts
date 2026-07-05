// src/shared/theme/components/checkbox.ts
"use client";

import { defineSlotRecipe } from "@chakra-ui/react";

export const checkboxRecipe = defineSlotRecipe({
    slots: ["root", "control", "label", "input"],
    base: {
        root: {
            display: "flex",
            alignItems: "center",

            cursor: "pointer",
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
            gap: "8px",
        },
        control: {
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderWidth: "1.4px",
            borderColor: "iconGrey",
            transition: "all 0.2s",
            background: "transparent",
            _checked: {
                color: "white !important",
                borderColor: "iconOrange !important",
                background: "iconOrange !important",
            },
            _hover: {
                borderColor: "iconOrange",
            },
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
        },
        label: {
            userSelect: "none",
            textStyle: "labelMSemibold",
            fontWeight: "semibold",
        },
    },
    variants: {
        size: {
            sm: {
                control: {
                    w: "16px",
                    h: "16px",
                    borderRadius: "4px",
                    "& svg": {
                        width: "10px",
                        height: "10px",
                    },
                },
            },
            md: {
                control: {
                    w: "20px",
                    h: "20px",
                    borderRadius: "6px",
                    "& svg": {
                        width: "20px",
                        height: "20px",
                    },
                },
            },
            lg: {
                control: {
                    w: "24px",
                    h: "24px",
                    borderRadius: "8px",
                    "& svg": {
                        width: "14px",
                        height: "14px",
                    },
                },
            },
        },
        radius: {
            none: {
                control: {
                    borderRadius: "none",
                },
            },
            sm: {
                control: {
                    borderRadius: "4px",
                },
            },
            md: {
                control: {
                    borderRadius: "textfield",
                },
            },
            lg: {
                control: {
                    borderRadius: "button",
                },
            },
            full: {
                control: {
                    borderRadius: "full",
                },
            },
        },
    },
    defaultVariants: {
        size: "md",
        radius: "sm",
    },
});

export default checkboxRecipe;
