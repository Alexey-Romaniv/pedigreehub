"use client";

import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { figmaTokens } from "./figma.tokens.generated";
import buttonRecipe from "./components/button";
import fieldRecipe from "./components/field";
import formInputRecipe from "./components/formInput";
import fieldSetRecipe from "./components/fieldSet";
import radioRecipe from "./components/radio";
import checkboxRecipe from "./components/checkbox";
import selectRecipe from "./components/select";
import badgeRecipe from "./components/badge";
import comboboxRecipe from "./components/combobox";
import tabsSlotRecipe from "./components/tabs";
import numberInputRecipe from "./components/numberInput";
import { textStyles } from "./components/text.generated";

import textareaRecipe from "./components/textarea";
import sliderRecipe from "./components/slider";
import nativeSelectRecipe from "./components/nativeSelect";
import tooltipRecipe from "./components/tooltip";

// Преобразуем semanticColors в формат семантических токенов Chakra
const semanticTokens = {
    colors: {} as Record<string, any>,
};

// Преобразуем light и dark семантические цвета из figmaTokens в формат с _light и _dark
Object.entries(figmaTokens.semanticColors.light).forEach(([category, categoryValues]) => {
    Object.entries(categoryValues as Record<string, any>).forEach(([key, lightValue]) => {
        // Получаем соответствующее значение из dark темы
        const darkValue = (figmaTokens.semanticColors.dark as Record<string, any>)[category]?.[key];

        // Используем только имя токена без префикса категории
        const tokenKey = key;

        // Создаем токен в формате, который требуется для Chakra UI v3
        semanticTokens.colors[tokenKey] = {
            value: {
                _light: lightValue,
                _dark: darkValue || lightValue,
            },
        };
    });
});

// «Документальная» тёплая гамма: бумажные оттенки поверх фигмовских значений (только light).
// Тёмная тема остаётся нетронутой.
const warmLightOverrides: Record<string, string> = {
    backgroundPrimary: "#fdfcfa",
    backgroundGrey: "#f4f0e8",
    backgroundSecondary01: "#fdfcfa",
    backgroundSecondary02: "#fdfcfa",
    backgroundSecondary03: "#f4f0e8",
    backgroundGreyA: "#f4f0e8",
    backgroundGreyB: "#f4f0e800",
    linePrimary: "#eae4d8",
    lineSecondary: "#d9d1c2",
};

Object.entries(warmLightOverrides).forEach(([key, value]) => {
    if (semanticTokens.colors[key]) {
        semanticTokens.colors[key].value._light = value;
    }
});

// У предупреждения (жёлто-оранжевого) нет токена в Figma: `warning`/`iconOrange`
// это брендовый оранжевый (тот же, что у CTA), а `statusTextOrange` предназначен
// для цветной плашки. Для иконок и подписей предупреждений на светлом фоне добавляем
// приглушённый, «бумажный» янтарь.
semanticTokens.colors.iconWarning = {
    value: { _light: "#b0761f", _dark: "#ffb56d" },
};

// Дополнительные текстовые стили «документального» направления (serif display + mono).
// Генерированные стили из Figma не трогаем — только расширяем.
const displayFontStack = "'Fraunces', Georgia, 'Times New Roman', serif";
const monoFontStack = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const customTextStyles = {
    displaySerifXL: {
        value: {
            fontFamily: displayFontStack,
            fontWeight: 560,
            fontSize: "2.5rem",
            lineHeight: "1.08",
            letterSpacing: "-0.02em",
            lg: {
                fontSize: "3.75rem",
                lineHeight: "1.05",
            },
        },
    },
    titleSerifXL: {
        value: {
            fontFamily: displayFontStack,
            fontWeight: 560,
            fontSize: "1.625rem",
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
            lg: {
                fontSize: "2rem",
                lineHeight: "1.15",
            },
        },
    },
    titleSerifL: {
        value: {
            fontFamily: displayFontStack,
            fontWeight: 560,
            fontSize: "1.25rem",
            lineHeight: "1.3",
            lg: {
                fontSize: "1.375rem",
                lineHeight: "1.3",
            },
        },
    },
    labelMono: {
        value: {
            fontFamily: monoFontStack,
            fontWeight: 500,
            fontSize: "0.75rem",
            lineHeight: "1rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
        },
    },
    labelMonoS: {
        value: {
            fontFamily: monoFontStack,
            fontWeight: 400,
            fontSize: "0.6875rem",
            lineHeight: "1rem",
            letterSpacing: "0.06em",
        },
    },
};

// Преобразуем токены в формат, который ожидает Chakra UI
const transformTokens = (obj: Record<string, any>) => {
    const result: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null) {
            result[key] = transformTokens(value);
        } else {
            result[key] = { value };
        }
    });

    return result;
};

// Создаем конфигурацию темы для Chakra UI
const config = defineConfig({
    strictTokens: true,
    globalCss: {
        "*": {
            boxSizing: "border-box",
            margin: 0,
            padding: 0,
        },
        "html, body": {
            color: "contentBlack01",
            backgroundColor: "backgroundPrimary",
            fontFamily: "Nunito Sans",
            minHeight: "100dvh",
        },
        ".leaflet-top": {
            zIndex: "999 !important",
        },
        a: {
            color: "contentBlack01",
            textDecoration: "none",
        },
        "input::-webkit-outer-spin-button, input::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
        } as any,
        label: {
            zIndex: 1,
        },
        "::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
        },
        "::-webkit-scrollbar-track": {
            background: "transparent",
        },
        "::-webkit-scrollbar-thumb": {
            backgroundColor: "linePrimary",
            borderRadius: "6px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
        },
        "::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "lineSecondary",
        },
        "select[data-native-select-field]": {
            appearance: "none",
            WebkitAppearance: "none",
        },
    },
    theme: {
        // Основные токены цветов
        tokens: {
            colors: transformTokens(figmaTokens.colors),
            spacing: transformTokens(figmaTokens.space),
            fontSizes: transformTokens(figmaTokens.fontSizes),
            fonts: {
                ...transformTokens(figmaTokens.fonts),
                display: { value: displayFontStack },
                mono: { value: monoFontStack },
            },
            fontWeights: transformTokens(figmaTokens.fontWeights),
            lineHeights: transformTokens(figmaTokens.lineHeights),
            radii: transformTokens(figmaTokens.radii),
            borders: transformTokens(figmaTokens.borders),
            // Chakra v3 не имеет встроенных container.* — без них maxW="container.xl" не работает
            sizes: {
                container: {
                    sm: { value: "40rem" },
                    md: { value: "48rem" },
                    lg: { value: "64rem" },
                    xl: { value: "80rem" },
                },
            },
        },

        // Семантические токены, которые меняются в зависимости от темы
        semanticTokens: semanticTokens,
        recipes: {
            badge: badgeRecipe,
            button: buttonRecipe,
            input: formInputRecipe,
            // text: textRecipe,
            textarea: textareaRecipe,
        },
        slotRecipes: {
            field: fieldRecipe,
            fieldSet: fieldSetRecipe,
            radioGroup: radioRecipe,
            checkbox: checkboxRecipe,
            select: selectRecipe,
            nativeSelect: nativeSelectRecipe,
            combobox: comboboxRecipe,
            slider: sliderRecipe,
            tabs: tabsSlotRecipe,
            numberInput: numberInputRecipe,
            tooltip: tooltipRecipe,
        },
        textStyles: {
            ...textStyles,
            ...customTextStyles,
        },
    },
});

// Создаем систему стилей
export const system = createSystem(defaultConfig, config);

// Экспортируем по умолчанию для удобства
export default system;
