import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  "navTheme": "light",
  "colorPrimary": "#1890ff",
  "layout": "top",
  "contentWidth": "Fixed",
  "fixedHeader": true,
  "fixSiderbar": true,
  "pwa": true,
  "logo": "./logo.png",
  "token": {},
  "title": 'Salam',
  "splitMenus": false
};

export default Settings;
