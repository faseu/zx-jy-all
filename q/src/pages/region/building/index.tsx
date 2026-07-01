import {
  AimOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useLocation, useParams, useRequest } from '@umijs/max';
import {
  Button,
  Col,
  Divider,
  Dropdown,
  Empty,
  Form,
  Modal,
  Row,
  Select,
  Spin,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import gb from '@/assets/gb.png';
import 'ol/ol.css';
import OlMap from 'ol/Map';
import View from 'ol/View';
import Projection from 'ol/proj/Projection';
import Static from 'ol/source/ImageStatic';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { defaults as defaultInteractions, Select as OlSelect, Translate } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { getCenter } from 'ol/extent';
import AddDeviceModal from '../components/AddDeviceModal';
import DeviceDetailModal from '../components/DeviceDetailModal';
import EditDeviceModal from '../components/EditDeviceModal';
import type { BuildingInfoVO, DeviceFormVO } from '../data.d';
import {
  createDevice,
  deleteDevice,
  queryDeviceForm,
  queryBuildingFloorForm,
  queryBuildingFloors,
  queryBuildingInfo,
  queryFloorDevicePage,
  queryPrisonBuildings,
  queryPrisonInfo,
  updateDevice,
  updateDeviceXY,
  updateFloorDrawing,
} from '../service';

type DevicePosition = [number, number];

type DeviceItem = {
  id: number;
  label: string;
  displayIndex: number;
  isAlarm: number;
  position: DevicePosition | null;
};

type MarkerActionState = {
  deviceId: number;
  label: string;
  pixel: [number, number];
};

const INITIAL_DEVICES: DeviceItem[] = [];
const getDeviceMarkerColor = (isAlarm?: number) => (isAlarm ? '#ff1616' : '#1677ff');
const POWER_CHANNEL_KEYS = Array.from({ length: 18 }, (_, index) => `ch${index + 1}`);
const MAX_ATT_VALUE = 63;
const INITIAL_POWER_CHANNEL_VALUES = Object.fromEntries(
  POWER_CHANNEL_KEYS.map((key) => [key, 0])
) as Record<string, number>;
const FLOOR_DRAWING_ACCEPT = '.png,.jpg,.jpeg,.webp,.bmp,.svg';
const FLOOR_DRAWING_MAX_SIZE = 5 * 1024 * 1024;

const normalizeFloorDrawingPath = (value?: string) => {
  const rawValue = value?.trim().replace(/\\/g, '/') ?? '';

  if (!rawValue) return '';
  if (rawValue.startsWith('/file/')) return rawValue;
  if (rawValue.startsWith('file/')) return `/${rawValue}`;

  try {
    const parsedUrl = new URL(rawValue);
    if (parsedUrl.pathname.startsWith('/file/')) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return rawValue;
  }

  return rawValue;
};

const isSupportedDrawingImage = (value?: string) => {
  const drawingPath = normalizeFloorDrawingPath(value);
  const pathWithoutQuery = drawingPath.split(/[?#]/)[0];
  return /\.(png|jpe?g|bmp|webp|svg)$/i.test(pathWithoutQuery);
};

const parseDeviceTimeValue = (value?: string) => {
  if (!value) return undefined;
  const parsed = dayjs(value.slice(0, 5), 'HH:mm');
  return parsed.isValid() ? parsed : undefined;
};

const normalizePowerChannelValue = (value?: string | number | null) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(0, Math.min(MAX_ATT_VALUE, nextValue)) : 0;
};

const getFloorDisplayName = (floor: { floorName?: string; floorNo?: number }) => {
  const floorNo = Number(floor.floorNo);

  if (Number.isFinite(floorNo) && floorNo < 0) {
    return `B${Math.abs(floorNo)}`;
  }

  if (Number.isFinite(floorNo) && floorNo > 0) {
    return `F${floorNo}`;
  }

  return floor.floorName || '';
};

const getFloorSortValue = (floor: { floorNo?: number }) => {
  const floorNo = Number(floor.floorNo);

  if (!Number.isFinite(floorNo)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return floorNo < 0 ? floorNo : 1000 + floorNo;
};

const BuildingDetailPage: React.FC = () => {
  const intl = useIntl();
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [deviceStep, setDeviceStep] = useState(0);
  const [editDeviceStep, setEditDeviceStep] = useState(0);
  const [devicePrisonId, setDevicePrisonId] = useState<number | null>(null);
  const [editDeviceModalOpen, setEditDeviceModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [editDeviceSubmitting, setEditDeviceSubmitting] = useState(false);
  const [devices, setDevices] = useState<DeviceItem[]>(INITIAL_DEVICES);
  const [powerChannelValues, setPowerChannelValues] = useState<Record<string, number>>({
    ...INITIAL_POWER_CHANNEL_VALUES,
  });
  const [editPowerChannelValues, setEditPowerChannelValues] = useState<Record<string, number>>({
    ...INITIAL_POWER_CHANNEL_VALUES,
  });
  const [placingDeviceId, setPlacingDeviceId] = useState<number | null>(null);
  const [markerAction, setMarkerAction] = useState<MarkerActionState | null>(null);
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [markerSyncVersion, setMarkerSyncVersion] = useState(0);
  const [deviceDetailOpen, setDeviceDetailOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OlMap | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const placingDeviceIdRef = useRef<number | null>(null);
  const [planForm] = Form.useForm();
  const [deviceForm] = Form.useForm();
  const [editDeviceForm] = Form.useForm();
  const planImageFileList = Form.useWatch('image', planForm) as any[] | undefined;
  const hasPlanDrawingFile =
    Array.isArray(planImageFileList) && planImageFileList.some((file) => file?.status !== 'error');

  const params = useParams<{ id: string; prisonId: string }>();
  const location = useLocation();
  const buildingId = params.id ?? '';
  const prisonId = params.prisonId ?? '';
  const initialQueryFloorId = React.useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const rawFloorId = searchParams.get('floorId');
    const resolvedFloorId = Number(rawFloorId);

    if (!rawFloorId || !Number.isFinite(resolvedFloorId) || resolvedFloorId <= 0) {
      return null;
    }

    return resolvedFloorId;
  }, [location.search]);

  const {
    data: detailData,
    loading: detailLoading,
    refresh: refreshDetail,
  } = useRequest(() => queryBuildingInfo(buildingId), {
    ready: Boolean(buildingId),
    refreshDeps: [buildingId],
  });

  const { data: floorData, refresh: refreshFloors } = useRequest(
    () => queryBuildingFloors(buildingId),
    {
      ready: Boolean(buildingId),
      refreshDeps: [buildingId],
    }
  );
  const {
    data: floorFormData,
    loading: floorFormLoading,
    refresh: refreshFloorForm,
  } = useRequest(() => queryBuildingFloorForm(selectedFloorId as number), {
    ready: Boolean(selectedFloorId),
    refreshDeps: [selectedFloorId],
  });

  const { data: prisonDetail } = useRequest(() => queryPrisonInfo(prisonId), {
    ready: Boolean(prisonId),
    refreshDeps: [prisonId],
  });

  const { data: deviceBuildingsData, loading: deviceBuildingsLoading } = useRequest(
    () => queryPrisonBuildings(devicePrisonId as number),
    {
      ready: Boolean(devicePrisonId),
      refreshDeps: [devicePrisonId],
    }
  );

  const {
    data: floorDevicePageData,
    loading: floorDevicesLoading,
    refresh: refreshFloorDevices,
  } = useRequest(
    () =>
      queryFloorDevicePage({
        floorId: selectedFloorId as number,
        pageNum: 1,
        pageSize: 200,
      }),
    {
      ready: Boolean(selectedFloorId),
      refreshDeps: [selectedFloorId],
    }
  );

  const detail: BuildingInfoVO | undefined = detailData;

  const prisonOptions = prisonId
    ? [
        {
          label:
            prisonDetail?.name ||
            intl.formatMessage({ id: 'pages.region.fallback.prisonWithId' }, { id: prisonId }),
          value: Number(prisonId),
        },
      ]
    : [];

  const deviceBuildingOptions =
    deviceBuildingsData?.map((item: any) => ({
      label:
        item.name ||
        intl.formatMessage({ id: 'pages.region.fallback.buildingWithId' }, { id: item.id }),
      value: Number(item.id),
    })) ?? [];

  const sortedFloorData = React.useMemo(
    () =>
      [...(floorData ?? [])].sort((a: any, b: any) => getFloorSortValue(a) - getFloorSortValue(b)),
    [floorData]
  );

  const floorOptions =
    sortedFloorData.map((item: any) => ({
      label: getFloorDisplayName(item),
      value: Number(item.id),
    })) ?? [];

  const currentFloorFromList = floorData?.find(
    (item: any) => Number(item.id) === Number(selectedFloorId)
  );
  const currentFloorDrawing = floorFormData?.floorDrawing ?? currentFloorFromList?.floorDrawing;
  const currentFloorDrawingUrl = React.useMemo(
    () => normalizeFloorDrawingPath(currentFloorDrawing),
    [currentFloorDrawing]
  );
  const isImageDrawing = isSupportedDrawingImage(currentFloorDrawingUrl);
  const floorDeviceRows: any[] = (() => {
    const raw: any = floorDevicePageData;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.records)) return raw.records;
    if (Array.isArray(raw?.list)) return raw.list;
    if (Array.isArray(raw?.rows)) return raw.rows;
    if (Array.isArray(raw?.data?.records)) return raw.data.records;
    if (Array.isArray(raw?.data?.list)) return raw.data.list;
    if (Array.isArray(raw?.data?.rows)) return raw.data.rows;
    return [];
  })();

  useEffect(() => {
    if (!floorData?.length) {
      return;
    }

    if (initialQueryFloorId) {
      const matchedFloor = floorData.find((item: any) => Number(item.id) === initialQueryFloorId);

      if (matchedFloor) {
        if (Number(selectedFloorId) !== Number(matchedFloor.id)) {
          setSelectedFloorId(Number(matchedFloor.id));
        }
        return;
      }
    }

    if (selectedFloorId) {
      return;
    }

    setSelectedFloorId(Number(sortedFloorData[0].id));
  }, [floorData, initialQueryFloorId, selectedFloorId, sortedFloorData]);

  const clampCoordinate = (coord: DevicePosition): DevicePosition => {
    const map = mapRef.current;
    if (!map) return coord;
    const extent = map.getView().getProjection().getExtent();
    if (!extent) return coord;
    return [
      Math.min(Math.max(coord[0], extent[0]), extent[2]),
      Math.min(Math.max(coord[1], extent[1]), extent[3]),
    ];
  };

  const placeDevice = (deviceId: number, coord: DevicePosition) => {
    const targetCoord = clampCoordinate(coord);
    setDevices((prev) =>
      prev.map((item) => {
        if (item.id !== deviceId) return item;
        return { ...item, position: targetCoord };
      })
    );
    setMarkerAction(null);
    void updateDeviceXY(deviceId, String(targetCoord[0]), String(targetCoord[1]))
      .then(() => {
        message.success(intl.formatMessage({ id: 'pages.region.message.devicePositionUpdated' }));
      })
      .catch(() => {
        message.error(intl.formatMessage({ id: 'pages.region.message.devicePositionSaveFailed' }));
      });
    setPlacingDeviceId(null);
  };

  const handleDeviceDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const map = mapRef.current;
    const mapContainer = mapContainerRef.current;
    if (!map || !mapContainer) return;
    const deviceId = Number(event.dataTransfer.getData('text/plain'));
    if (!deviceId) return;
    const rect = mapContainer.getBoundingClientRect();
    const pixel: [number, number] = [event.clientX - rect.left, event.clientY - rect.top];
    const coord = map.getCoordinateFromPixel(pixel);
    if (!coord) return;
    placeDevice(deviceId, coord as DevicePosition);
  };

  useEffect(() => {
    placingDeviceIdRef.current = placingDeviceId;
  }, [placingDeviceId]);

  useEffect(() => {
    let cancelled = false;
    let resizeHandler: (() => void) | null = null;
    if (!currentFloorDrawingUrl || !isImageDrawing) {
      setDrawingLoading(false);
      setMarkerSyncVersion((prev) => prev + 1);
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
      markerSourceRef.current = null;
      return;
    }
    setDrawingLoading(true);
    const image = new window.Image();
    image.src = currentFloorDrawingUrl;
    image.onload = () => {
      if (cancelled || !mapContainerRef.current) return;
      const extent: [number, number, number, number] = [0, 0, image.width, image.height];
      const imageWidth = extent[2] - extent[0];
      const imageHeight = extent[3] - extent[1];
      const containerWidth = Math.max(mapContainerRef.current.clientWidth, 1);
      const containerHeight = Math.max(mapContainerRef.current.clientHeight, 1);
      const initialResolution = Math.max(
        imageWidth / containerWidth,
        imageHeight / containerHeight
      );
      const fitByLongestEdge = (targetMap: OlMap) => {
        const size = targetMap.getSize();
        if (!size) return;
        const [targetContainerWidth, targetContainerHeight] = size;
        if (!targetContainerWidth || !targetContainerHeight) return;
        const resolution = Math.max(
          imageWidth / targetContainerWidth,
          imageHeight / targetContainerHeight
        );
        const view = targetMap.getView();
        view.setCenter(getCenter(extent));
        view.setResolution(resolution);
      };
      const projection = new Projection({
        code: 'building-map-image',
        units: 'pixels',
        extent,
      });

      const imageLayer = new ImageLayer({
        source: new Static({
          url: currentFloorDrawingUrl,
          projection,
          imageExtent: extent,
        }),
      });

      const markerSource = new VectorSource();
      markerSourceRef.current = markerSource;
      const markerLayer = new VectorLayer({
        source: markerSource,
        style: (feature: any) => {
          const displayIndex = String(feature.get('displayIndex') ?? '');
          const isAlarm = Number(feature.get('isAlarm'));
          return new Style({
            image: new CircleStyle({
              radius: 14,
              fill: new Fill({ color: getDeviceMarkerColor(isAlarm) }),
              stroke: new Stroke({ color: '#ffffff', width: 2 }),
            }),
            text: new Text({
              text: displayIndex,
              fill: new Fill({ color: '#ffffff' }),
              font: 'bold 14px sans-serif',
            }),
          });
        },
      });

      const map = new OlMap({
        target: mapContainerRef.current,
        layers: [imageLayer, markerLayer],
        interactions: defaultInteractions({ doubleClickZoom: false }),
        view: new View({
          projection,
          center: getCenter(extent),
          resolution: initialResolution,
          maxResolution: initialResolution * 8,
          minResolution: Math.max(initialResolution / Math.pow(2, 20), 0.0001),
          constrainOnlyCenter: true,
          smoothExtentConstraint: false,
          zoomFactor: 1.2,
          minZoom: -8,
          maxZoom: 28,
          extent,
        }),
      });
      map.updateSize();
      fitByLongestEdge(map);
      resizeHandler = () => {
        map.updateSize();
        fitByLongestEdge(map);
      };
      window.addEventListener('resize', resizeHandler);

      const selectInteraction = new OlSelect({
        layers: [markerLayer],
        hitTolerance: 8,
        style: null,
      });
      selectInteraction.on('select', (evt: any) => {
        const feature = evt.selected?.[0];
        const geometry = feature?.getGeometry();
        if (!(geometry instanceof Point)) {
          setMarkerAction(null);
          return;
        }
        const deviceId = Number(feature.get('deviceId'));
        if (!deviceId) {
          setMarkerAction(null);
          return;
        }
        const pixel = map.getPixelFromCoordinate(geometry.getCoordinates());
        if (!pixel) {
          setMarkerAction(null);
          return;
        }
        setMarkerAction({
          deviceId,
          label: String(feature.get('label') ?? deviceId),
          pixel: [pixel[0], pixel[1]],
        });
      });
      const translateInteraction = new Translate({
        features: selectInteraction.getFeatures(),
        hitTolerance: 8,
      });
      translateInteraction.on('translateend', (evt: any) => {
        const feature = evt.features.item(0);
        const geometry = feature?.getGeometry();
        if (!(geometry instanceof Point)) return;
        const deviceId = Number(feature.get('deviceId'));
        if (!deviceId) return;
        placeDevice(deviceId, geometry.getCoordinates() as DevicePosition);
      });
      map.addInteraction(selectInteraction);
      map.addInteraction(translateInteraction);

      map.on('click', (evt: any) => {
        if (!placingDeviceIdRef.current) return;
        placeDevice(placingDeviceIdRef.current, evt.coordinate as DevicePosition);
      });
      map.on('click', (evt: any) => {
        if (placingDeviceIdRef.current) return;
        const hasFeature = map.hasFeatureAtPixel(evt.pixel, {
          layerFilter: (layer: any) => layer === markerLayer,
        });
        if (!hasFeature) {
          setMarkerAction(null);
        }
      });
      map.on('moveend', () => {
        setMarkerAction((prev) => {
          if (!prev) return prev;
          const feature = markerSource
            .getFeatures()
            .find((item: any) => Number(item.get('deviceId')) === prev.deviceId);
          const geometry = feature?.getGeometry();
          if (!(geometry instanceof Point)) return null;
          const pixel = map.getPixelFromCoordinate(geometry.getCoordinates());
          if (!pixel) return null;
          return { ...prev, pixel: [pixel[0], pixel[1]] };
        });
      });

      mapRef.current = map;
      setMarkerSyncVersion((prev) => prev + 1);
      setDrawingLoading(false);
    };
    image.onerror = () => {
      setDrawingLoading(false);
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
      markerSourceRef.current = null;
      setMarkerAction(null);
      setMarkerSyncVersion((prev) => prev + 1);
    };
    return () => {
      cancelled = true;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
      }
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
      markerSourceRef.current = null;
      setMarkerAction(null);
      setMarkerSyncVersion((prev) => prev + 1);
    };
  }, [currentFloorDrawingUrl, isImageDrawing]);

  useEffect(() => {
    const source = markerSourceRef.current;
    if (!source) return;
    const nextDeviceById: Record<number, DeviceItem> = {};
    devices.forEach((item) => {
      if (item.position) nextDeviceById[item.id] = item;
    });

    source.getFeatures().forEach((feature: any) => {
      const deviceId = Number(feature.get('deviceId'));
      const next = nextDeviceById[deviceId];
      if (!next || !next.position) {
        source.removeFeature(feature);
        return;
      }
      const geometry = feature.getGeometry();
      if (geometry instanceof Point) {
        geometry.setCoordinates(next.position);
      } else {
        feature.setGeometry(new Point(next.position));
      }
      feature.set('label', next.label);
      feature.set('displayIndex', next.displayIndex);
      feature.set('isAlarm', next.isAlarm);
      delete nextDeviceById[deviceId];
    });

    Object.values(nextDeviceById).forEach((item) => {
      if (!item.position) return;
      const feature = new Feature({
        geometry: new Point(item.position),
      });
      feature.set('deviceId', item.id);
      feature.set('label', item.label);
      feature.set('displayIndex', item.displayIndex);
      feature.set('isAlarm', item.isAlarm);
      source.addFeature(feature);
    });
  }, [devices, markerSyncVersion]);

  useEffect(() => {
    setDevices((prev) => {
      const previousPositionById: Record<number, DevicePosition | null> = {};
      prev.forEach((item) => {
        previousPositionById[item.id] = item.position;
      });
      const next = floorDeviceRows.map((item: any, index: number) => {
        const parsedId = Number(item?.id ?? item?.deviceId);
        const id = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : index + 1;
        const label = String(item?.name ?? item?.deviceName ?? item?.deviceNo ?? id);
        const parsedX = Number(item?.positionX);
        const parsedY = Number(item?.positionY);
        const persistedPosition =
          Number.isFinite(parsedX) && Number.isFinite(parsedY)
            ? clampCoordinate([parsedX, parsedY])
            : null;
        return {
          id,
          label,
          displayIndex: index + 1,
          isAlarm: Number(item?.isAlarm ?? 0),
          position: Object.prototype.hasOwnProperty.call(previousPositionById, id)
            ? (previousPositionById[id] ?? null)
            : persistedPosition,
        };
      });
      return next;
    });
  }, [floorDevicePageData]);

  useEffect(() => {
    if (placingDeviceId === null) return;
    if (devices.some((item) => item.id === placingDeviceId)) return;
    setPlacingDeviceId(null);
  }, [devices, placingDeviceId]);

  const normalizeUpload = (event: any) => {
    if (Array.isArray(event)) return event;
    return event?.fileList ?? [];
  };

  const handleBeforeDrawingUpload = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg'];
    const isAccepted = extension ? allowedExtensions.includes(extension) : false;

    if (!isAccepted) {
      message.error(intl.formatMessage({ id: 'pages.region.message.uploadInvalidFormat' }));
      return Upload.LIST_IGNORE;
    }

    if (file.size > FLOOR_DRAWING_MAX_SIZE) {
      message.error(intl.formatMessage({ id: 'pages.region.message.uploadTooLarge' }));
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleFloorChange = (value: number) => {
    const nextFloorId = value ? Number(value) : null;
    setSelectedFloorId(nextFloorId);
    history.replace(
      `/region/building/${prisonId}/${buildingId}${nextFloorId ? `?floorId=${nextFloorId}` : ''}`
    );
  };

  const handleOpenDeviceModal = () => {
    const nextPrisonId = prisonId ? Number(prisonId) : null;
    const nextBuildingId = buildingId ? Number(buildingId) : null;
    setDevicePrisonId(nextPrisonId);
    setDeviceStep(0);
    deviceForm.setFieldsValue({
      prisonId: nextPrisonId ?? undefined,
      buildingId: nextBuildingId ?? undefined,
      floorId: selectedFloorId ?? undefined,
      deviceCode: undefined,
      powerOff: true,
      ...Object.fromEntries(POWER_CHANNEL_KEYS.map((key) => [key, undefined])),
    });
    setPowerChannelValues({ ...INITIAL_POWER_CHANNEL_VALUES });
    setDeviceModalOpen(true);
  };

  const handleOpenPlanModal = () => {
    planForm.setFieldsValue({
      floor: selectedFloorId ? Number(selectedFloorId) : undefined,
      image: [],
    });
    setPlanModalOpen(true);
  };

  const handlePlanOk = async () => {
    try {
      const values = await planForm.validateFields();
      const fileList = values.image ?? [];
      const file = fileList[0];
      const floorDrawing = normalizeFloorDrawingPath(file?.response?.data?.url);
      const floorId = Number(values.floor);
      if (!floorId || !floorDrawing) {
        message.error(intl.formatMessage({ id: 'pages.region.message.selectFloorAndUpload' }));
        return;
      }
      setPlanSubmitting(true);
      await updateFloorDrawing(floorId, floorDrawing);
      await refreshFloors();
      await refreshFloorForm();
      message.success(intl.formatMessage({ id: 'pages.region.message.addSuccess' }));
      setPlanModalOpen(false);
      planForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(intl.formatMessage({ id: 'pages.region.message.addFailed' }));
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleDeleteFloorDrawing = () => {
    if (!selectedFloorId || !currentFloorDrawing) return;

    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.region.deleteConfirm.drawingTitle' }),
      content: intl.formatMessage({ id: 'pages.region.deleteConfirm.drawingContent' }),
      okText: intl.formatMessage({ id: 'pages.region.deleteConfirm.ok' }),
      cancelText: intl.formatMessage({ id: 'pages.region.action.cancel' }),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await updateFloorDrawing(selectedFloorId, '');
          await refreshFloors();
          await refreshFloorForm();
          setMarkerAction(null);
          setPlacingDeviceId(null);
          message.success(intl.formatMessage({ id: 'pages.region.message.drawingDeleted' }));
        } catch {
          message.error(intl.formatMessage({ id: 'pages.region.message.deleteFailed' }));
        }
      },
    });
  };

  const handleDeleteDevice = (device: DeviceItem) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.region.deleteConfirm.deviceTitle' }),
      content: intl.formatMessage(
        { id: 'pages.region.deleteConfirm.deviceContent' },
        { name: device.label }
      ),
      okText: intl.formatMessage({ id: 'pages.region.deleteConfirm.ok' }),
      cancelText: intl.formatMessage({ id: 'pages.region.action.cancel' }),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteDevice(device.id);
          setDevices((prev) => prev.filter((item) => item.id !== device.id));
          if (placingDeviceId === device.id) {
            setPlacingDeviceId(null);
          }
          if (markerAction?.deviceId === device.id) {
            setMarkerAction(null);
          }
          await refreshFloorDevices();
          await refreshDetail();
          message.success(intl.formatMessage({ id: 'pages.region.message.deviceDeleted' }));
        } catch {
          message.error(intl.formatMessage({ id: 'pages.region.message.deleteFailed' }));
        }
      },
    });
  };

  const handleOpenEditDeviceModal = async (device: DeviceItem) => {
    try {
      const result = await queryDeviceForm(device.id);
      const deviceFormData = (result?.data ?? {}) as DeviceFormVO;
      const nextPrisonId = Number(deviceFormData.prisonId ?? prisonId);
      const nextBuildingId = Number(deviceFormData.buildingId ?? buildingId);
      const nextFloorId = Number(deviceFormData.floorId ?? selectedFloorId);
      const nextPowerChannelValues = POWER_CHANNEL_KEYS.reduce(
        (acc, key) => {
          acc[key] = normalizePowerChannelValue(deviceFormData[key as keyof DeviceFormVO] as any);
          return acc;
        },
        {} as Record<string, number>
      );

      setEditingDeviceId(device.id);
      setEditDeviceStep(0);
      setDevicePrisonId(Number.isFinite(nextPrisonId) ? nextPrisonId : null);
      setEditPowerChannelValues(nextPowerChannelValues);
      editDeviceForm.resetFields();
      editDeviceForm.setFieldsValue({
        prisonId: Number.isFinite(nextPrisonId) ? nextPrisonId : undefined,
        buildingId: Number.isFinite(nextBuildingId) ? nextBuildingId : undefined,
        floorId: Number.isFinite(nextFloorId) ? nextFloorId : undefined,
        deviceCode: deviceFormData.deviceNo ?? deviceFormData.deviceName ?? device.label,
        networkCode: deviceFormData.entireNo,
        powerOff: Number(deviceFormData.powerOff ?? 0) === 0,
        ip: deviceFormData.ipAddress,
        port: deviceFormData.port,
        startTime: parseDeviceTimeValue(deviceFormData.startTime),
        stopTime: parseDeviceTimeValue(deviceFormData.endTime),
        ...nextPowerChannelValues,
      });
      setEditDeviceModalOpen(true);
    } catch {
      message.error(intl.formatMessage({ id: 'pages.region.message.deviceFormLoadFailed' }));
    }
  };

  const handleDeviceCancel = () => {
    setDeviceModalOpen(false);
    setDeviceStep(0);
    deviceForm.resetFields();
  };

  const handleDeviceNext = async () => {
    try {
      await deviceForm.validateFields(['prisonId', 'buildingId', 'floorId', 'deviceCode']);
      setDeviceStep(1);
    } catch {
      return;
    }
  };

  const handleDevicePrev = () => {
    setDeviceStep(0);
  };

  const handleDeviceFinish = async () => {
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
      message.success(intl.formatMessage({ id: 'pages.region.message.addSuccess' }));
      setDeviceModalOpen(false);
      setDeviceStep(0);
      deviceForm.resetFields();
      if (Number(values.floorId) === Number(selectedFloorId)) {
        refreshFloorDevices();
      }
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(intl.formatMessage({ id: 'pages.region.message.addFailed' }));
    }
  };

  const handleDevicePrisonChange = (value: number | null) => {
    setDevicePrisonId(value ?? null);
    deviceForm.setFieldsValue({ buildingId: undefined, floorId: undefined });
  };

  const handleDeviceBuildingChange = () => {
    deviceForm.setFieldsValue({ floorId: undefined });
  };

  const handleEditDevicePrisonChange = (value: number | null) => {
    setDevicePrisonId(value ?? null);
    editDeviceForm.setFieldsValue({ buildingId: undefined, floorId: undefined });
  };

  const handleEditDeviceBuildingChange = () => {
    editDeviceForm.setFieldsValue({ floorId: undefined });
  };

  const handleEditDeviceCancel = () => {
    setEditDeviceModalOpen(false);
    setEditDeviceStep(0);
    setEditingDeviceId(null);
    setEditDeviceSubmitting(false);
    editDeviceForm.resetFields();
    setEditPowerChannelValues({ ...INITIAL_POWER_CHANNEL_VALUES });
  };

  const handleEditDeviceNext = async () => {
    try {
      await editDeviceForm.validateFields(['prisonId', 'buildingId', 'floorId', 'deviceCode']);
      setEditDeviceStep(1);
    } catch {
      return;
    }
  };

  const handleEditDevicePrev = () => {
    setEditDeviceStep(0);
  };

  const handleEditDeviceFinish = async () => {
    if (!editingDeviceId) return;

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

      setEditDeviceSubmitting(true);
      await updateDevice(editingDeviceId, {
        id: editingDeviceId,
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
      message.success(intl.formatMessage({ id: 'pages.region.message.deviceUpdated' }));
      handleEditDeviceCancel();
      await refreshFloorDevices();
      await refreshDetail();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(intl.formatMessage({ id: 'pages.region.message.deviceUpdateFailed' }));
    } finally {
      setEditDeviceSubmitting(false);
    }
  };

  const handleResetMapDevices = () => {
    setDevices((prev) => prev.map((item) => ({ ...item, position: null })));
    setMarkerAction(null);
    setPlacingDeviceId(null);
  };

  const handleResetDevicePosition = async (device: DeviceItem) => {
    try {
      await updateDeviceXY(device.id, '', '');
      setDevices((prev) =>
        prev.map((item) => (item.id === device.id ? { ...item, position: null } : item))
      );
      if (placingDeviceId === device.id) {
        setPlacingDeviceId(null);
      }
      if (markerAction?.deviceId === device.id) {
        setMarkerAction(null);
      }
      await refreshFloorDevices();
      message.success(intl.formatMessage({ id: 'pages.region.message.devicePositionReset' }));
    } catch {
      message.error(intl.formatMessage({ id: 'pages.region.message.devicePositionSaveFailed' }));
    }
  };

  const handleViewDeviceDetail = (deviceId: number) => {
    setSelectedDeviceId(deviceId);
    setDeviceDetailOpen(true);
  };

  const handleCloseDeviceDetail = () => {
    setDeviceDetailOpen(false);
    setSelectedDeviceId(null);
  };

  const handleAdjustDevicePosition = (deviceId: number) => {
    setMarkerAction(null);
    setPlacingDeviceId(deviceId);
    message.info(intl.formatMessage({ id: 'pages.region.message.placeDeviceHint' }, { deviceId }));
  };

  const stats = [
    {
      label: intl.formatMessage({ id: 'pages.region.field.buildingFloors' }),
      value: detail?.floorNum ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.device' }),
      value: detail?.totalDevices ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.online' }),
      value: detail?.onlineDevices ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.offline' }),
      value: detail?.offlineDevices ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.alarm' }),
      value: detail?.totalAlarms ?? 0,
    },
  ];

  return (
    <PageContainer title={false}>
      <div style={{ background: '#fff', margin: '-8px -8px 0', minHeight: 'calc(100vh - 128px)' }}>
        <Row gutter={0}>
          <Col xs={24} xl={6} style={{ overflow: 'hidden' }}>
            <div
              onClick={() => history.back()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  history.back();
                }
              }}
              role="button"
              style={{
                position: 'relative',
                height: 'calc(100vh - 128px)',
                backgroundImage: `url(${gb})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              tabIndex={0}
            >
              <Button
                className="soft-green-action"
                onClick={(event) => event.stopPropagation()}
                style={{ position: 'absolute', top: 12, right: 12 }}
              >
                {intl.formatMessage({ id: 'pages.region.action.edit' })}
              </Button>
              <div
                style={{
                  fontSize: 48,
                  color: '#111',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  WebkitTextStroke: '1px #fff',
                  textShadow: '0 0 1px #fff',
                }}
              >
                {detail?.name || ''}
              </div>
            </div>
          </Col>

          <Col xs={24} xl={18}>
            <Spin spinning={detailLoading || floorFormLoading}>
              <div style={{ minHeight: 680, padding: '18px 26px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button className="soft-green-action" onClick={() => history.back()}>
                    {intl.formatMessage({ id: 'pages.region.action.back' })}
                  </Button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 16,
                    marginTop: 20,
                  }}
                >
                  {stats.map((item) => (
                    <div key={item.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '42px', lineHeight: 1.1 }}>{item.value}</div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 'clamp(18px, 2.2vw, 30px)',
                          color: '#111',
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <Divider style={{ margin: '18px 0 22px' }} />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 30, color: '#111' }}>
                      {intl.formatMessage({ id: 'pages.region.label.currentFloor' })}
                    </span>
                    <Select
                      value={Number(selectedFloorId)}
                      onChange={handleFloorChange}
                      options={floorOptions}
                      style={{ width: 160 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="primary" onClick={handleOpenPlanModal}>
                      {intl.formatMessage({ id: 'pages.region.action.addFloorDrawing' })}
                    </Button>
                    {currentFloorDrawingUrl ? (
                      <Button danger onClick={handleDeleteFloorDrawing}>
                        {intl.formatMessage({ id: 'pages.region.action.deleteFloorDrawing' })}
                      </Button>
                    ) : null}
                    <Button onClick={handleOpenDeviceModal}>
                      {intl.formatMessage({ id: 'pages.region.action.addDevice' })}
                    </Button>
                  </div>
                </div>

                <div
                  style={{
                    minHeight: 520,
                    padding: '8px 0 24px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      flex: 1,
                      minWidth: 280,
                      minHeight: 520,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#fafafa',
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDeviceDrop}
                  >
                    {currentFloorDrawingUrl && isImageDrawing ? (
                      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Empty
                          description={
                            currentFloorDrawingUrl
                              ? intl.formatMessage({ id: 'pages.region.status.drawingUnsupported' })
                              : intl.formatMessage({ id: 'pages.region.status.floorNoDrawing' })
                          }
                        />
                      </div>
                    )}
                    {drawingLoading ? (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.72)',
                          zIndex: 2,
                        }}
                      >
                        <Spin
                          tip={intl.formatMessage({ id: 'pages.region.status.drawingLoading' })}
                        />
                      </div>
                    ) : null}
                    {placingDeviceId ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: 12,
                          padding: '4px 10px',
                          borderRadius: 14,
                          background: 'rgba(22,119,255,0.12)',
                          color: '#1677ff',
                          fontSize: 12,
                        }}
                      >
                        {intl.formatMessage(
                          { id: 'pages.region.label.selectedDevicePlacement' },
                          { deviceId: placingDeviceId }
                        )}
                      </div>
                    ) : null}
                    {markerAction ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: markerAction.pixel[0],
                          top: markerAction.pixel[1] - 10,
                          transform: 'translate(-50%, -100%)',
                          maxWidth: 220,
                          background: '#fff',
                          border: '1px solid #d9d9d9',
                          borderRadius: 8,
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                          padding: '6px 10px',
                          zIndex: 4,
                          color: 'rgba(0,0,0,0.78)',
                          fontSize: 12,
                          lineHeight: 1.4,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {markerAction.label}
                      </div>
                    ) : null}
                  </div>
                  <div
                    style={{
                      width: 200,
                      minWidth: 180,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      padding: 12,
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {intl.formatMessage({ id: 'pages.region.title.deviceList' })}
                      </div>
                      <Button type="link" size="small" onClick={handleResetMapDevices}>
                        {intl.formatMessage({ id: 'pages.region.action.reset' })}
                      </Button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <Spin spinning={floorDevicesLoading}>
                        {devices.length === 0 ? (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={intl.formatMessage({ id: 'pages.region.status.noDevice' })}
                          />
                        ) : null}
                      </Spin>
                      {devices.map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/plain', String(item.id));
                            setPlacingDeviceId(item.id);
                          }}
                          onClick={() => setPlacingDeviceId(item.id)}
                          style={{
                            position: 'relative',
                            border:
                              placingDeviceId === item.id
                                ? '1px solid #1677ff'
                                : '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: '8px 28px 8px 10px',
                            cursor: 'grab',
                            userSelect: 'none',
                            background: '#fff',
                          }}
                        >
                          <Dropdown
                            trigger={['click']}
                            menu={{
                              items: [
                                {
                                  key: 'edit',
                                  icon: <EditOutlined />,
                                  label: intl.formatMessage({ id: 'pages.region.action.edit' }),
                                },
                                {
                                  key: 'view',
                                  icon: <EyeOutlined />,
                                  label: intl.formatMessage({
                                    id: 'pages.region.action.viewDetail',
                                  }),
                                },
                                {
                                  key: 'position',
                                  icon: <AimOutlined />,
                                  label: intl.formatMessage({
                                    id: 'pages.region.action.modifyPosition',
                                  }),
                                },
                                {
                                  key: 'reset',
                                  icon: <ReloadOutlined />,
                                  label: intl.formatMessage({ id: 'pages.region.action.reset' }),
                                },
                                { type: 'divider' },
                                {
                                  key: 'delete',
                                  danger: true,
                                  icon: <DeleteOutlined />,
                                  label: intl.formatMessage({ id: 'pages.region.action.delete' }),
                                },
                              ],
                              onClick: ({ key, domEvent }) => {
                                domEvent.stopPropagation();
                                if (key === 'edit') {
                                  void handleOpenEditDeviceModal(item);
                                  return;
                                }
                                if (key === 'view') {
                                  handleViewDeviceDetail(item.id);
                                  return;
                                }
                                if (key === 'position') {
                                  handleAdjustDevicePosition(item.id);
                                  return;
                                }
                                if (key === 'reset') {
                                  void handleResetDevicePosition(item);
                                  return;
                                }
                                if (key === 'delete') {
                                  handleDeleteDevice(item);
                                }
                              },
                            }}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<MoreOutlined />}
                              aria-label={intl.formatMessage({
                                id: 'pages.region.action.operation',
                              })}
                              onClick={(event) => event.stopPropagation()}
                              onMouseDown={(event) => event.stopPropagation()}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 22,
                                height: 22,
                                minWidth: 22,
                                padding: 0,
                                lineHeight: '22px',
                              }}
                            />
                          </Dropdown>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: getDeviceMarkerColor(item?.isAlarm),
                                color: '#fff',
                                fontSize: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {item.displayIndex}
                            </span>
                            <span style={{ fontSize: 13 }}>
                              {intl.formatMessage(
                                { id: 'pages.region.label.deviceWithName' },
                                { name: item.label }
                              )}
                            </span>
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                            {item.position
                              ? intl.formatMessage({ id: 'pages.region.status.placedDraggable' })
                              : intl.formatMessage({
                                  id: 'pages.region.status.notPlacedDragToMap',
                                })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Spin>
          </Col>
        </Row>
      </div>

      <Modal
        title={intl.formatMessage({ id: 'pages.region.modal.addDrawing' })}
        open={planModalOpen}
        onCancel={() => setPlanModalOpen(false)}
        onOk={handlePlanOk}
        okButtonProps={{ loading: planSubmitting }}
      >
        <Form form={planForm} layout="vertical" initialValues={{ floor: null }}>
          <Form.Item
            label={intl.formatMessage({ id: 'pages.region.field.selectFloor' })}
            name="floor"
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'pages.region.validation.selectFloor' }),
              },
            ]}
          >
            <Select options={floorOptions} />
          </Form.Item>
          <Form.Item label={intl.formatMessage({ id: 'pages.region.field.uploadImage' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Form.Item
                name="image"
                valuePropName="fileList"
                getValueFromEvent={normalizeUpload}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: 'pages.region.validation.uploadDrawing' }),
                  },
                ]}
                noStyle
              >
                <Upload
                  accept={FLOOR_DRAWING_ACCEPT}
                  action="/api/v1/files"
                  beforeUpload={handleBeforeDrawingUpload}
                  name="file"
                  listType="picture-card"
                  maxCount={1}
                  headers={{
                    authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
                  }}
                >
                  {!hasPlanDrawingFile ? (
                    <div>{intl.formatMessage({ id: 'pages.region.action.upload' })}</div>
                  ) : null}
                </Upload>
              </Form.Item>
              {!hasPlanDrawingFile ? (
                <div style={{ color: '#ff4d4f', lineHeight: 1.7 }}>
                  {intl.formatMessage({ id: 'pages.region.hint.uploadDrawing' })}
                </div>
              ) : null}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <AddDeviceModal
        open={deviceModalOpen}
        step={deviceStep}
        form={deviceForm}
        powerChannelKeys={POWER_CHANNEL_KEYS}
        powerChannelValues={powerChannelValues}
        prisonOptions={prisonOptions}
        buildingOptions={deviceBuildingOptions}
        floorOptions={floorOptions}
        deviceBuildingsLoading={deviceBuildingsLoading}
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
      <EditDeviceModal
        open={editDeviceModalOpen}
        step={editDeviceStep}
        form={editDeviceForm}
        powerChannelKeys={POWER_CHANNEL_KEYS}
        powerChannelValues={editPowerChannelValues}
        prisonOptions={prisonOptions}
        buildingOptions={deviceBuildingOptions}
        floorOptions={floorOptions}
        deviceBuildingsLoading={deviceBuildingsLoading}
        submitting={editDeviceSubmitting}
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
      <DeviceDetailModal
        open={deviceDetailOpen}
        deviceId={selectedDeviceId}
        onCancel={handleCloseDeviceDetail}
      />
    </PageContainer>
  );
};

export default BuildingDetailPage;
