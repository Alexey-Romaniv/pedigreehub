import { numberInputAnatomy } from "@chakra-ui/react/anatomy";
import { defineSlotRecipe } from "@chakra-ui/react";

const numberInputRecipe = defineSlotRecipe({
    slots: numberInputAnatomy.keys(),
    base: {
        input: {
            outline: "none",
            outlineWidth: "0px",
            borderColor: "input",
            transition: "all 0.2s ease-in-out",
            _focusVisible: {
                borderColor: "inputActive",
                outline: "none",
                outlineWidth: "0px",
            },
            _hover: {
                borderColor: "inputActive",
                outlineWidth: "0px",
            },
            _focusWithin: {
                borderColor: "inputActive",
                outlineWidth: "0px",
            },
            _active: {
                borderColor: "inputActive",
                outlineWidth: "0px",
            },
            _disabled: {
                opacity: 0.6,
                cursor: "not-allowed",
            },
            _invalid: {
                borderColor: "negative",
            },
        },
    },
    variants: {
        size: {
            lg: {
                input: {
                    fontSize: "14",
                    px: "8px",
                    py: "12px",
                    textStyle: "labelMSemibold",
                    h: "48px",
                },
            },
        },
    },
});

export default numberInputRecipe;
