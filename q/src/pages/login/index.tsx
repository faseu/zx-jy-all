import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { FormattedMessage, Helmet, getLocale, history, setLocale, useIntl } from '@umijs/max';
import { Alert, App, Button, Form, Input, Radio } from 'antd';
import React, { useEffect, useState } from 'react';
import { getCaptcha, login } from '@/services/ant-design-pro/api';
import type { BrandingConfig } from '@/services/branding';
import { pickBrandingText, queryBrandingConfig } from '@/services/branding';
import { recordClientOperation } from '@/pages/log/service';
import './index.less';

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return <Alert className="login-error" message={content} type="error" showIcon />;
};

const LOGIN_LOCALE_MAP = {
  arabic: 'ar-SA',
  english: 'en-US',
  chinese: 'zh-CN',
} as const;

const LOGIN_LANGUAGE_LABELS = {
  arabic: 'العربية',
  english: 'English',
  chinese: '中文',
} as const;

type LoginLanguage = keyof typeof LOGIN_LOCALE_MAP;

const getLoginLanguage = (locale = getLocale()): LoginLanguage => {
  if (locale === LOGIN_LOCALE_MAP.arabic) {
    return 'arabic';
  }
  if (locale === LOGIN_LOCALE_MAP.english) {
    return 'english';
  }
  return 'chinese';
};

const Login: React.FC = () => {
  const [form] = Form.useForm<API.LoginParams>();
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type] = useState<string>('account');
  const [lang, setLang] = useState<LoginLanguage>(() => getLoginLanguage());
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(false);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>();
  const { message } = App.useApp();
  const intl = useIntl();

  const refreshCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const msg = await getCaptcha();
      const captchaKey = msg?.data?.captchaKey;
      const captchaBase64 = msg?.data?.captchaBase64;

      form.setFieldValue('captchaCode', undefined);
      form.setFieldValue('captchaKey', captchaKey);
      setCaptchaImage(
        captchaBase64
          ? captchaBase64.startsWith('data:image')
            ? captchaBase64
            : `data:image/png;base64,${captchaBase64}`
          : ''
      );
    } catch (error) {
      console.log(error);
      setCaptchaImage('');
      form.setFieldValue('captchaKey', undefined);
      message.error(
        intl.formatMessage({
          id: 'pages.login.captcha.failure',
          defaultMessage: 'Get captcha failed, please retry.',
        })
      );
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    void refreshCaptcha();
    void queryBrandingConfig().then(setBrandingConfig).catch(() => undefined);
  }, []);

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const msg = await login({ ...values, type });
      if (msg.code === '00000') {
        const token = msg?.data?.accessToken;
        if (token) {
          localStorage.setItem('accessToken', token);
        }
        void recordClientOperation({
          content: '登录',
          actionCode: 'LOGIN',
          moduleCode: 'AUTH',
          path: '/login',
        }).catch(() => undefined);
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: 'Login successful!',
        });
        message.success(defaultLoginSuccessMessage);
        history.push(`/region`);
        return;
      }
      setUserLoginState(msg);
      void refreshCaptcha();
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: 'Login failed, please retry!',
      });
      console.log(error);
      message.error(defaultLoginFailureMessage);
      void refreshCaptcha();
    }
  };

  const { status, type: loginType } = userLoginState;
  const activeLoginLocale = LOGIN_LOCALE_MAP[lang];
  const handleLanguageChange = (value: LoginLanguage) => {
    setLang(value);
    setLocale(LOGIN_LOCALE_MAP[value], false);
  };
  const loginLogoUrl = brandingConfig?.logoUrl || '/logo.png';
  const loginBackgroundUrl = brandingConfig?.loginBackgroundUrl;
  const loginPageStyle = loginBackgroundUrl
    ? { backgroundImage: `url("${loginBackgroundUrl}")` }
    : undefined;

  return (
    <div className="login-page" style={loginPageStyle}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: 'Login',
          })}
        </title>
      </Helmet>
      <div className="login-brand">
        <img alt="logo" src={loginLogoUrl} />
        <span>{pickBrandingText(brandingConfig, 'brandName', activeLoginLocale)}</span>
      </div>
      <div className="login-panel">
        <div className="login-content">
          <div className="login-left">
            <div>
              <h2 className="login-welcome">
                {pickBrandingText(brandingConfig, 'loginWelcome', activeLoginLocale)}
              </h2>
              <div className="login-system-name">
                {pickBrandingText(brandingConfig, 'brandName', activeLoginLocale)}
              </div>
            </div>
            <div className="login-logo-wrap">
              <img alt="system-logo" src={loginLogoUrl} />
            </div>
          </div>
          <div className="login-right">
            <h2 className="login-title">
              {intl.formatMessage({
                id: 'pages.login.title',
                defaultMessage: 'Log In',
              })}
            </h2>
            <Form<API.LoginParams>
              form={form}
              className="login-form"
              initialValues={{
                username: 'admin',
                password: '123456',
              }}
              onFinish={handleSubmit}
            >
              <Form.Item name="captchaKey" hidden>
                <Input />
              </Form.Item>
              {status === 'error' && loginType === 'account' && (
                <LoginMessage
                  content={intl.formatMessage({
                    id: 'pages.login.accountLogin.errorMessage',
                    defaultMessage: 'Incorrect username or password.',
                  })}
                />
              )}
              <Form.Item
                className="login-field"
                name="username"
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.username.required"
                        defaultMessage="Please input username!"
                      />
                    ),
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.username.placeholder',
                    defaultMessage: 'User Name',
                  })}
                />
              </Form.Item>
              <Form.Item
                className="login-field"
                name="password"
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="Please input password!"
                      />
                    ),
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.password.placeholder',
                    defaultMessage: 'Password',
                  })}
                />
              </Form.Item>
              <div className="login-captcha-row">
                <Form.Item
                  className="login-field login-captcha-input"
                  name="captchaCode"
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.captcha.required"
                          defaultMessage="Please input verification code!"
                        />
                      ),
                    },
                  ]}
                >
                  <Input
                    prefix={<LockOutlined />}
                    placeholder={intl.formatMessage({
                      id: 'pages.login.captcha.placeholder',
                      defaultMessage: 'Verification Code',
                    })}
                  />
                </Form.Item>
                <button
                  type="button"
                  className="login-captcha-trigger"
                  onClick={() => void refreshCaptcha()}
                  aria-label="Refresh captcha"
                >
                  {captchaImage ? (
                    <img className="login-captcha-image" src={captchaImage} alt="captcha" />
                  ) : (
                    <span className="login-captcha-placeholder">
                      {captchaLoading
                        ? intl.formatMessage({
                            id: 'pages.login.captcha.loading',
                            defaultMessage: 'Loading...',
                          })
                        : intl.formatMessage({
                            id: 'pages.login.captcha.reload',
                            defaultMessage: 'Reload',
                          })}
                    </span>
                  )}
                </button>
              </div>
              <div className="login-language-row">
                <Radio.Group
                  value={lang}
                  onChange={(e) => handleLanguageChange(e.target.value as LoginLanguage)}
                >
                  <Radio value="arabic">{LOGIN_LANGUAGE_LABELS.arabic}</Radio>
                  <Radio value="english">{LOGIN_LANGUAGE_LABELS.english}</Radio>
                  <Radio value="chinese">{LOGIN_LANGUAGE_LABELS.chinese}</Radio>
                </Radio.Group>
              </div>
              <Button className="login-submit" type="primary" htmlType="submit">
                {intl.formatMessage({
                  id: 'pages.login.submit',
                  defaultMessage: 'Log In',
                })}
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
