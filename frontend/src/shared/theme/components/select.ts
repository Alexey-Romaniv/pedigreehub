"use client";

import { defineSlotRecipe } from "@chakra-ui/react";
import { figmaTokens } from "../figma.tokens.generated";

/**
 * Рецепт Select для Chakra UI v3
 *
 * Использует токены из Figma для стилизации селекта
 * Имеет варианты: outline, subtle
 * Имеет размеры: xs, sm, md, lg
 */
export const selectRecipe = defineSlotRecipe({
    slots: [
        "root",
        "control",
        "label",
        "trigger",
        "valueText",
        "indicator",
        "clearTrigger",
        "content",
        "item",
        "itemIndicator",
        "itemGroup",
        "itemGroupLabel",
    ],
    base: {
        root: {
            width: "100%",
            outline: "none",
            position: "relative",
        },
        control: {
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderRadius: "sm",
            transition: "all 0.2s ease-in-out",
            overflow: "hidden",
            color: "contentBlack",
            borderColor: "input",
            _focusVisible: {
                borderColor: "inputActive",
                boxShadow: `0 0 0 1px ${figmaTokens.semanticColors.light.button.buttonOrangeActive}`,
                outline: "none",
            },
            _invalid: {
                borderColor: "red.500",
                boxShadow: "0 0 0 1px red.500",
            },
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
            _placeholder: {
                color: "contentGrey",
                textStyle: "labelS",
                fontWeight: "400",
            },
  
        },

        trigger: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderWidth: "0px",
            border: "none",
            cursor: "pointer",
            _disabled: {
                cursor: "not-allowed",
                opacity: 0.6,
            },
            _placeholder: {
                color: "contentGrey",
                textStyle: "labelS",
                fontWeight: "400",
            },
        },

        valueText: {
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textStyle: "labelSSemibold",
            _placeholder: {
                color: "contentGrey",
                textStyle: "labelS",
                fontWeight: "400",
            },
        },

        content: {
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "lineSecondary",
            borderRadius: "md",
            boxShadow: "sm",
            zIndex: 100000,
            maxH: "300px",
            overflowY: "auto",
            width: "100%",
            outline: "none",
            _placeholder: {
                color: "contentGrey",
                textStyle: "labelS",
                fontWeight: "400",
            },
        },

        item: {
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            textAlign: "left",
            color: "contentBlack",

            _selected: {
                bg: "backgroundGrey",
                color: "contentBlack",
                fontWeight: "medium",
            },
            _highlighted: {
                bg: "backgroundGrey",
            },
            _hover: {
                bg: "backgroundGreyDark",
            },
            _disabled: {
                opacity: 0.5,
                cursor: "not-allowed",
                pointerEvents: "none",
            },
        },

        itemIndicator: {
            color: "buttonOrange",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
        },

        clearTrigger: {
            color: "contentSecondary",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: "0px",
            cursor: "pointer",
            borderRadius: "full",
            _hover: {
                bg: "backgroundGrey",
                color: "contentBlack",
            },
            _disabled: {
                opacity: 0.5,
                cursor: "not-allowed",
            },
        },

        itemGroup: {
            width: "100%",
        },

        itemGroupLabel: {
            fontWeight: "medium",
            color: "contentSecondary",
            textAlign: "left",
            width: "100%",
        },

        label: {
            fontSize: "{fontSizes.12}",
            color: "contentGrey",
            _placeholder: {
                color: "contentGrey",
                textStyle: "labelS",
                fontWeight: "400",
            },
            // position: "absolute",
            // backgroundColor: "backgroundPrimary",
            // paddingX: "0.5",
            // top: "-3",
            // insetStart: "2",
            // fontWeight: "normal",
            // pointerEvents: "none",
            // transition: "all 0.2s ease-in-out",
            // color: "contentGrey",
            // fontSize: "{fontSizes.12}",
            // transform: "translateY(0%)",
            // zIndex: 1,

            // '&[data-placeholder-shown="true"]': {
            //     top: "50%",
            //     transform: "translateY(-50%)",
            //     insetStart: "3",
            //     fontSize: "{fontSizes.12}",
            // },

            // 'div[data-focus] ~ &, [data-state="open"] ~ &': {
            //     color: "buttonGreen",
            // },
        },
    },

    variants: {
        size: {
            xs: {
                control: {
                    h: "32px",
                    minH: "32px",
                },
                trigger: {
                    fontSize: "14",
                    px: "12",
                    py: "8",
                },
                valueText: {
                    fontSize: "14",
                },
                item: {
                    fontSize: "14",
                    px: "12",
                    py: "6",
                },
                itemGroupLabel: {
                    fontSize: "12",
                    px: "12",
                    py: "4",
                },
                clearTrigger: {
                    w: "16px",
                    h: "16px",
                },
            },
            sm: {
                control: {
                    h: "36px",
                    minH: "36px",
                },
                trigger: {
                    fontSize: "14",
                    px: "12",
                    py: "8",
                },
                valueText: {
                    fontSize: "14",
                },
                item: {
                    fontSize: "14",
                    px: "12",
                    py: "8",
                },
                itemGroupLabel: {
                    fontSize: "12",
                    px: "12",
                    py: "4",
                },
                clearTrigger: {
                    w: "16px",
                    h: "16px",
                },
            },
            md: {
                control: {
                    h: "36px",
                    minH: "36px",
                },
                trigger: {
                    fontSize: "{fontSizes.14}",
                    px: "16",
                    py: "8",
                    h: "36px",
                    minH: "36px",
                },
                valueText: {
                    fontSize: "{fontSizes.14}",
                },
                item: {
                    fontSize: "{fontSizes.14}",
                    px: "16",
                    py: "8",
                },
                itemGroupLabel: {
                    fontSize: "14px",
                    px: "16",
                    py: "6",
                },
                clearTrigger: {
                    w: "18px",
                    h: "18px",
                },
            },
            lg: {
                control: {
                    h: "48px",
                    minH: "48px",
                },
                trigger: {
                    fontSize: "14px",
                    px: "8px",
                    py: "12px",
                },
                valueText: {
                    fontSize: "14px",
                },
                item: {
                    fontSize: "14px",
                    px: "8px",
                    py: "12px",
                },
                itemGroupLabel: {
                    fontSize: "14px",
                    px: "8px",
                    py: "6",
                },
                clearTrigger: {
                    w: "20px",
                    h: "20px",
                },
            },
        },
        variant: {
            outline: {
                control: {
                    borderWidth: "1px",
                    borderStyle: "solid",
                    _active: {
                        borderColor: "inputActive",
                    },
                    _focus: {
                        borderColor: "inputActive",
                    },
                    _focusWithin: {
                        borderColor: "inputActive",
                    },
                    _hover: {
                        borderColor: "inputActive",
                    },
                },
            },
            subtle: {
                control: {
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "transparent",
                    _hover: {
                        bg: "backgroundGreyDark",
                    },
                    _disabled: {},
                },
            },
        },
    },

    defaultVariants: {
        variant: "outline",
        size: "md",
    },
});

export default selectRecipe;
