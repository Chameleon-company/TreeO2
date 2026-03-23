interface PlaceholderOptions {
  moduleName: string;
  message?: string;
}

export const buildModuleScaffoldResponse = ({
  moduleName,
  message,
}: PlaceholderOptions) => ({
  success: true,
  data: {
    module: moduleName,
    status: 'scaffolded' as const,
  },
  message: message ?? `${moduleName} module scaffold is ready for implementation.`,
});
