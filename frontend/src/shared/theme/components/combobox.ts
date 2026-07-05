"use client";

import { defineSlotRecipe } from "@chakra-ui/react";

export const comboboxRecipe = defineSlotRecipe({
    slots: [
        "root",
        "control",
        "input",
        "trigger",
        "clearTrigger",
        "content",
        "positioner",
        "item",
        "itemIndicator",
        "itemGroup",
        "itemGroupLabel",
        "label",
        "indicatorGroup",
        "empty",
    ],
    base: {
        root: {
            width: "100%",
            outline: "none",
        },
        control: {
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderRadius: "md",
            transition: "all 0.2s ease-in-out",
            overflow: "hidden",

            _focusVisible: {
                borderColor: "inputActive",
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
        },

        input: {
            width: "100%",
            outline: "none",
            border: "none",
            bg: "transparent",
            padding: "8px 16px",
            color: "contentBlack",
            _placeholder: {
                color: "contentSecondary",
            },
            _disabled: {
                cursor: "not-allowed",
                opacity: 0.6,
            },
        },

        indicatorGroup: {
            display: "flex",
            alignItems: "center",
            color: "contentGrey",
            zIndex: 999,
        },

        trigger: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "contentSecondary",
            _disabled: {
                cursor: "not-allowed",
                opacity: 0.6,
            },
        },

        positioner: {
            zIndex: 999,
        },

        content: {
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "lineSecondary",
            borderRadius: "md",
            boxShadow: "sm",
            maxH: "300px",
            overflowY: "auto",
            width: "100%",
            outline: "none",
        },

        empty: {
            p: "12px",
            color: "contentSecondary",
            fontSize: "14px",
        },

        item: {
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            textAlign: "left",
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

        /* Static label: always shown above the control and does not move on focus */
        label: {
            position: "relative",
            display: "block",
            mb: "2",
            backgroundColor: "transparent",
            paddingX: 0,
            fontWeight: "normal",
            pointerEvents: "none",
            transition: "none",
            zIndex: "auto",
            top: "auto",
            transform: "none",
            insetStart: "auto",
            fontSize: "{fontSizes.12}",
            color: "contentGrey",
        },
    },

    variants: {
        size: {
            xs: {
                control: {
                    h: "32px",
                    minH: "32px",
                },
                input: {
                    fontSize: "14",
                    px: "12",
                    py: "8",
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
                trigger: {
                    w: "16px",
                    h: "16px",
                },
            },
            sm: {
                control: {
                    h: "36px",
                    minH: "36px",
                },
                input: {
                    fontSize: "14",
                    px: "12",
                    py: "8",
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
                trigger: {
                    w: "16px",
                    h: "16px",
                },
            },
            md: {
                control: {
                    h: "36px",
                    minH: "36px",
                },
                input: {
                    fontSize: "{fontSizes.14}",
                    px: "16",
                    py: "8",
                },
                item: {
                    fontSize: "{fontSizes.14}",
                    px: "16",
                    py: "8",
                },
                itemGroupLabel: {
                    fontSize: "14",
                    px: "16",
                    py: "6",
                },
                clearTrigger: {
                    w: "18px",
                    h: "18px",
                },
                trigger: {
                    w: "18px",
                    h: "18px",
                },
            },
            lg: {
                control: {
                    h: "48px",
                    minH: "48px",
                },
                input: {
                    fontSize: "14",
                    px: "8px",
                    py: "12px",
                    textStyle: "labelMSemibold",
                },
                item: {
                    fontSize: "14",
                    px: "16",
                    py: "10",
                },
                itemGroupLabel: {
                    fontSize: "14",
                    px: "16",
                    py: "6",
                },
                clearTrigger: {
                    w: "20px",
                    h: "20px",
                },
                trigger: {
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
                    borderColor: "lineSecondary",
                    _hover: {
                        borderColor: "inputActive",
                    },
                    _focus: {
                        borderColor: "inputActive",
                    },
                    _disabled: {
                        borderColor: "lineSecondary",
                        bg: "backgroundGrey",
                    },
                },
            },
            subtle: {
                control: {
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "transparent",
                    bg: "backgroundGrey",
                    _hover: {
                        bg: "backgroundGreyDark",
                    },
                    _disabled: {
                        bg: "backgroundGrey",
                    },
                },
            },
        },
    },

    defaultVariants: {
        variant: "outline",
        size: "md",
    },
});

export default comboboxRecipe;
