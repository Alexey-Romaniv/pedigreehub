"use client";

import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Рецепт Slider для Chakra UI v3
 *
 * Использует токены из Figma для стилизации слайдера
 * Имеет размеры: sm, md, lg
 */
export const sliderRecipe = defineSlotRecipe({
    slots: [
        "root",
        "label",
        "control",
        "track",
        "range",
        "thumb",
        "valueText",
        "marker",
        "markerGroup",
        "markerIndicator",
    ],
    base: {
        root: {
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
            outline: "none",
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
        },
        control: {
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
        },
        label: {
            fontWeight: "regular",
            fontSize: "{fontSizes.14}",
            color: "contentGrey",
            mb: "2",
        },
        track: {
            bg: "linePrimary",
            overflow: "visible",
            height: "2px",
        },
        range: {
            top: "50%",
            transform: "translateY(-50%)",
            bg: "lineOrange",
            height: "4px",
            overflow: "visible",
        },
        thumb: {
            cursor: "pointer",
        },
        valueText: {
            fontSize: "{fontSizes.14}",
            color: "contentBlack",
            fontWeight: "medium",
            ml: "3",
        },
        markerGroup: {
            position: "absolute",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            pointerEvents: "none",
        },
        marker: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
        },
        markerIndicator: {
            width: "2px",
            height: "8px",
            bg: "lineSecondary",
            borderRadius: "full",
        },
    },
    variants: {
        size: {
            sm: {
                track: {
                    h: "4px",
                },
                thumb: {
                    w: "16px",
                    h: "16px",
                },
                label: {
                    fontSize: "{fontSizes.12}",
                },
                valueText: {
                    fontSize: "{fontSizes.12}",
                },
                markerIndicator: {
                    width: "1px",
                    height: "6px",
                },
            },
            md: {
                track: {
                    h: "2px",
                },
                thumb: {
                    w: "24px",
                    h: "24px",
                },
                label: {
                    fontSize: "{fontSizes.14}",
                },
                valueText: {
                    fontSize: "{fontSizes.14}",
                },
                markerIndicator: {
                    width: "2px",
                    height: "8px",
                },
            },
            lg: {
                track: {
                    h: "8px",
                },
                thumb: {
                    w: "24px",
                    h: "24px",
                },
                label: {
                    fontSize: "{fontSizes.16}",
                },
                valueText: {
                    fontSize: "{fontSizes.16}",
                },
                markerIndicator: {
                    width: "3px",
                    height: "10px",
                },
            },
        },
        variant: {
            solid: {
                range: {
                    bg: "lineOrange",
                },
                thumb: {
                    borderColor: "lineOrange",
                },
            },
            outline: {
                range: {
                    bg: "transparent",
                    borderWidth: "2px",
                    borderColor: "lineOrange",
                },
                thumb: {
                    borderColor: "lineOrange",
                    bg: "transparent",
                },
            },
        },
    },
    defaultVariants: {
        size: "md",
        variant: "solid",
    },
});

export default sliderRecipe;
