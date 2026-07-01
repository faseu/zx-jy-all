import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React, { createElement } from 'react';
import useStyles from './index.style';

export type EditableLink = {
  title: string;
  href: string;
  id?: string;
};
type EditableLinkGroupProps = {
  onAdd: () => void;
  links: EditableLink[];
  linkElement: any;
};
const EditableLinkGroup: React.FC<EditableLinkGroupProps> = (props) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { links = [], linkElement = 'a', onAdd = () => {} } = props;
  return (
    <div className={styles.linkGroup}>
      {links.map((link) =>
        createElement(
          linkElement,
          {
            key: `linkGroup-item-${link.id || link.title}`,
            to: link.href,
            href: link.href,
          },
          link.title
        )
      )}
      <Button size="small" type="primary" ghost onClick={onAdd}>
        <PlusOutlined />{' '}
        {intl.formatMessage({
          id: 'pages.dashboard.workplace.add',
          defaultMessage: 'Add',
        })}
      </Button>
    </div>
  );
};

export default EditableLinkGroup;
