import { Result } from 'antd';
import React from 'react';
import { useIntl } from '@umijs/max';

const NoPermission: React.FC = () => {
  const intl = useIntl();

  return (
    <Result
      status="403"
      title={intl.formatMessage({
        id: 'pages.account.noPermission',
        defaultMessage: '暂无权限',
      })}
    />
  );
};

export default NoPermission;
