"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "./theme";
import { ColorModeProvider } from "./color-mode";
import { Toaster } from "./toaster";
import { ThemeProviderProps } from "next-themes";

export function UIProvider(props: ThemeProviderProps) {
    return (
        <ChakraProvider value={system}>
            <ColorModeProvider {...props} />
            <Toaster />
        </ChakraProvider>
    );
}
