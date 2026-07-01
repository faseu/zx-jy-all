import component from './ar-SA/component';
import globalHeader from './ar-SA/globalHeader';
import menu from './ar-SA/menu';
import pages from './ar-SA/pages';
import pwa from './ar-SA/pwa';
import settingDrawer from './ar-SA/settingDrawer';
import settings from './ar-SA/settings';

export default {
  'navBar.lang': 'اللغات',
  'layout.user.link.help': 'المساعدة',
  'layout.user.link.privacy': 'الخصوصية',
  'layout.user.link.terms': 'الشروط',
  'app.preview.down.block': 'قم بتحميل هذه الصفحة إلى مشروعك المحلي',
  'app.welcome.link.fetch-blocks': 'احصل على جميع الكتل',
  'app.welcome.link.block-list':
    'إنشاء سريع لصفحات قياسية بناءً على تطوير `block`',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,
};
