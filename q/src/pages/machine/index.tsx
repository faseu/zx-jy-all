import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useRequest } from '@umijs/max';
import { DownOutlined, MenuFoldOutlined, MenuUnfoldOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Modal, Row, message } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import OrgTree from '@/components/OrgTree';
import type { OrgTreeSelectionParams } from '@/components/OrgTree';
import type { BuildingTreeVO, DeviceVO, FloorTreeVO, PrisonTreeVO, ProvinceTreeVO } from './data.d';
import AddDeviceModal from '../region/components/AddDeviceModal';
import DeviceDetailModal from '../region/components/DeviceDetailModal';
import EditDeviceModal from '../region/components/EditDeviceModal';
import type { DeviceFormVO, PrisonVO, ProvinceVO } from '../region/data.d';
import {
  createDevice,
  queryDeviceForm,
  queryProvinceList,
  queryProvincePrisons,
  updateDevice,
} from '../region/service';
import {
  disableDevices,
  deleteDevices,
  enableDevices,
  queryBuildingDevicePage,
  queryFloorDevicePage,
  queryPrisonDevicePage,
  queryProvinceDevicePage,
} from './service';
import styles from './index.less';

type ProvinceCard = {
  id: number | string;
  name: string;
};

type DeviceRow = {
  id: string | number;
  prisonId?: number | string;
  buildingId?: number | string;
  floorId?: number | string;
  prisonKey: string;
  buildingKey: string;
  floorKey: string;
  rowType: 'device' | 'add';
  hasDevice: boolean;
  floor?: string;
  prisonName: string;
  buildingName: string;
  deviceNo: string;
  networkNo: string;
  on: string;
  ipAddress: string;
  port: string;
  workTime: string;
  backgroundColor: string;
  summaryLevel?: 'province' | 'prison';
};

type AddDeviceContext = {
  prisonId?: number;
  buildingId?: number;
  floorId?: number;
};

type DeviceModalFloorOption = {
  label: string;
  value: number;
};

type DeviceModalBuildingOption = {
  label: string;
  value: number;
  floors: DeviceModalFloorOption[];
};

type DeviceModalPrisonOption = {
  label: string;
  value: number;
  buildings: DeviceModalBuildingOption[];
};

type GroupSwitchState = 'unknown' | 'allOn' | 'allOff' | 'mixed';

type GroupSwitchSummary = {
  ids: Array<number | string>;
  state: GroupSwitchState;
};

type MachineTranslate = (
  id: string,
  defaultMessage: string,
  values?: Record<string, string | number>
) => string;

const POWER_CHANNEL_KEYS = Array.from({ length: 18 }, (_, index) => `ch${index + 1}`);
const INITIAL_POWER_CHANNEL_VALUES = Object.fromEntries(
  POWER_CHANNEL_KEYS.map((key) => [key, 0])
) as Record<string, number>;
const PRISON_LEVEL_ROW_COLORS: Record<number, string> = {
  1: '#cae9f8',
  2: '#f0dd93',
  3: '#e8c0c9',
};
const DEFAULT_ROW_COLORS = ['#e7bcc5', '#dbe7f5'];
const parsePowerChannelValue = (value?: string | number | null) => {
  const resolved = Number(value);

  if (!Number.isFinite(resolved)) {
    return 0;
  }

  return resolved;
};

const summarizeGroupSwitch = (devices?: DeviceVO[]): GroupSwitchSummary => {
  const validDevices = (devices ?? []).filter(
    (device) => device.id !== undefined && device.id !== null && device.id !== ''
  );

  if (validDevices.length === 0) {
    return {
      ids: [],
      state: 'unknown',
    };
  }

  const states = validDevices
    .map((device) => Number(device.powerOff))
    .filter((state) => state === 0 || state === 1);

  if (states.length === 0) {
    return {
      ids: validDevices.map((device) => device.id as number | string),
      state: 'unknown',
    };
  }

  if (states.every((state) => state === 0)) {
    return {
      ids: validDevices.map((device) => device.id as number | string),
      state: 'allOn',
    };
  }

  if (states.every((state) => state === 1)) {
    return {
      ids: validDevices.map((device) => device.id as number | string),
      state: 'allOff',
    };
  }

  return {
    ids: validDevices.map((device) => device.id as number | string),
    state: 'mixed',
  };
};

const normalizeBuildingTreeToPrisonTree = (
  buildingTree: BuildingTreeVO | undefined,
  params: OrgTreeSelectionParams,
  prisonMeta: Pick<PrisonVO, 'name' | 'level'> | undefined,
  t: MachineTranslate
): PrisonTreeVO => ({
  prisonId: params.prisonId,
  prisonName:
    prisonMeta?.name ??
    (params.prisonId
      ? t('pages.machine.fallback.prison', 'Prison-{id}', { id: params.prisonId })
      : '-'),
  level: prisonMeta?.level,
  buildingList: buildingTree
    ? [
        {
          ...buildingTree,
          buildingId: buildingTree.buildingId ?? params.buildingId,
        },
      ]
    : [],
});

const normalizeFloorTreeToPrisonTree = (
  floorTree: FloorTreeVO | DeviceVO[] | undefined,
  params: OrgTreeSelectionParams,
  prisonMeta: Pick<PrisonVO, 'name' | 'level'> | undefined,
  t: MachineTranslate
): PrisonTreeVO => {
  const floorDeviceList = Array.isArray(floorTree) ? floorTree : (floorTree?.deviceList ?? []);
  const resolvedFloorName = Array.isArray(floorTree)
    ? (floorTree[0]?.floorName ??
      (params.floorId
        ? t('pages.machine.fallback.floor', 'Floor-{id}', { id: params.floorId })
        : '-'))
    : (floorTree?.floorName ??
      (params.floorId
        ? t('pages.machine.fallback.floor', 'Floor-{id}', { id: params.floorId })
        : '-'));
  const resolvedBuildingName = Array.isArray(floorTree)
    ? (floorTree[0]?.buildingName ??
      (params.buildingId
        ? t('pages.machine.fallback.building', 'Building-{id}', { id: params.buildingId })
        : '-'))
    : params.buildingId
      ? t('pages.machine.fallback.building', 'Building-{id}', { id: params.buildingId })
      : '-';

  return {
    prisonId: params.prisonId,
    prisonName:
      prisonMeta?.name ??
      (Array.isArray(floorTree)
        ? (floorTree[0]?.prisonName ??
          (params.prisonId
            ? t('pages.machine.fallback.prison', 'Prison-{id}', { id: params.prisonId })
            : '-'))
        : params.prisonId
          ? t('pages.machine.fallback.prison', 'Prison-{id}', { id: params.prisonId })
          : '-'),
    level: prisonMeta?.level,
    buildingList: [
      {
        buildingId: params.buildingId,
        buildingName: resolvedBuildingName,
        floorList: [
          {
            floorId: Array.isArray(floorTree)
              ? (floorTree[0]?.floorId ?? params.floorId)
              : (floorTree?.floorId ?? params.floorId),
            floorName: resolvedFloorName,
            deviceList: floorDeviceList,
          },
        ],
      },
    ],
  };
};

const MachinePage: React.FC = () => {
  const intl = useIntl();
  const t = React.useCallback<MachineTranslate>(
    (id, defaultMessage, values) => intl.formatMessage({ id, defaultMessage }, values),
    [intl]
  );
  const [deviceForm] = Form.useForm();
  const [editDeviceForm] = Form.useForm();
  const { data, loading } = useRequest(queryProvinceList);
  const { run: runQueryProvinceDevicePage, loading: provinceDeviceLoading } = useRequest(
    queryProvinceDevicePage,
    {
      manual: true,
      onSuccess: (result) => {
        const resolved = (result as { data?: ProvinceTreeVO })?.data ?? (result as ProvinceTreeVO);
        setProvinceTreeData(resolved);
      },
      onError: () => {
        message.error(
          t(
            'pages.machine.message.loadProvinceDevicesFailed',
            'Failed to load province device data. Please retry.'
          )
        );
      },
    }
  );
  const { run: runQueryPrisonDevicePage, loading: prisonDeviceLoading } = useRequest(
    queryPrisonDevicePage,
    {
      manual: true,
      onSuccess: (result) => {
        const resolved = (result as { data?: PrisonTreeVO })?.data ?? (result as PrisonTreeVO);
        setPrisonTreeData(resolved);
      },
      onError: () => {
        message.error(
          t(
            'pages.machine.message.loadPrisonDevicesFailed',
            'Failed to load prison device data. Please retry.'
          )
        );
      },
    }
  );
  const { run: runQueryBuildingDevicePage, loading: buildingDeviceLoading } = useRequest(
    queryBuildingDevicePage,
    {
      manual: true,
      onSuccess: (result) => {
        const resolved = (result as { data?: BuildingTreeVO })?.data ?? (result as BuildingTreeVO);
        setPrisonTreeData(
          normalizeBuildingTreeToPrisonTree(
            resolved,
            detailRequestSelectionRef.current,
            resolvePrisonMeta(detailRequestSelectionRef.current),
            t
          )
        );
      },
      onError: () => {
        message.error(
          t(
            'pages.machine.message.loadBuildingDevicesFailed',
            'Failed to load building device data. Please retry.'
          )
        );
      },
    }
  );
  const { run: runQueryFloorDevicePage, loading: floorDeviceLoading } = useRequest(
    queryFloorDevicePage,
    {
      manual: true,
      onSuccess: (result) => {
        const resolved =
          (result as { data?: DeviceVO[] | FloorTreeVO })?.data ??
          (result as DeviceVO[] | FloorTreeVO);
        setPrisonTreeData(
          normalizeFloorTreeToPrisonTree(
            resolved,
            detailRequestSelectionRef.current,
            resolvePrisonMeta(detailRequestSelectionRef.current),
            t
          )
        );
      },
      onError: () => {
        message.error(
          t(
            'pages.machine.message.loadFloorDevicesFailed',
            'Failed to load floor device data. Please retry.'
          )
        );
      },
    }
  );
  const provinceList = (data ?? []) as ProvinceVO[];
  const [deviceModalOpen, setDeviceModalOpen] = React.useState(false);
  const [deviceStep, setDeviceStep] = React.useState(0);
  const [powerChannelValues, setPowerChannelValues] = React.useState<Record<string, number>>({
    ...INITIAL_POWER_CHANNEL_VALUES,
  });
  const [addDeviceContext, setAddDeviceContext] = React.useState<AddDeviceContext | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = React.useState<Array<string | number>>([]);
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);
  const [deviceDetailOpen, setDeviceDetailOpen] = React.useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<number | null>(null);
  const [editDeviceModalOpen, setEditDeviceModalOpen] = React.useState(false);
  const [editDeviceStep, setEditDeviceStep] = React.useState(0);
  const [editingDeviceId, setEditingDeviceId] = React.useState<number | null>(null);
  const [editDeviceContext, setEditDeviceContext] = React.useState<AddDeviceContext | null>(null);
  const [editPowerChannelValues, setEditPowerChannelValues] = React.useState<
    Record<string, number>
  >({
    ...INITIAL_POWER_CHANNEL_VALUES,
  });
  const [editSubmitting, setEditSubmitting] = React.useState(false);
  const [groupSwitchSubmitting, setGroupSwitchSubmitting] = React.useState<Record<string, boolean>>(
    {}
  );
  const [searchInput, setSearchInput] = React.useState('');
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [selectedNode, setSelectedNode] = React.useState<OrgTreeSelectionParams>({
    nodeType: 'country',
  });
  const [treePanelCollapsed, setTreePanelCollapsed] = React.useState(false);
  const [collapsedPrisonKeys, setCollapsedPrisonKeys] = React.useState<Record<string, boolean>>({});
  const [provinceTreeData, setProvinceTreeData] = React.useState<ProvinceTreeVO>();
  const [prisonTreeData, setPrisonTreeData] = React.useState<PrisonTreeVO>();
  const provincePrisonsRef = React.useRef<Record<string, PrisonVO[]>>({});
  const detailRequestSelectionRef = React.useRef<OrgTreeSelectionParams>({
    nodeType: 'building',
  });

  const resolvePrisonMeta = React.useCallback((params: OrgTreeSelectionParams) => {
    if (params.provinceId === undefined || params.provinceId === null) {
      return undefined;
    }

    const provincePrisons = provincePrisonsRef.current[String(params.provinceId)] ?? [];

    return provincePrisons.find((item) => String(item.id) === String(params.prisonId));
  }, []);

  const loadProvinceDevicePage = React.useCallback(
    (provinceId: number | string) => {
      runQueryProvinceDevicePage({
        provinceId,
        pageNum: 1,
        pageSize: 1000,
      });
    },
    [runQueryProvinceDevicePage]
  );

  const loadPrisonDevicePage = React.useCallback(
    (prisonId: number | string) => {
      runQueryPrisonDevicePage({
        prisonId,
        pageNum: 1,
        pageSize: 1000,
      });
    },
    [runQueryPrisonDevicePage]
  );

  const ensurePrisonMetaLoaded = React.useCallback(
    async (params: OrgTreeSelectionParams) => {
      if (
        params.provinceId === undefined ||
        params.provinceId === null ||
        provincePrisonsRef.current[String(params.provinceId)]
      ) {
        return;
      }

      try {
        const result = await queryProvincePrisons(params.provinceId);
        provincePrisonsRef.current[String(params.provinceId)] = (result.data ?? []) as PrisonVO[];
      } catch {
        message.warning(
          t(
            'pages.machine.message.loadPrisonLevelFailed',
            'Failed to load prison level. Default colors will be used.'
          )
        );
      }
    },
    [t]
  );

  const loadBuildingDevicePage = React.useCallback(
    async (params: OrgTreeSelectionParams) => {
      if (params.buildingId === undefined || params.buildingId === null) {
        return;
      }

      await ensurePrisonMetaLoaded(params);
      detailRequestSelectionRef.current = params;
      runQueryBuildingDevicePage({
        buildingId: params.buildingId,
        pageNum: 1,
        pageSize: 1000,
      });
    },
    [ensurePrisonMetaLoaded, runQueryBuildingDevicePage]
  );

  const loadFloorDevicePage = React.useCallback(
    async (params: OrgTreeSelectionParams) => {
      if (params.floorId === undefined || params.floorId === null) {
        return;
      }

      await ensurePrisonMetaLoaded(params);
      detailRequestSelectionRef.current = params;
      runQueryFloorDevicePage({
        floorId: params.floorId,
        pageNum: 1,
        pageSize: 1000,
      });
    },
    [ensurePrisonMetaLoaded, runQueryFloorDevicePage]
  );

  const handleProvinceSelect = React.useCallback(
    (provinceId: number | string) => {
      setSelectedNode({
        nodeType: 'province',
        provinceId,
      });
      setProvinceTreeData(undefined);
      setPrisonTreeData(undefined);
      loadProvinceDevicePage(provinceId);
    },
    [loadProvinceDevicePage]
  );

  const tableRows = React.useMemo<DeviceRow[]>(() => {
    const prisonList =
      selectedNode.nodeType === 'province'
        ? (provinceTreeData?.prisonList ?? [])
        : prisonTreeData
          ? [prisonTreeData]
          : [];

    if (!prisonList.length) {
      return [];
    }

    const rows: DeviceRow[] = [];
    prisonList.forEach((prison, prisonIndex) => {
      const prisonKey = `prison-${prison.prisonId ?? prisonIndex}`;
      const prisonName = prison.prisonName || '-';
      const prisonBackgroundColor =
        PRISON_LEVEL_ROW_COLORS[prison.level ?? 0] ??
        DEFAULT_ROW_COLORS[prisonIndex % DEFAULT_ROW_COLORS.length];
      const buildingList =
        prison.buildingList && prison.buildingList.length > 0
          ? prison.buildingList
          : [{ buildingId: `${prisonKey}-empty`, buildingName: '-', floorList: [] }];

      buildingList.forEach((building, buildingIndex) => {
        const buildingKey = `${prisonKey}-building-${building.buildingId ?? buildingIndex}`;
        const buildingName = building.buildingName || '-';
        const floorList =
          building.floorList && building.floorList.length > 0
            ? building.floorList
            : [{ floorId: `${buildingKey}-empty`, floorName: '-', deviceList: [] }];

        floorList.forEach((floor, floorIndex) => {
          const floorName = floor.floorName || '-';
          const floorKey = `${buildingKey}-floor-${floor.floorId ?? floorIndex}`;
          const deviceList = floor.deviceList ?? [];

          if (deviceList.length === 0) {
            rows.push({
              id: `${floorKey}-empty`,
              prisonId: prison.prisonId,
              buildingId: building.buildingId,
              floorId: floor.floorId,
              prisonKey,
              buildingKey,
              floorKey,
              rowType: 'device',
              hasDevice: false,
              prisonName,
              buildingName,
              floor: floorName,
              deviceNo: '-',
              networkNo: '-',
              on: '-',
              ipAddress: '-',
              port: '-',
              workTime: '-',
              backgroundColor: prisonBackgroundColor,
            });

            if (floorName !== '-') {
              rows.push({
                id: `${floorKey}-add`,
                prisonId: prison.prisonId,
                buildingId: building.buildingId,
                floorId: floor.floorId,
                prisonKey,
                buildingKey,
                floorKey,
                rowType: 'add',
                hasDevice: false,
                prisonName,
                buildingName,
                floor: floorName,
                deviceNo: '',
                networkNo: '',
                on: '',
                ipAddress: '',
                port: '',
                workTime: '',
                backgroundColor: prisonBackgroundColor,
              });
            }
            return;
          }

          deviceList.forEach((device, deviceIndex) => {
            const workTime =
              device.startTime && device.endTime ? `${device.startTime}-${device.endTime}` : '-';
            rows.push({
              id: String(device.id ?? `${floorKey}-${deviceIndex}`),
              prisonId: prison.prisonId,
              buildingId: building.buildingId,
              floorId: floor.floorId,
              prisonKey,
              buildingKey,
              floorKey,
              rowType: 'device',
              hasDevice: true,
              prisonName,
              buildingName,
              floor: floorName,
              deviceNo: device.deviceNo || '-',
              networkNo: device.entireNo || '-',
              on:
                device.powerOff === 0
                  ? t('pages.machine.status.on', 'On')
                  : device.powerOff === 1
                    ? t('pages.machine.status.off', 'Off')
                    : '-',
              ipAddress: device.ipAddress || '-',
              port: device.port || '-',
              workTime,
              backgroundColor: prisonBackgroundColor,
            });
          });

          if (floorName !== '-') {
            rows.push({
              id: `${floorKey}-add`,
              prisonId: prison.prisonId,
              buildingId: building.buildingId,
              floorId: floor.floorId,
              prisonKey,
              buildingKey,
              floorKey,
              rowType: 'add',
              hasDevice: false,
              prisonName,
              buildingName,
              floor: floorName,
              deviceNo: '',
              networkNo: '',
              on: '',
              ipAddress: '',
              port: '',
              workTime: '',
              backgroundColor: prisonBackgroundColor,
            });
          }
        });
      });
    });

    return rows;
  }, [provinceTreeData?.prisonList, prisonTreeData, selectedNode.nodeType, t]);

  const filteredTableRows = React.useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return tableRows;
    }

    return tableRows.filter((row) => {
      const fields = [
        row.prisonName,
        row.deviceNo,
        row.networkNo,
      ];

      return fields.some((field) => String(field ?? '').toLowerCase().includes(keyword));
    });
  }, [searchKeyword, tableRows]);

  const prisonSummaryMap = React.useMemo(() => {
    return filteredTableRows.reduce<
      Record<string, { buildingCount: number; floorCount: number; deviceCount: number }>
    >((acc, row) => {
      const current = acc[row.prisonKey] ?? { buildingCount: 0, floorCount: 0, deviceCount: 0 };
      acc[row.prisonKey] = current;

      current.deviceCount += row.hasDevice ? 1 : 0;
      return acc;
    }, {});
  }, [filteredTableRows]);

  const prisonBuildingCounts = React.useMemo(() => {
    return filteredTableRows.reduce<Record<string, Set<string>>>((acc, row) => {
      if (!acc[row.prisonKey]) {
        acc[row.prisonKey] = new Set<string>();
      }
      acc[row.prisonKey].add(row.buildingKey);
      return acc;
    }, {});
  }, [filteredTableRows]);

  const prisonFloorCounts = React.useMemo(() => {
    return filteredTableRows.reduce<Record<string, Set<string>>>((acc, row) => {
      if (!acc[row.prisonKey]) {
        acc[row.prisonKey] = new Set<string>();
      }
      acc[row.prisonKey].add(row.floorKey);
      return acc;
    }, {});
  }, [filteredTableRows]);

  Object.keys(prisonSummaryMap).forEach((key) => {
    prisonSummaryMap[key].buildingCount = prisonBuildingCounts[key]?.size ?? 0;
    prisonSummaryMap[key].floorCount = prisonFloorCounts[key]?.size ?? 0;
  });

  const machineCards = React.useMemo<ProvinceCard[]>(
    () =>
      provinceList
        .filter(
          (item) => item.provinceId !== undefined && item.provinceId !== null && item.provinceName
        )
        .map((item) => ({
          id: item.provinceId as number | string,
          name: item.provinceName as string,
        })),
    [provinceList]
  );

  const isProvinceView =
    selectedNode.nodeType === 'province' &&
    selectedNode.provinceId !== undefined &&
    selectedNode.provinceId !== null;
  const isPrisonView =
    selectedNode.nodeType === 'prison' &&
    selectedNode.prisonId !== undefined &&
    selectedNode.prisonId !== null;
  const isBuildingView =
    selectedNode.nodeType === 'building' &&
    selectedNode.buildingId !== undefined &&
    selectedNode.buildingId !== null;
  const isFloorView =
      selectedNode.nodeType === 'floor' &&
      selectedNode.floorId !== undefined &&
      selectedNode.floorId !== null;
  const isDetailView = isProvinceView || isPrisonView || isBuildingView || isFloorView;
  const hasSelectedDevices = selectedDeviceIds.length > 0;
  const canEditDevice = selectedDeviceIds.length === 1 && !editSubmitting;

  const visibleTableRows = React.useMemo(() => {
    if (filteredTableRows.length === 0) {
      return [];
    }

    const nextRows: DeviceRow[] = [];
    const processedPrisonKeys = new Set<string>();

    filteredTableRows.forEach((row) => {
      if (processedPrisonKeys.has(row.prisonKey)) {
        return;
      }

      processedPrisonKeys.add(row.prisonKey);
      const prisonRows = filteredTableRows.filter((item) => item.prisonKey === row.prisonKey);

      if (collapsedPrisonKeys[row.prisonKey]) {
        nextRows.push({
          ...prisonRows[0],
          id: `${row.prisonKey}-collapsed`,
          summaryLevel: 'prison',
        });
        return;
      }

      nextRows.push(...prisonRows);
    });

    return nextRows;
  }, [collapsedPrisonKeys, filteredTableRows]);

  const refreshCurrentDevicePage = React.useCallback(() => {
    if (
      selectedNode.nodeType === 'province' &&
      selectedNode.provinceId !== undefined &&
      selectedNode.provinceId !== null
    ) {
      loadProvinceDevicePage(selectedNode.provinceId);
      return;
    }

    if (
      selectedNode.nodeType === 'prison' &&
      selectedNode.prisonId !== undefined &&
      selectedNode.prisonId !== null
    ) {
      loadPrisonDevicePage(selectedNode.prisonId);
      return;
    }

    if (
      selectedNode.nodeType === 'building' &&
      selectedNode.buildingId !== undefined &&
      selectedNode.buildingId !== null
    ) {
      loadBuildingDevicePage(selectedNode);
      return;
    }

    if (
      selectedNode.nodeType === 'floor' &&
      selectedNode.floorId !== undefined &&
      selectedNode.floorId !== null
    ) {
      loadFloorDevicePage(selectedNode);
    }
  }, [
    loadBuildingDevicePage,
    loadFloorDevicePage,
    loadPrisonDevicePage,
    loadProvinceDevicePage,
    selectedNode,
  ]);

  const groupSwitchSummaries = React.useMemo(() => {
    const prisonList =
      selectedNode.nodeType === 'province'
        ? (provinceTreeData?.prisonList ?? [])
        : prisonTreeData
          ? [prisonTreeData]
          : [];

    const prisonMap: Record<string, GroupSwitchSummary> = {};
    const buildingMap: Record<string, GroupSwitchSummary> = {};
    const floorMap: Record<string, GroupSwitchSummary> = {};

    prisonList.forEach((prison, prisonIndex) => {
      const prisonKey = `prison-${prison.prisonId ?? prisonIndex}`;
      const buildingList =
        prison.buildingList && prison.buildingList.length > 0
          ? prison.buildingList
          : [{ buildingId: `${prisonKey}-empty`, buildingName: '-', floorList: [] }];
      const prisonDevices: DeviceVO[] = [];

      buildingList.forEach((building, buildingIndex) => {
        const buildingKey = `${prisonKey}-building-${building.buildingId ?? buildingIndex}`;
        const floorList =
          building.floorList && building.floorList.length > 0
            ? building.floorList
            : [{ floorId: `${buildingKey}-empty`, floorName: '-', deviceList: [] }];
        const buildingDevices: DeviceVO[] = [];

        floorList.forEach((floor, floorIndex) => {
          const floorKey = `${buildingKey}-floor-${floor.floorId ?? floorIndex}`;
          const floorDevices = floor.deviceList ?? [];

          floorMap[floorKey] = summarizeGroupSwitch(floorDevices);
          buildingDevices.push(...floorDevices);
          prisonDevices.push(...floorDevices);
        });

        buildingMap[buildingKey] = summarizeGroupSwitch(buildingDevices);
      });

      prisonMap[prisonKey] = summarizeGroupSwitch(prisonDevices);
    });

    return {
      prisonMap,
      buildingMap,
      floorMap,
    };
  }, [provinceTreeData?.prisonList, prisonTreeData, selectedNode.nodeType]);

  const handleGroupSwitch = React.useCallback(
    async (groupKey: string, action: 'enable' | 'disable', ids: Array<number | string>) => {
      if (ids.length === 0) {
        message.warning(
          t('pages.machine.message.noOperableDevices', 'No operable devices in this group.')
        );
        return;
      }

      try {
        setGroupSwitchSubmitting((prev) => ({ ...prev, [groupKey]: true }));

        if (action === 'enable') {
          await enableDevices(ids);
          message.success(
            t('pages.machine.message.batchEnableSuccess', 'Devices enabled in batch.')
          );
        } else {
          await disableDevices(ids);
          message.success(
            t('pages.machine.message.batchDisableSuccess', 'Devices disabled in batch.')
          );
        }

        refreshCurrentDevicePage();
      } catch {
        message.error(
          action === 'enable'
            ? t('pages.machine.message.batchEnableFailed', 'Failed to enable devices in batch.')
            : t('pages.machine.message.batchDisableFailed', 'Failed to disable devices in batch.')
        );
      } finally {
        setGroupSwitchSubmitting((prev) => {
          const next = { ...prev };
          delete next[groupKey];
          return next;
        });
      }
    },
    [refreshCurrentDevicePage, t]
  );

  const currentModalTree = React.useMemo<PrisonTreeVO[]>(() => {
    if (selectedNode.nodeType === 'province') {
      return provinceTreeData?.prisonList ?? [];
    }

    return prisonTreeData ? [prisonTreeData] : [];
  }, [provinceTreeData?.prisonList, prisonTreeData, selectedNode.nodeType]);

  const modalTreeOptions = React.useMemo<DeviceModalPrisonOption[]>(
    () =>
      currentModalTree
        .map((prison) => {
          const prisonId = Number(prison.prisonId);
          if (!prisonId) {
            return null;
          }

          const buildings =
            prison.buildingList
              ?.map((building: BuildingTreeVO) => {
                const buildingId = Number(building.buildingId);
                if (!buildingId) {
                  return null;
                }

                const floors =
                  building.floorList
                    ?.map((floor: FloorTreeVO) => {
                      const floorId = Number(floor.floorId);
                      if (!floorId) {
                        return null;
                      }

                      return {
                        label:
                          floor.floorName ||
                          t('pages.machine.fallback.floor', 'Floor-{id}', { id: floorId }),
                        value: floorId,
                      };
                    })
                    .filter(Boolean) ?? [];

                return {
                  label:
                    building.buildingName ||
                    t('pages.machine.fallback.building', 'Building-{id}', { id: buildingId }),
                  value: buildingId,
                  floors,
                };
              })
              .filter(Boolean) ?? [];

          return {
            label:
              prison.prisonName ||
              t('pages.machine.fallback.prison', 'Prison-{id}', { id: prisonId }),
            value: prisonId,
            buildings,
          };
        })
        .filter(Boolean) as DeviceModalPrisonOption[],
    [currentModalTree, t]
  );

  const watchedPrisonId = Form.useWatch('prisonId', deviceForm);
  const watchedBuildingId = Form.useWatch('buildingId', deviceForm);
  const watchedEditPrisonId = Form.useWatch('prisonId', editDeviceForm);
  const watchedEditBuildingId = Form.useWatch('buildingId', editDeviceForm);

  const prisonOptions = React.useMemo(
    () =>
      modalTreeOptions.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    [modalTreeOptions]
  );

  const buildingOptions = React.useMemo(() => {
    const currentPrison = modalTreeOptions.find(
      (item) => item.value === Number(watchedPrisonId ?? addDeviceContext?.prisonId)
    );

    return (currentPrison?.buildings ?? []).map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, [addDeviceContext?.prisonId, modalTreeOptions, watchedPrisonId]);

  const floorOptions = React.useMemo(() => {
    const currentPrison = modalTreeOptions.find(
      (item) => item.value === Number(watchedPrisonId ?? addDeviceContext?.prisonId)
    );
    const currentBuilding = currentPrison?.buildings.find(
      (item) => item.value === Number(watchedBuildingId ?? addDeviceContext?.buildingId)
    );

    return (currentBuilding?.floors ?? []).map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, [
    addDeviceContext?.buildingId,
    addDeviceContext?.prisonId,
    modalTreeOptions,
    watchedBuildingId,
    watchedPrisonId,
  ]);

  const editBuildingOptions = React.useMemo(() => {
    const currentPrison = modalTreeOptions.find(
      (item) => item.value === Number(watchedEditPrisonId ?? editDeviceContext?.prisonId)
    );

    return (currentPrison?.buildings ?? []).map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, [editDeviceContext?.prisonId, modalTreeOptions, watchedEditPrisonId]);

  const editFloorOptions = React.useMemo(() => {
    const currentPrison = modalTreeOptions.find(
      (item) => item.value === Number(watchedEditPrisonId ?? editDeviceContext?.prisonId)
    );
    const currentBuilding = currentPrison?.buildings.find(
      (item) => item.value === Number(watchedEditBuildingId ?? editDeviceContext?.buildingId)
    );

    return (currentBuilding?.floors ?? []).map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, [
    editDeviceContext?.buildingId,
    editDeviceContext?.prisonId,
    modalTreeOptions,
    watchedEditBuildingId,
    watchedEditPrisonId,
  ]);

  const provinceTitle = React.useMemo(() => {
    if (provinceTreeData?.provinceName) {
      return provinceTreeData.provinceName;
    }

    if (!isProvinceView) {
      return '-';
    }

    const currentProvince = provinceList.find(
      (item) => String(item.provinceId) === String(selectedNode.provinceId)
    );

    return (
      currentProvince?.provinceName ||
      t('pages.machine.fallback.province', 'Province-{id}', { id: selectedNode.provinceId ?? '' })
    );
  }, [isProvinceView, provinceList, provinceTreeData?.provinceName, selectedNode.provinceId, t]);

  const prisonTitle = React.useMemo(() => {
    if (prisonTreeData?.prisonName) {
      return prisonTreeData.prisonName;
    }

    if (isPrisonView) {
      return t('pages.machine.fallback.prison', 'Prison-{id}', { id: selectedNode.prisonId ?? '' });
    }

    if (isBuildingView && selectedNode.prisonId !== undefined && selectedNode.prisonId !== null) {
      return t('pages.machine.fallback.prison', 'Prison-{id}', { id: selectedNode.prisonId });
    }

    return '-';
  }, [isBuildingView, isPrisonView, prisonTreeData?.prisonName, selectedNode.prisonId, t]);

  const handleOpenAddDeviceModal = React.useCallback(
    (row: DeviceRow) => {
      const prisonId = Number(row.prisonId);
      const buildingId = Number(row.buildingId);
      const floorId = Number(row.floorId);

      if (!prisonId || !buildingId || !floorId) {
        message.warning(
          t(
            'pages.machine.message.incompleteFloorCannotAdd',
            'Current floor information is incomplete. Cannot add device.'
          )
        );
        return;
      }

      setAddDeviceContext({
        prisonId,
        buildingId,
        floorId,
      });
      setDeviceStep(0);
      setPowerChannelValues({ ...INITIAL_POWER_CHANNEL_VALUES });
      deviceForm.setFieldsValue({
        prisonId,
        buildingId,
        floorId,
        deviceCode: undefined,
        networkCode: undefined,
        ip: undefined,
        port: undefined,
        startTime: undefined,
        stopTime: undefined,
        powerOff: true,
        ...Object.fromEntries(POWER_CHANNEL_KEYS.map((key) => [key, undefined])),
      });
      setDeviceModalOpen(true);
    },
    [deviceForm, t]
  );

  const handleOpenToolbarAddDeviceModal = React.useCallback(() => {
    if (!isDetailView) {
      message.warning(
        t(
          'pages.machine.message.selectOrgFirst',
          'Please select a province, prison, building, or floor on the left first.'
        )
      );
      return;
    }

    const nextContext: AddDeviceContext = {};

    if (selectedNode.prisonId !== undefined && selectedNode.prisonId !== null) {
      nextContext.prisonId = Number(selectedNode.prisonId);
    }
    if (selectedNode.buildingId !== undefined && selectedNode.buildingId !== null) {
      nextContext.buildingId = Number(selectedNode.buildingId);
    }
    if (selectedNode.floorId !== undefined && selectedNode.floorId !== null) {
      nextContext.floorId = Number(selectedNode.floorId);
    }

    setAddDeviceContext(nextContext);
    setDeviceStep(0);
    setPowerChannelValues({ ...INITIAL_POWER_CHANNEL_VALUES });
    deviceForm.setFieldsValue({
      prisonId: nextContext.prisonId,
      buildingId: nextContext.buildingId,
      floorId: nextContext.floorId,
      deviceCode: undefined,
      networkCode: undefined,
      ip: undefined,
      port: undefined,
      startTime: undefined,
      stopTime: undefined,
      powerOff: true,
      ...Object.fromEntries(POWER_CHANNEL_KEYS.map((key) => [key, undefined])),
    });
    setDeviceModalOpen(true);
  }, [deviceForm, isDetailView, selectedNode, t]);

  const handleDeviceCancel = React.useCallback(() => {
    setDeviceModalOpen(false);
    setDeviceStep(0);
    setAddDeviceContext(null);
    deviceForm.resetFields();
  }, [deviceForm]);

  const handleDeviceNext = React.useCallback(async () => {
    try {
      await deviceForm.validateFields(['prisonId', 'buildingId', 'floorId', 'deviceCode']);
      setDeviceStep(1);
    } catch {
      return;
    }
  }, [deviceForm]);

  const handleDevicePrev = React.useCallback(() => {
    setDeviceStep(0);
  }, []);

  const handleDevicePrisonChange = React.useCallback(
    (value: number | null) => {
      deviceForm.setFieldsValue({
        prisonId: value ?? undefined,
        buildingId: undefined,
        floorId: undefined,
      });
    },
    [deviceForm]
  );

  const handleDeviceBuildingChange = React.useCallback(
    (value: number | null) => {
      deviceForm.setFieldsValue({
        buildingId: value ?? undefined,
        floorId: undefined,
      });
    },
    [deviceForm]
  );

  const handleEditDeviceCancel = React.useCallback(() => {
    setEditDeviceModalOpen(false);
    setEditDeviceStep(0);
    setEditingDeviceId(null);
    setEditDeviceContext(null);
    setEditPowerChannelValues({ ...INITIAL_POWER_CHANNEL_VALUES });
    editDeviceForm.resetFields();
  }, [editDeviceForm]);

  const handleEditDeviceNext = React.useCallback(async () => {
    try {
      await editDeviceForm.validateFields(['prisonId', 'buildingId', 'floorId', 'deviceCode']);
      setEditDeviceStep(1);
    } catch {
      return;
    }
  }, [editDeviceForm]);

  const handleEditDevicePrev = React.useCallback(() => {
    setEditDeviceStep(0);
  }, []);

  const handleEditDevicePrisonChange = React.useCallback(
    (value: number | null) => {
      editDeviceForm.setFieldsValue({
        prisonId: value ?? undefined,
        buildingId: undefined,
        floorId: undefined,
      });
    },
    [editDeviceForm]
  );

  const handleEditDeviceBuildingChange = React.useCallback(
    (value: number | null) => {
      editDeviceForm.setFieldsValue({
        buildingId: value ?? undefined,
        floorId: undefined,
      });
    },
    [editDeviceForm]
  );

  const handleOpenEditDeviceModal = React.useCallback(async () => {
    if (selectedDeviceIds.length !== 1) {
      message.warning(
        t('pages.machine.message.selectOneDeviceToEdit', 'Please select one device to edit.')
      );
      return;
    }

    const resolvedId = Number(selectedDeviceIds[0]);

    if (!resolvedId) {
      message.warning(
        t(
          'pages.machine.message.incompleteDeviceCannotEdit',
          'Current device information is incomplete. Cannot edit.'
        )
      );
      return;
    }

    try {
      const result = await queryDeviceForm(resolvedId);
      const detail = ((result as { data?: DeviceFormVO } | undefined)?.data ??
        result) as DeviceFormVO;
      const prisonId = Number(detail.prisonId);
      const buildingId = Number(detail.buildingId);
      const floorId = Number(detail.floorId);

      setEditingDeviceId(resolvedId);
      setEditDeviceContext({
        prisonId: prisonId || undefined,
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
      });

      const nextPowerValues = POWER_CHANNEL_KEYS.reduce(
        (acc, key) => {
          acc[key] = parsePowerChannelValue(
            detail[key as keyof DeviceFormVO] as string | number | null
          );
          return acc;
        },
        {} as Record<string, number>
      );

      setEditPowerChannelValues(nextPowerValues);
      editDeviceForm.setFieldsValue({
        prisonId: prisonId || undefined,
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        deviceCode: detail.deviceNo || undefined,
        networkCode: detail.entireNo,
        ip: detail.ipAddress,
        port: detail.port,
        startTime: detail.startTime ? dayjs(detail.startTime, 'HH:mm') : undefined,
        stopTime: detail.endTime ? dayjs(detail.endTime, 'HH:mm') : undefined,
        powerOff: Number(detail.powerOff) === 0,
        ...Object.fromEntries(POWER_CHANNEL_KEYS.map((key) => [key, nextPowerValues[key] ?? 0])),
      });
      setEditDeviceStep(0);
      setEditDeviceModalOpen(true);
    } catch {
      message.error(
        t(
          'pages.machine.message.loadDeviceDetailFailed',
          'Failed to load device detail. Please retry.'
        )
      );
    }
  }, [editDeviceForm, selectedDeviceIds, t]);

  const handleEditDeviceFinish = React.useCallback(async () => {
    if (!editingDeviceId) {
      message.warning(
        t(
          'pages.machine.message.incompleteDeviceCannotSave',
          'Current device information is incomplete. Cannot save.'
        )
      );
      return;
    }

    try {
      await editDeviceForm.validateFields(['networkCode', 'ip', 'port', 'startTime', 'stopTime']);
      const values = editDeviceForm.getFieldsValue(true);
      const formatTime = (value: any) =>
        value && typeof value.format === 'function' ? value.format('HH:mm') : value;
      const channelPayload = POWER_CHANNEL_KEYS.reduce(
        (acc, key) => {
          acc[key] = editPowerChannelValues[key] ?? 0;
          return acc;
        },
        {} as Record<string, any>
      );

      setEditSubmitting(true);
      await updateDevice(editingDeviceId, {
        id: editingDeviceId,
        deviceNo: String(values.deviceCode),
        deviceName: String(values.deviceCode),
        entireNo: values.networkCode,
        floorId: values.floorId,
        buildingId: values.buildingId,
        prisonId: values.prisonId,
        powerOff: values.powerOff ? 0 : 1,
        ipAddress: values.ip,
        port: values.port,
        startTime: formatTime(values.startTime),
        endTime: formatTime(values.stopTime),
        ...channelPayload,
      });

      message.success(t('pages.machine.message.updateSuccess', 'Updated successfully.'));
      handleEditDeviceCancel();
      refreshCurrentDevicePage();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      message.error(t('pages.machine.message.updateFailed', 'Update failed.'));
    } finally {
      setEditSubmitting(false);
    }
  }, [
    editDeviceForm,
    editPowerChannelValues,
    editingDeviceId,
    handleEditDeviceCancel,
    refreshCurrentDevicePage,
    t,
  ]);

  const handleDeviceFinish = React.useCallback(async () => {
    try {
      await deviceForm.validateFields(['networkCode', 'ip', 'port', 'startTime', 'stopTime']);
      const values = deviceForm.getFieldsValue(true);
      const formatTime = (value: any) =>
        value && typeof value.format === 'function' ? value.format('HH:mm') : value;
      const channelPayload = POWER_CHANNEL_KEYS.reduce(
        (acc, key) => {
          acc[key] = powerChannelValues[key] ?? 0;
          return acc;
        },
        {} as Record<string, any>
      );

      await createDevice({
        deviceNo: values.deviceCode,
        deviceName: values.deviceCode,
        entireNo: values.networkCode,
        floorId: values.floorId,
        buildingId: values.buildingId,
        prisonId: values.prisonId,
        powerOff: values.powerOff ? 0 : 1,
        ipAddress: values.ip,
        port: values.port,
        startTime: formatTime(values.startTime),
        endTime: formatTime(values.stopTime),
        ...channelPayload,
      });

      message.success(t('pages.machine.message.addSuccess', 'Added successfully.'));
      setDeviceModalOpen(false);
      setDeviceStep(0);
      setAddDeviceContext(null);
      deviceForm.resetFields();
      refreshCurrentDevicePage();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(t('pages.machine.message.addFailed', 'Add failed.'));
    }
  }, [deviceForm, powerChannelValues, refreshCurrentDevicePage, t]);

  const handleDeviceSelectionChange = React.useCallback(
    (checked: boolean, deviceId: string | number) => {
      setSelectedDeviceIds((prev) => {
        if (checked) {
          return prev.includes(deviceId) ? prev : [...prev, deviceId];
        }

        return prev.filter((item) => String(item) !== String(deviceId));
      });
    },
    []
  );

  const handleDeleteDevices = React.useCallback(() => {
    if (!hasSelectedDevices || deleteSubmitting) {
      return;
    }

    Modal.confirm({
      title: t('pages.machine.deleteConfirm.title', 'Confirm deleting selected devices?'),
      content: t(
        'pages.machine.deleteConfirm.content',
        '{count} devices selected. This cannot be undone.',
        { count: selectedDeviceIds.length }
      ),
      okText: t('pages.machine.deleteConfirm.ok', 'Confirm Delete'),
      cancelText: t('pages.machine.action.cancel', 'Cancel'),
      okButtonProps: {
        danger: true,
        loading: deleteSubmitting,
      },
      onOk: async () => {
        try {
          setDeleteSubmitting(true);
          await deleteDevices(selectedDeviceIds);
          message.success(t('pages.machine.message.deleteSuccess', 'Deleted successfully.'));
          setSelectedDeviceIds([]);
          refreshCurrentDevicePage();
        } catch {
          message.error(t('pages.machine.message.deleteFailed', 'Delete failed. Please retry.'));
          throw new Error('delete failed');
        } finally {
          setDeleteSubmitting(false);
        }
      },
    });
  }, [deleteSubmitting, hasSelectedDevices, refreshCurrentDevicePage, selectedDeviceIds, t]);

  const handleOpenDeviceDetail = React.useCallback(
    (deviceId: string | number) => {
      const resolvedId = Number(deviceId);

      if (!resolvedId) {
        message.warning(
          t(
            'pages.machine.message.incompleteDeviceCannotView',
            'Current device information is incomplete. Cannot view detail.'
          )
        );
        return;
      }

      setSelectedDeviceId(resolvedId);
      setDeviceDetailOpen(true);
    },
    [t]
  );

  const handleCloseDeviceDetail = React.useCallback(() => {
    setDeviceDetailOpen(false);
    setSelectedDeviceId(null);
  }, []);

  const renderGroupSwitchControls = React.useCallback(
    (groupKey: string, summary: GroupSwitchSummary) => {
      const statusTextMap: Record<GroupSwitchState, string> = {
        unknown: t('pages.machine.switch.unknown', 'Status unknown'),
        allOn: t('pages.machine.switch.allOnStatus', 'Currently all on'),
        allOff: t('pages.machine.switch.allOffStatus', 'Currently all off'),
        mixed: t('pages.machine.switch.mixedStatus', 'Mixed on and off'),
      };
      const submitting = groupSwitchSubmitting[groupKey];

      return (
        <div className={styles.switchGroup}>
          <div className={styles.switchStatus}>{statusTextMap[summary.state]}</div>
          <div className={styles.switchActions}>
            <Button
              size="small"
              disabled={submitting || summary.ids.length === 0 || summary.state === 'allOn'}
              loading={submitting}
              onClick={() => handleGroupSwitch(groupKey, 'enable', summary.ids)}
            >
              {t('pages.machine.action.allOn', 'All On')}
            </Button>
            <Button
              size="small"
              disabled={submitting || summary.ids.length === 0 || summary.state === 'allOff'}
              loading={submitting}
              onClick={() => handleGroupSwitch(groupKey, 'disable', summary.ids)}
            >
              {t('pages.machine.action.allOff', 'All Off')}
            </Button>
          </div>
        </div>
      );
    },
    [groupSwitchSubmitting, handleGroupSwitch, t]
  );

  React.useEffect(() => {
    setSelectedDeviceIds((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const validIds = new Set(
        filteredTableRows.filter((row) => row.hasDevice).map((row) => String(row.id))
      );
      const next = prev.filter((item) => validIds.has(String(item)));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredTableRows]);

  const handleSearch = React.useCallback(() => {
    setSearchKeyword(searchInput.trim());
  }, [searchInput]);

  const togglePrisonCollapse = React.useCallback((prisonKey: string) => {
    setCollapsedPrisonKeys((prev) => ({
      ...prev,
      [prisonKey]: !prev[prisonKey],
    }));
  }, []);

  const renderCollapseLabel = React.useCallback(
    (label: string, collapsed: boolean, onToggle: () => void) => (
      <button type="button" className={styles.collapseCellHeader} onClick={onToggle}>
        <span className={styles.collapseLabel}>{label}</span>
        <span className={styles.collapseTrigger}>
          {collapsed ? <RightOutlined /> : <DownOutlined />}
        </span>
      </button>
    ),
    []
  );

  const renderRows = () => {
    const detailLoading =
      provinceDeviceLoading || prisonDeviceLoading || buildingDeviceLoading || floorDeviceLoading;

    if (visibleTableRows.length === 0) {
      return (
        <tr>
          {isProvinceView && (
            <td className={`${styles.leftMergedCell} ${styles.provinceCell}`}>{provinceTitle}</td>
          )}
          <td className={styles.leftMergedCell}>
            {isPrisonView || isBuildingView || isFloorView ? prisonTitle : '-'}
          </td>
          <td colSpan={10} style={{ textAlign: 'center' }}>
            {detailLoading
              ? t('pages.machine.status.loading', 'Loading...')
              : t('pages.machine.status.noData', 'No data')}
          </td>
        </tr>
      );
    }

    const totalRows = visibleTableRows.length;
    const prisonRowSpanMap = visibleTableRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.prisonKey] = (acc[row.prisonKey] || 0) + 1;
        return acc;
      }, {});
    const buildingRowSpanMap = visibleTableRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.buildingKey] = (acc[row.buildingKey] || 0) + 1;
        return acc;
      }, {});
    const floorRowSpanMap = visibleTableRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.floorKey] = (acc[row.floorKey] || 0) + 1;
        return acc;
      }, {});
    const prisonRendered = new Set<string>();
    const buildingRendered = new Set<string>();
    const floorRendered = new Set<string>();
    const rows: React.ReactNode[] = [];
    let provinceRendered = false;

    visibleTableRows.forEach((row) => {
      const shouldRenderPrison = !prisonRendered.has(row.prisonKey);
      const shouldRenderBuilding = !buildingRendered.has(row.buildingKey);
      const shouldRenderFloor = !floorRendered.has(row.floorKey);
      const cellStyle = { backgroundColor: row.backgroundColor };
      const isPrisonCollapsed = !!collapsedPrisonKeys[row.prisonKey];

      if (row.summaryLevel === 'prison') {
        rows.push(
          <tr key={String(row.id)}>
            {isProvinceView && !provinceRendered && (
              <td rowSpan={totalRows} className={`${styles.leftMergedCell} ${styles.provinceCell}`}>
                {provinceTitle}
              </td>
            )}
            <td
              className={`${styles.leftMergedCell} ${styles.prisonCell} ${styles.prisonCollapsedCell}`}
              style={cellStyle}
            >
              {renderCollapseLabel(row.prisonName, true, () => togglePrisonCollapse(row.prisonKey))}
              <div className={styles.prisonCollapsedSummary}>
                {t(
                  'pages.machine.collapse.prisonSummary',
                  'Collapsed: {buildings} buildings / {floors} floors / {devices} devices. Click the prison name to expand.',
                  {
                    buildings: prisonSummaryMap[row.prisonKey]?.buildingCount ?? 0,
                    floors: prisonSummaryMap[row.prisonKey]?.floorCount ?? 0,
                    devices: prisonSummaryMap[row.prisonKey]?.deviceCount ?? 0,
                  }
                )}
              </div>
            </td>
            {Array.from({ length: 10 }).map((_, index) => (
              <td key={`${row.prisonKey}-collapsed-empty-${index}`} className={styles.collapsedEmptyCell} />
            ))}
          </tr>
        );

        provinceRendered = true;
        prisonRendered.add(row.prisonKey);
        return;
      }

      rows.push(
        <tr key={String(row.id)}>
          {isProvinceView && !provinceRendered && (
              <td rowSpan={totalRows} className={`${styles.leftMergedCell} ${styles.provinceCell}`}>
                {provinceTitle}
              </td>
            )}
          {shouldRenderPrison && (
            <td
              rowSpan={prisonRowSpanMap[row.prisonKey]}
                className={`${styles.leftMergedCell} ${styles.prisonCell}`}
                style={cellStyle}
              >
                {renderCollapseLabel(row.prisonName, isPrisonCollapsed, () =>
                  togglePrisonCollapse(row.prisonKey)
                )}
                {renderGroupSwitchControls(
                  row.prisonKey,
                  groupSwitchSummaries.prisonMap[row.prisonKey] ?? { ids: [], state: 'unknown' }
              )}
            </td>
          )}
          {shouldRenderBuilding && (
            <td
              rowSpan={buildingRowSpanMap[row.buildingKey]}
              className={styles.leftMergedCell}
              style={cellStyle}
            >
              {row.buildingName}
              {renderGroupSwitchControls(
                row.buildingKey,
                groupSwitchSummaries.buildingMap[row.buildingKey] ?? { ids: [], state: 'unknown' }
              )}
            </td>
          )}
          {shouldRenderFloor && (
            <td
              rowSpan={floorRowSpanMap[row.floorKey]}
              className={styles.floorCell}
              style={cellStyle}
            >
              {row.floor || ''}
              {row.floor &&
                row.floor !== '-' &&
                renderGroupSwitchControls(
                  row.floorKey,
                  groupSwitchSummaries.floorMap[row.floorKey] ?? { ids: [], state: 'unknown' }
                )}
            </td>
          )}
          {row.rowType === 'add' ? (
            <td colSpan={8} className={styles.addDeviceRow} style={cellStyle}>
              <Button
                type="link"
                className={styles.floorAddButton}
                onClick={() => handleOpenAddDeviceModal(row)}
              >
                {t('pages.machine.action.addDevice', 'Add Device')}
              </Button>
            </td>
          ) : (
            <>
              <td style={cellStyle}>
                {row.hasDevice ? (
                  <a type="link" onClick={() => handleOpenDeviceDetail(row.id)}>
                    {row.deviceNo}
                  </a>
                ) : (
                  row.deviceNo
                )}
              </td>
              <td style={cellStyle}>
                {row.hasDevice ? (
                  <a type="link" onClick={() => handleOpenDeviceDetail(row.id)}>
                    {row.networkNo}
                  </a>
                ) : (
                  row.networkNo
                )}
              </td>
              <td style={cellStyle}>{row.on}</td>
              <td style={cellStyle}>{row.ipAddress}</td>
              <td style={cellStyle}>{row.port}</td>
              <td style={cellStyle}>{row.workTime}</td>
              <td style={cellStyle}>
                {row.hasDevice ? (
                  <a type="link" onClick={() => handleOpenDeviceDetail(row.id)}>
                    {t('pages.machine.action.view', 'View')}
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className={styles.checkCell} style={cellStyle}>
                <Checkbox
                  checked={selectedDeviceIds.some((item) => String(item) === String(row.id))}
                  disabled={!row.hasDevice}
                  onChange={(event) => handleDeviceSelectionChange(event.target.checked, row.id)}
                />
              </td>
            </>
          )}
        </tr>
      );

      provinceRendered = true;
      if (shouldRenderPrison) {
        prisonRendered.add(row.prisonKey);
      }
      if (shouldRenderBuilding) {
        buildingRendered.add(row.buildingKey);
      }
      if (shouldRenderFloor) {
        floorRendered.add(row.floorKey);
      }
    });

    return rows;
  };

  return (
    <PageContainer title={false}>
      <div className={styles.pageShell}>
        <Row gutter={0} className={styles.contentRow}>
          <Col
            xs={24}
            xl={treePanelCollapsed ? 1 : 6}
            className={`${styles.leftPane} ${treePanelCollapsed ? styles.leftPaneCollapsed : ''}`}
          >
            <div className={styles.treePanelToggleWrap}>
              <Button
                type="text"
                className={styles.treePanelToggle}
                icon={treePanelCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setTreePanelCollapsed((prev) => !prev)}
              />
            </div>
            {!treePanelCollapsed ? (
              <OrgTree
                provinceList={provinceList}
                loading={loading}
                maxLevel={4}
                onSelectionChange={(params) => {
                  setSelectedNode(params);
                  if (
                    params.nodeType === 'province' &&
                    params.provinceId !== undefined &&
                    params.provinceId !== null
                  ) {
                    setProvinceTreeData(undefined);
                    setPrisonTreeData(undefined);
                    loadProvinceDevicePage(params.provinceId);
                    return;
                  }
                  if (
                    params.nodeType === 'prison' &&
                    params.prisonId !== undefined &&
                    params.prisonId !== null
                  ) {
                    setProvinceTreeData(undefined);
                    setPrisonTreeData(undefined);
                    loadPrisonDevicePage(params.prisonId);
                    return;
                  }
                  if (
                    params.nodeType === 'building' &&
                    params.buildingId !== undefined &&
                    params.buildingId !== null
                  ) {
                    setProvinceTreeData(undefined);
                    setPrisonTreeData(undefined);
                    loadBuildingDevicePage(params);
                    return;
                  }
                  if (
                    params.nodeType === 'floor' &&
                    params.floorId !== undefined &&
                    params.floorId !== null
                  ) {
                    setProvinceTreeData(undefined);
                    setPrisonTreeData(undefined);
                    loadFloorDevicePage(params);
                    return;
                  }
                  setProvinceTreeData(undefined);
                  setPrisonTreeData(undefined);
                }}
              />
            ) : (
              <button
                type="button"
                className={styles.treePanelExpandRail}
                onClick={() => setTreePanelCollapsed(false)}
              >
                <RightOutlined />
              </button>
            )}
          </Col>
          <Col xs={24} xl={treePanelCollapsed ? 23 : 18} className={styles.rightPane}>
            {!isDetailView ? (
              <>
                <div className={styles.machineGrid}>
                  {machineCards.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className={styles.machineCard}
                      onClick={() => handleProvinceSelect(item.id)}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className={styles.toolbar}>
                  <Button type="primary">
                    {t('pages.machine.action.allDevices', 'All Devices')}
                  </Button>
                  <Button onClick={handleOpenToolbarAddDeviceModal}>
                    {t('pages.machine.action.addDevice', 'Add Device')}
                  </Button>
                  <Button
                    className="soft-green-action"
                    disabled={!canEditDevice}
                    loading={editSubmitting}
                    onClick={handleOpenEditDeviceModal}
                  >
                    {t('pages.machine.action.edit', 'Edit')}
                  </Button>
                  <Button
                    disabled={!hasSelectedDevices || deleteSubmitting}
                    loading={deleteSubmitting}
                    onClick={handleDeleteDevices}
                  >
                    {t('pages.machine.action.delete', 'Delete')}
                  </Button>
                  <div className={styles.searchArea}>
                    <Input
                      value={searchInput}
                      placeholder={t(
                        'pages.machine.placeholder.search',
                        'Search prison / device ID / device no.'
                      )}
                      onChange={(event) => setSearchInput(event.target.value)}
                      onPressEnter={handleSearch}
                    />
                    <Button onClick={handleSearch}>{t('pages.machine.action.find', 'Find')}</Button>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.deviceTable}>
                    <thead>
                      <tr>
                        {isProvinceView && (
                          <th>{t('pages.machine.column.province', 'Province')}</th>
                        )}
                        <th className={styles.prisonCell}>{t('pages.machine.column.prison', 'Prison')}</th>
                        <th>{t('pages.machine.column.building', 'Building')}</th>
                        <th>{t('pages.machine.column.floor', 'Floor')}</th>
                        <th>{t('pages.machine.column.deviceNo', 'Device No.')}</th>
                        <th>{t('pages.machine.column.networkNo', 'Device ID')}</th>
                        <th>{t('pages.machine.column.switch', 'Switch')}</th>
                        <th>IP</th>
                        <th>{t('pages.machine.column.port', 'Port')}</th>
                        <th>{t('pages.machine.column.workTime', 'Work Time')}</th>
                        <th>{t('pages.machine.column.view', 'View')}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>{renderRows()}</tbody>
                  </table>
                </div>
                <div className={styles.backBar}>
                  <Button
                    className="soft-green-action"
                    onClick={() => {
                      setSelectedNode({ nodeType: 'country' });
                      setProvinceTreeData(undefined);
                      setPrisonTreeData(undefined);
                    }}
                  >
                    {t('pages.machine.action.back', 'Back')}
                  </Button>
                </div>
              </>
            )}
          </Col>
        </Row>
      </div>
      <AddDeviceModal
        open={deviceModalOpen}
        step={deviceStep}
        form={deviceForm}
        powerChannelKeys={POWER_CHANNEL_KEYS}
        powerChannelValues={powerChannelValues}
        prisonOptions={prisonOptions}
        buildingOptions={buildingOptions}
        floorOptions={floorOptions}
        deviceBuildingsLoading={false}
        prisonDisabled={prisonOptions.length === 0}
        buildingDisabled={!watchedPrisonId || buildingOptions.length === 0}
        floorDisabled={!watchedBuildingId || floorOptions.length === 0}
        onCancel={handleDeviceCancel}
        onNext={handleDeviceNext}
        onPrev={handleDevicePrev}
        onFinish={handleDeviceFinish}
        onPrisonChange={handleDevicePrisonChange}
        onBuildingChange={handleDeviceBuildingChange}
        onPowerChannelChange={(key, value) =>
          setPowerChannelValues((prev) => ({ ...prev, [key]: value }))
        }
      />
      <DeviceDetailModal
        open={deviceDetailOpen}
        deviceId={selectedDeviceId}
        onCancel={handleCloseDeviceDetail}
      />
      <EditDeviceModal
        open={editDeviceModalOpen}
        step={editDeviceStep}
        form={editDeviceForm}
        powerChannelKeys={POWER_CHANNEL_KEYS}
        powerChannelValues={editPowerChannelValues}
        prisonOptions={prisonOptions}
        buildingOptions={editBuildingOptions}
        floorOptions={editFloorOptions}
        deviceBuildingsLoading={false}
        prisonDisabled={prisonOptions.length <= 1}
        buildingDisabled={!watchedEditPrisonId || editBuildingOptions.length === 0}
        floorDisabled={!watchedEditBuildingId || editFloorOptions.length === 0}
        submitting={editSubmitting}
        onCancel={handleEditDeviceCancel}
        onNext={handleEditDeviceNext}
        onPrev={handleEditDevicePrev}
        onFinish={handleEditDeviceFinish}
        onPrisonChange={handleEditDevicePrisonChange}
        onBuildingChange={handleEditDeviceBuildingChange}
        onPowerChannelChange={(key, value) =>
          setEditPowerChannelValues((prev) => ({ ...prev, [key]: value }))
        }
      />
    </PageContainer>
  );
};

export default MachinePage;
