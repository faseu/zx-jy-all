import type { OperLogRecord } from './service';

type MessageFormatter = {
  formatMessage: (
    descriptor: { id: string; defaultMessage?: string },
    values?: Record<string, string | number>
  ) => string;
};

export const ACTION_CODES = [
  'LOGIN',
  'LOGOUT',
  'VIEW',
  'CLICK',
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
] as const;

export const MODULE_CODES = [
  'AUTH',
  'REGION',
  'USER',
  'DEVICE',
  'ALARM',
  'DATA',
  'LOG',
  'SYSTEM',
] as const;

export const getModuleCodeByPath = (path?: string) => {
  if (!path) return 'SYSTEM';
  if (path.includes('/login')) return 'AUTH';
  if (path.includes('/region')) return 'REGION';
  if (path.includes('/account')) return 'USER';
  if (path.includes('/machine')) return 'DEVICE';
  if (path.includes('/alarm')) return 'ALARM';
  if (path.includes('/data')) return 'DATA';
  if (path.includes('/log')) return 'LOG';
  return 'SYSTEM';
};

export const getActionCodeByText = (text: string) => {
  if (/log\s*out|logout|退出登录|退出/i.test(text)) return 'LOGOUT';
  if (/export|导出/i.test(text)) return 'EXPORT';
  if (/delete|删除/i.test(text)) return 'DELETE';
  if (
    /edit|save|setting|settings|enable|disable|reboot|reset|修改|保存|设置|启用|禁用|开启|关闭|重启/i.test(
      text
    )
  ) {
    return 'UPDATE';
  }
  if (/add|create|new|新增|添加/i.test(text)) return 'CREATE';
  if (/query|search|view|detail|查看|查询|详情/i.test(text)) return 'VIEW';
  return 'CLICK';
};

export const shouldRecordClientAction = (actionCode?: string, path?: string) => {
  if (path?.startsWith('/log') && actionCode !== 'EXPORT') {
    return false;
  }

  return ['CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGOUT'].includes(actionCode || '');
};

export const formatAction = (intl: MessageFormatter, code?: string) =>
  intl.formatMessage({
    id: `pages.log.actionCode.${code || 'CLICK'}`,
    defaultMessage: code || 'CLICK',
  });

export const formatModule = (intl: MessageFormatter, code?: string) =>
  intl.formatMessage({
    id: `pages.log.moduleCode.${code || 'SYSTEM'}`,
    defaultMessage: code || 'SYSTEM',
  });

const LEGACY_ACTION_TEXT: Record<string, RegExp> = {
  LOGIN: /^(log\s*in|login|登录|鐧诲綍).*$/i,
  LOGOUT: /^(log\s*out|logout|退出|退出登录|閫€鍑|閫€鍑虹櫥褰).*$/i,
  EXPORT: /^(export|导出|瀵煎嚭).*$/i,
  DELETE: /^(delete|删除|鍒犻櫎).*$/i,
  CREATE: /^(create|add|新增|添加|鏂板|娣诲姞).*$/i,
  UPDATE: /^(update|edit|save|设置|修改|保存|淇敼|淇濆瓨|璁剧疆).*$/i,
  VIEW: /^(view|query|search|查看|查询|鏌ョ湅|鏌ヨ).*$/i,
  CLICK: /^(click|点击|鐐瑰嚮).*$/i,
};

const isGeneratedActionText = (value: string, actionCode?: string) => {
  const text = value.trim();
  if (!text) {
    return true;
  }

  const actionPattern = LEGACY_ACTION_TEXT[actionCode || ''];
  if (actionPattern?.test(text)) {
    return true;
  }

  return Object.values(LEGACY_ACTION_TEXT).some((pattern) => pattern.test(text));
};

const resolveTargetName = (record: OperLogRecord) => {
  const targetName = (record.targetName || record.content || '').trim();

  if (!targetName || isGeneratedActionText(targetName, record.actionCode)) {
    return '';
  }

  return targetName;
};

export const formatLogContent = (intl: MessageFormatter, record: OperLogRecord) => {
  const action = formatAction(intl, record.actionCode);
  const moduleName = formatModule(intl, record.moduleCode);
  const targetName = resolveTargetName(record);

  return intl.formatMessage(
    {
      id: 'pages.log.template.default',
      defaultMessage: '{action} {module}{target}',
    },
    {
      action,
      module: moduleName,
      target: targetName ? ` - ${targetName}` : '',
    }
  );
};
