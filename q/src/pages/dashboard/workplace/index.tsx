import { Radar } from '@ant-design/plots';
import { PageContainer } from '@ant-design/pro-components';
import { Link, useIntl, useRequest } from '@umijs/max';
import { Avatar, Card, Col, List, Row, Skeleton, Statistic } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { FC } from 'react';
import EditableLinkGroup from './components/EditableLinkGroup';
import type { ActivitiesType, CurrentUser } from './data.d';
import { fakeChartData, queryActivities, queryProjectNotice } from './service';
import useStyles from './style.style';

dayjs.extend(relativeTime);

const linkIds = ['one', 'two', 'three', 'four', 'five', 'six'];

const PageHeaderContent: FC<{
  currentUser: Partial<CurrentUser>;
}> = ({ currentUser }) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const loading = currentUser && Object.keys(currentUser).length;
  if (!loading) {
    return (
      <Skeleton
        avatar
        paragraph={{
          rows: 1,
        }}
        active
      />
    );
  }
  return (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size="large" src={currentUser.avatar} />
      </div>
      <div className={styles.content}>
        <div className={styles.contentTitle}>
          {intl.formatMessage(
            {
              id: 'pages.dashboard.workplace.greeting',
              defaultMessage: 'Good morning, {name}. Have a great day!',
            },
            { name: currentUser.name }
          )}
        </div>
        <div>
          {currentUser.title} |{currentUser.group}
        </div>
      </div>
    </div>
  );
};
const ExtraContent: FC<Record<string, any>> = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  return (
    <div className={styles.extraContent}>
      <div className={styles.statItem}>
        <Statistic
          title={intl.formatMessage({
            id: 'pages.dashboard.workplace.projectCount',
            defaultMessage: 'Projects',
          })}
          value={56}
        />
      </div>
      <div className={styles.statItem}>
        <Statistic
          title={intl.formatMessage({
            id: 'pages.dashboard.workplace.teamRanking',
            defaultMessage: 'Team Ranking',
          })}
          value={8}
          suffix="/ 24"
        />
      </div>
      <div className={styles.statItem}>
        <Statistic
          title={intl.formatMessage({
            id: 'pages.dashboard.workplace.projectVisits',
            defaultMessage: 'Project Visits',
          })}
          value={2223}
        />
      </div>
    </div>
  );
};
const Workplace: FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const t = (id: string, defaultMessage: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id, defaultMessage }, values);
  const links = linkIds.map((id, index) => ({
    title: t(`pages.dashboard.action.${id}`, `Action ${index + 1}`),
    href: '',
  }));
  const { loading: projectLoading, data: projectNotice = [] } = useRequest(queryProjectNotice);
  const { loading: activitiesLoading, data: activities = [] } = useRequest(queryActivities);
  const { data } = useRequest(fakeChartData);
  const renderActivities = (item: ActivitiesType) => {
    const events = item.template.split(/@\{([^{}]*)\}/gi).map((key) => {
      if (item[key as keyof ActivitiesType]) {
        const value = item[key as 'user'];
        return (
          <a href={value?.link} key={value?.name}>
            {value.name}
          </a>
        );
      }
      return key;
    });
    return (
      <List.Item key={item.id}>
        <List.Item.Meta
          avatar={<Avatar src={item.user.avatar} />}
          title={
            <span>
              <a className={styles.username}>{item.user.name}</a>
              &nbsp;
              <span className={styles.event}>{events}</span>
            </span>
          }
          description={
            <span className={styles.datetime} title={item.updatedAt}>
              {dayjs(item.updatedAt).fromNow()}
            </span>
          }
        />
      </List.Item>
    );
  };

  return (
    <PageContainer
      content={
        <PageHeaderContent
          currentUser={{
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
            name: t('pages.dashboard.workplace.demoUserName', 'Daniel Wu'),
            userid: '00000001',
            email: 'antdesign@alipay.com',
            signature: t(
              'pages.dashboard.workplace.demoSignature',
              'Great tolerance makes greatness.'
            ),
            title: t('pages.dashboard.workplace.demoTitle', 'Interaction Expert'),
            group: t(
              'pages.dashboard.workplace.demoGroup',
              'Ant Financial - Platform Department - UED'
            ),
          }}
        />
      }
      extraContent={<ExtraContent />}
    >
      <Row gutter={24}>
        <Col xl={16} lg={24} md={24} sm={24} xs={24}>
          <Card
            className={styles.projectList}
            style={{
              marginBottom: 24,
            }}
            title={t('pages.dashboard.workplace.ongoingProjects', 'Ongoing Projects')}
            variant="borderless"
            extra={<Link to="/">{t('pages.dashboard.workplace.allProjects', 'All Projects')}</Link>}
            loading={projectLoading}
          >
            {projectNotice.map((item) => (
              <Card.Grid className={styles.projectGrid} key={item.id}>
                <Card.Meta
                  title={
                    <div className={styles.cardTitle}>
                      <Avatar size="small" src={item.logo} />
                      <Link to={item.href || '/'}>{item.title}</Link>
                    </div>
                  }
                  description={item.description}
                  style={{
                    width: '100%',
                  }}
                />
                <div className={styles.projectItemContent}>
                  <Link to={item.memberLink || '/'}>{item.member || ''}</Link>
                  {item.updatedAt && (
                    <span className={styles.datetime} title={item.updatedAt}>
                      {dayjs(item.updatedAt).fromNow()}
                    </span>
                  )}
                </div>
              </Card.Grid>
            ))}
          </Card>
          <Card
            styles={{
              body: {
                padding: activitiesLoading ? 16 : 0,
              },
            }}
            variant="borderless"
            className={styles.activeCard}
            title={t('pages.dashboard.workplace.activities', 'Activities')}
            loading={activitiesLoading}
          >
            <List<ActivitiesType>
              loading={activitiesLoading}
              renderItem={(item) => renderActivities(item)}
              dataSource={activities}
              className={styles.activitiesList}
              size="large"
            />
          </Card>
        </Col>
        <Col xl={8} lg={24} md={24} sm={24} xs={24}>
          <Card
            style={{
              marginBottom: 24,
            }}
            title={t('pages.dashboard.workplace.quickStart', 'Quick Start / Navigation')}
            variant="borderless"
          >
            <EditableLinkGroup onAdd={() => {}} links={links} linkElement={Link} />
          </Card>
          <Card
            style={{
              marginBottom: 24,
            }}
            variant="borderless"
            title={t('pages.dashboard.workplace.indexTitle', 'XX Index')}
            loading={data?.radarData?.length === 0}
          >
            <Radar
              height={343}
              data={data?.radarData || []}
              xField="label"
              colorField="name"
              yField="value"
              shapeField="smooth"
              area={{
                style: {
                  fillOpacity: 0.4,
                },
              }}
              axis={{
                y: {
                  gridStrokeOpacity: 0.5,
                },
              }}
              legend={{
                color: {
                  position: 'bottom',
                  layout: { justifyContent: 'center' },
                },
              }}
            />
          </Card>
          <Card
            styles={{
              body: {
                paddingTop: 12,
                paddingBottom: 12,
              },
            }}
            variant="borderless"
            title={t('pages.dashboard.workplace.team', 'Team')}
            loading={projectLoading}
          >
            <div className={styles.members}>
              <Row gutter={48}>
                {projectNotice.map((item) => {
                  return (
                    <Col span={12} key={`members-item-${item.id}`}>
                      <a>
                        <Avatar src={item.logo} size="small" />
                        <span className={styles.member}>{item.member.substring(0, 3)}</span>
                      </a>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};
export default Workplace;
