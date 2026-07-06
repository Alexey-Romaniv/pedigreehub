import { tabsAnatomy } from "@chakra-ui/react/anatomy";
import { defineSlotRecipe } from "@chakra-ui/react";

const tabsSlotRecipe = defineSlotRecipe({
    slots: tabsAnatomy.keys(),
    base: {
        list: {
            color: "contentGrey",
        },
        trigger: {
            color: "inherit",
            textStyle: "labelM",
            _selected: {
                color: "white !important",
                textStyle: "labelMSemibold",
            },
        },
        indicator: {
            backgroundColor: "white !important",
        },
    },
});
export default tabsSlotRecipe;
