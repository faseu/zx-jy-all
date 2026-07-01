import { UploadOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Modal, Space, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import React, { useEffect, useState } from 'react';
import type { BrandingConfig } from '@/services/branding';
import {
  mergeBrandingDefaults,
  normalizeAssetUrl,
  queryBrandingConfig,
  updateBrandingConfig,
} from '@/services/branding';

type BrandingSettingsModalProps = {
  open: boolean;
  initialValues?: BrandingConfig;
  onCancel: () => void;
  onSaved: (config: BrandingConfig) => void;
};

const FIELD_LABELS: Array<[keyof BrandingConfig, string]> = [
  ['logoUrl', 'Logo'],
  ['loginBackgroundUrl', '登录页背景图'],
];

const LANGUAGE_FIELDS: Array<[keyof BrandingConfig, string]> = [
  ['brandNameZh', '系统名称/品牌（中文）'],
  ['brandNameEn', '系统名称/品牌（English）'],
  ['brandNameAr', '系统名称/品牌（العربية）'],
  ['loginWelcomeZh', '登录页欢迎语（中文）'],
  ['loginWelcomeEn', '登录页欢迎语（English）'],
  ['loginWelcomeAr', '登录页欢迎语（العربية）'],
];

const getUploadedImageUrl = (response: any) =>
  normalizeAssetUrl(
    response?.data?.url ??
      response?.data?.fileUrl ??
      response?.data?.path ??
      response?.url ??
      response?.fileUrl ??
      response?.path
  );

const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  open,
  initialValues,
  onCancel,
  onSaved,
}) => {
  const [form] = Form.useForm<BrandingConfig>();
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;
    form.resetFields();
    form.setFieldsValue(mergeBrandingDefaults(initialValues));

    void queryBrandingConfig()
      .then((config) => {
        if (!cancelled) {
          form.setFieldsValue(config);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [form, initialValues, open]);

  const createUploadProps = (fieldName: keyof BrandingConfig): UploadProps => ({
    action: '/api/v1/files',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
    },
    accept: 'image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/svg+xml',
    maxCount: 1,
    showUploadList: false,
    onChange: ({ file }) => {
      if (file.status === 'done') {
        const url = getUploadedImageUrl(file.response);
        if (url) {
          form.setFieldValue(fieldName, url);
          form.validateFields([fieldName]).catch(() => undefined);
          messageApi.success('上传成功');
        } else {
          messageApi.error('上传成功，但未返回图片地址');
        }
      } else if (file.status === 'error') {
        messageApi.error('上传失败');
      }
    },
  });

  const handleSave = async () => {
    try {
      const values = mergeBrandingDefaults(await form.validateFields());
      setSaving(true);
      const saved = await updateBrandingConfig(values);
      messageApi.success('配置已保存');
      onSaved(saved);
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return;
      }
      messageApi.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="系统品牌配置"
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
      width={760}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
          paddingRight: 12,
        },
      }}
      destroyOnHidden
    >
      {contextHolder}
      <Form form={form} layout="vertical">
        <Divider orientation="left">图片</Divider>
        {FIELD_LABELS.map(([fieldName, label]) => (
          <Form.Item key={fieldName} label={label}>
            <Space.Compact block>
              <Form.Item name={fieldName} noStyle>
                <Input placeholder="请输入图片地址，或点击上传" />
              </Form.Item>
              <Upload {...createUploadProps(fieldName)}>
                <Button icon={<UploadOutlined />}>上传</Button>
              </Upload>
            </Space.Compact>
          </Form.Item>
        ))}
        <Divider orientation="left">三语言文案</Divider>
        {LANGUAGE_FIELDS.map(([fieldName, label]) => (
          <Form.Item
            key={fieldName}
            label={label}
            name={fieldName}
            rules={[{ required: true, message: `请输入${label}` }]}
          >
            <Input />
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

export default BrandingSettingsModal;
