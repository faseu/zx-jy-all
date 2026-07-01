import { getLocale, request } from '@umijs/max';

export type BrandingConfig = {
  logoUrl?: string;
  loginLogoUrl?: string;
  loginBackgroundUrl?: string;
  brandNameZh?: string;
  brandNameEn?: string;
  brandNameAr?: string;
  loginBrandNameZh?: string;
  loginBrandNameEn?: string;
  loginBrandNameAr?: string;
  loginWelcomeZh?: string;
  loginWelcomeEn?: string;
  loginWelcomeAr?: string;
  loginSystemNameZh?: string;
  loginSystemNameEn?: string;
  loginSystemNameAr?: string;
};

type Result<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

export const defaultBrandingConfig: Required<BrandingConfig> = {
  logoUrl: '/logo.png',
  loginLogoUrl: '/logo.png',
  loginBackgroundUrl: '',
  brandNameZh: 'Srill 干扰管理系统',
  brandNameEn: 'Srill Jamming Management System',
  brandNameAr: 'Srill نظام إدارة التشويش',
  loginBrandNameZh: 'SRILL LIMITED',
  loginBrandNameEn: 'SRILL LIMITED',
  loginBrandNameAr: 'SRILL LIMITED',
  loginWelcomeZh: '欢迎使用',
  loginWelcomeEn: 'Salam, Welcome to',
  loginWelcomeAr: 'مرحبا بك في',
  loginSystemNameZh: '干扰管理系统',
  loginSystemNameEn: 'Jamming Management System',
  loginSystemNameAr: 'نظام إدارة التشويش',
};

export const normalizeAssetUrl = (value?: string) => {
  if (!value) {
    return '';
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      return url.pathname.startsWith('/file/') ? url.pathname : value;
    } catch {
      return value;
    }
  }
  return value.replace(/\\/g, '/');
};

export const mergeBrandingDefaults = (config?: BrandingConfig): Required<BrandingConfig> => ({
  ...defaultBrandingConfig,
  ...(config ?? {}),
  logoUrl: normalizeAssetUrl(config?.logoUrl) || defaultBrandingConfig.logoUrl,
  loginLogoUrl: normalizeAssetUrl(config?.loginLogoUrl) || defaultBrandingConfig.loginLogoUrl,
  loginBackgroundUrl: normalizeAssetUrl(config?.loginBackgroundUrl),
});

export const queryBrandingConfig = async () => {
  const result = await request<Result<BrandingConfig> | BrandingConfig>('/api/v1/branding');
  return mergeBrandingDefaults(('data' in result ? result.data : result) as BrandingConfig);
};

export const updateBrandingConfig = async (data: BrandingConfig) => {
  const result = await request<Result<BrandingConfig> | BrandingConfig>('/api/v1/branding', {
    method: 'PUT',
    data,
  });
  return mergeBrandingDefaults(('data' in result ? result.data : result) as BrandingConfig);
};

export const resolveBrandingLocale = (locale = getLocale()) => {
  if (locale === 'ar-SA' || locale === 'arabic') {
    return 'Ar';
  }
  if (locale === 'en-US' || locale === 'english') {
    return 'En';
  }
  return 'Zh';
};

export const pickBrandingText = (
  config: BrandingConfig | undefined,
  prefix: 'brandName' | 'loginBrandName' | 'loginWelcome' | 'loginSystemName',
  locale?: string
) => {
  const merged = mergeBrandingDefaults(config);
  const suffix = resolveBrandingLocale(locale);
  const key = `${prefix}${suffix}` as keyof BrandingConfig;
  return merged[key] || merged[`${prefix}Zh` as keyof BrandingConfig] || '';
};
