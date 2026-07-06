import { ThemeProviderProps } from "next-themes";
import { IconButtonProps } from "@chakra-ui/react";
import type { SpanProps } from "@chakra-ui/react";
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import * as React from "react";
import { useColorMode } from "./utils";
import { LuMoon, LuSun } from "react-icons/lu";
import { _t, locKeys } from "@/shared/localization";

export function ColorModeProvider(props: ThemeProviderProps) {
    return <ThemeProvider defaultTheme="light" attribute="class" disableTransitionOnChange {...props} />;
}

export function ColorModeIcon() {
    const { colorMode } = useColorMode();
    return colorMode === "dark" ? <LuMoon /> : <LuSun />;
}

export const ColorModeButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    function ColorModeButton(props, ref) {
        const { toggleColorMode } = useColorMode();
        return (
            <ClientOnly fallback={<Skeleton boxSize="8" />}>
                <IconButton
                    onClick={toggleColorMode}
                    variant="ghost"
                    aria-label={_t(locKeys.UI_COMPONENTS.ARIA_LABELS.TOGGLE_COLOR_MODE)}
                    size="sm"
                    ref={ref}
                    {...props}
                    css={{
                        _icon: {
                            width: "5",
                            height: "5",
                            color: "yellow.400",
                            _dark: {
                                color: "yellow.200",
                            },
                        },
                    }}
                >
                    <ColorModeIcon />
                </IconButton>
            </ClientOnly>
        );
    }
);

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(
    function LightMode(props, ref) {
        return (
            <Span
                color="fg"
                display="contents"
                className="chakra-theme light"
                colorPalette="gray"
                colorScheme="light"
                ref={ref}
                {...props}
            />
        );
    }
);

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(function DarkMode(props, ref) {
    return (
        <Span
            color="fg"
            display="contents"
            className="chakra-theme dark"
            colorPalette="gray"
            colorScheme="dark"
            ref={ref}
            {...props}
        />
    );
});
