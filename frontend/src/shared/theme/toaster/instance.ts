import { createToaster } from "@chakra-ui/react";

const chakraToaster = createToaster({
    placement: "top-end",
    pauseOnPageIdle: true,
});

// Обёртка с удобными методами
export const toaster = {
    ...chakraToaster,
    
    success: (options: { title: string; description?: string }) => {
        chakraToaster.create({
            type: "success",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
    
    error: (options: { title: string; description?: string }) => {
        chakraToaster.create({
            type: "error",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
    
    info: (options: { title: string; description?: string }) => {
        chakraToaster.create({
            type: "info",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
    
    warning: (options: { title: string; description?: string }) => {
        chakraToaster.create({
            type: "warning",
            title: options.title,
            description: options.description,
            meta: { closable: true },
        });
    },
    
    loading: (options: { title: string; description?: string }) => {
        return chakraToaster.create({
            type: "loading",
            title: options.title,
            description: options.description,
        });
    },
};
