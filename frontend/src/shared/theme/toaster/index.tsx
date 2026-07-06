import { Toaster as ChakraToaster, Portal, Spinner, Stack, Toast, createToaster } from "@chakra-ui/react";

// Базовый toaster для компонента
const baseToaster = createToaster({
    placement: "top-end",
    pauseOnPageIdle: true,
});

// Экспортируем toaster с удобными методами
export const toaster = {
    ...baseToaster,
    
    success: (options: { title: string; description?: string }) => {
        baseToaster.create({
            type: "success",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
    
    error: (options: { title: string; description?: string }) => {
        baseToaster.create({
            type: "error",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
    
    info: (options: { title: string; description?: string }) => {
        baseToaster.create({
            type: "info",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
    
    warning: (options: { title: string; description?: string }) => {
        baseToaster.create({
            type: "warning",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
};

export const Toaster = () => {
    return (
        <Portal>
            <ChakraToaster toaster={baseToaster} insetInline={{ mdDown: "4" }}>
                {toast => (
                    <Toast.Root pointerEvents={"none"} width={{ base: "full", md: "sm" }}>
                        {toast.type === "loading" ? (
                            <Spinner size="sm" color="blue.solid" />
                        ) : (
                            <Toast.Indicator />
                        )}
                        <Stack gap="1" flex="1" maxWidth="100%">
                            {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                            {toast.description && (
                                <Toast.Description>{toast.description}</Toast.Description>
                            )}
                        </Stack>
                        {toast.action && (
                            <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
                        )}
                        {toast.meta?.closable && <Toast.CloseTrigger cursor={"pointer"} />}
                    </Toast.Root>
                )}
            </ChakraToaster>
        </Portal>
    );
};
