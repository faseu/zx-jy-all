import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { FormattedMessage, Helmet, SelectLang, useIntl } from '@umijs/max';
import { Alert, App } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { login } from '@/services/ant-design-pro/api';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: '100vw',
      height: '100vh',
      backgroundImage:
        'https://infinitypro-img.infinitynewtab.com/wallpaper/ocean/18438.jpg?attname=infinity-1223146.jpg',
      backgroundSize: '100% 100%',
    },
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type] = useState<string>('account');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();
  const t = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const msg = await login({ ...values, type });
      if (msg.code === '00000') {
        const token = msg?.data?.accessToken;
        if (token) {
          localStorage.setItem('accessToken', token);
        }
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: 'Login successful!',
        });
        message.success(defaultLoginSuccessMessage);
        console.log(msg);
        window.location.href = '/region';
        return;
      }
      console.log(msg);
      setUserLoginState(msg);
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: 'Login failed, please try again!',
      });
      console.log(error);
      message.error(defaultLoginFailureMessage);
    }
  };
  const { status, type: loginType } = userLoginState;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: 'Login',
          })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <Lang />
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.png" />}
          title="Salam"
          subTitle={intl.formatMessage({
            id: 'pages.layouts.userLayout.title',
            defaultMessage: 'Salam, Welcome toJamming Managment System',
          })}
          initialValues={{
            autoLogin: true,
            username: 'admin',
            password: '123456',
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
          submitter={{
            searchConfig: {
              submitText: t('pages.login.submit', 'Login'),
            },
          }}
        >
          {status === 'error' && loginType === 'account' && (
            <LoginMessage
              content={intl.formatMessage({
                id: 'pages.login.accountLogin.errorMessage',
                defaultMessage: 'Incorrect username or password.',
              })}
            />
          )}
          <>
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.login.username.placeholder',
                defaultMessage: 'Username',
              })}
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
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.login.password.placeholder',
                defaultMessage: 'Password',
              })}
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
            />
          </>
        </LoginForm>
      </div>
    </div>
  );
};

export default Login;
