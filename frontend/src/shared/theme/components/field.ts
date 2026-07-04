import { defineSlotRecipe } from "@chakra-ui/react";

export const fieldRecipe = defineSlotRecipe({
    slots: ["root", "label", "errorText"],
    base: {
        root: {
            width: "100%",
            position: "relative",
            gap: "4px",
            _peerPlaceholderShown: {
                "& label": {
                    top: "50%",
                    transform: "translateY(-50%)",
                    insetStart: "3",
                },
            },
        },
        label: {
            fontWeight: "400",
            fontSize: "12px",
            color: "contentGrey",
            pl: "8px",

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

            // _peerPlaceholderShown: {
            //     top: "50%",
            //     transform: "translateY(-50%)",
            //     insetStart: "3",
            // },

            // _peerFocusVisible: {
            //     color: "brand01",
            //     top: "-3",
            //     insetStart: "2",
            //     transform: "translateY(0%)",
            // },
        },
        errorText: {
            color: "red.500",
            fontSize: "{fontSizes.12}",
        },
    },
    variants: {
        type: {
            classic: {
                root: { bg: "red.500" },
            },
        },
    },
});

export default fieldRecipe;
