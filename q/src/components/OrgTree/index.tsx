import { CaretDownOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Spin, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React from 'react';
import type { BuildingDetailVO, PrisonVO, ProvinceVO } from '@/pages/region/data.d';
import {
  queryBuildingFloors,
  queryPrisonBuildings,
  queryProvincePrisons,
} from '@/pages/region/service';
import styles from './index.less';

export type OrgTreeNodeType = 'country' | 'province' | 'prison' | 'building' | 'floor';

export type OrgTreeSelectionParams = {
  nodeType: OrgTreeNodeType;
  provinceId?: number | string;
  prisonId?: number | string;
  buildingId?: number | string;
  floorId?: number | string;
};

type AlarmTreeNode = Omit<DataNode, 'children'> &
  OrgTreeSelectionParams & {
    children?: AlarmTreeNode[];
  };

type FloorVO = {
  id?: number | string;
  floorName?: string;
  floorNo?: number | string;
};

export type OrgTreeProps = {
  provinceList: ProvinceVO[];
  loading?: boolean;
  className?: string;
  maxLevel?: 1 | 2 | 3 | 4;
  rootTitle?: React.ReactNode;
  onSelectionChange?: (params: OrgTreeSelectionParams) => void;
};

const buildFloorNodes = (
  floorList: FloorVO[],
  parent: { provinceId?: number | string; prisonId?: number | string; buildingId?: number | string }
): AlarmTreeNode[] =>
  floorList.map((floor, index) => ({
    title: floor.floorName ?? '-',
    key: `floor-${floor.id ?? floor.floorNo ?? index}`,
    nodeType: 'floor',
    floorId: floor.id,
    provinceId: parent.provinceId,
    prisonId: parent.prisonId,
    buildingId: parent.buildingId,
    isLeaf: true,
  }));

const buildBuildingNodes = (
  buildingList: BuildingDetailVO[],
  parent: { provinceId?: number | string; prisonId?: number | string },
  maxLevel: number
): AlarmTreeNode[] =>
  buildingList.map((building, index) => ({
    title: building.name ?? '-',
    key: `building-${building.id ?? index}`,
    nodeType: 'building',
    buildingId: building.id,
    provinceId: parent.provinceId,
    prisonId: parent.prisonId,
    isLeaf: maxLevel <= 3,
    children: maxLevel >= 4 ? [] : undefined,
  }));

const buildPrisonNodes = (
  prisonList: PrisonVO[],
  parent: { provinceId?: number | string },
  maxLevel: number
): AlarmTreeNode[] =>
  prisonList.map((prison, index) => {
    const canExpand = maxLevel >= 3 && Boolean(prison.buildingNum && prison.buildingNum > 0);

    return {
      title: prison.name ?? '-',
      key: `prison-${prison.id ?? index}`,
      nodeType: 'prison',
      prisonId: prison.id,
      provinceId: parent.provinceId,
      isLeaf: !canExpand,
      children: canExpand ? [] : undefined,
    };
  });

const buildProvinceNodes = (
  provinceList: ProvinceVO[],
  maxLevel: number,
  rootTitle: React.ReactNode
): AlarmTreeNode[] => [
  {
    title: rootTitle,
    key: 'country',
    nodeType: 'country',
    isLeaf: false,
    children: provinceList.map((province, index) => {
      const canExpand =
        maxLevel >= 2 && Boolean(province.totalPrisons && province.totalPrisons > 0);

      return {
        title: province.provinceName ?? '-',
        key: `province-${province.provinceId ?? province.provinceName ?? index}`,
        nodeType: 'province',
        provinceId: province.provinceId,
        isLeaf: !canExpand,
        children: canExpand ? [] : undefined,
      };
    }),
  },
];

const OrgTree: React.FC<OrgTreeProps> = ({
  provinceList,
  loading,
  className,
  maxLevel = 4,
  rootTitle,
  onSelectionChange,
}) => {
  const intl = useIntl();
  const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>([]);
  const [provincePrisons, setProvincePrisons] = React.useState<Record<string, PrisonVO[]>>({});
  const [prisonBuildings, setPrisonBuildings] = React.useState<Record<string, BuildingDetailVO[]>>(
    {}
  );
  const [buildingFloors, setBuildingFloors] = React.useState<Record<string, FloorVO[]>>({});

  const orgTreeData = React.useMemo<AlarmTreeNode[]>(() => {
    const resolvedRootTitle =
      rootTitle ?? intl.formatMessage({ id: 'component.orgTree.rootTitle' });
    const rootNodes = buildProvinceNodes(provinceList, maxLevel, resolvedRootTitle);

    if (maxLevel < 2) {
      return rootNodes;
    }

    return rootNodes.map((rootNode) => ({
      ...rootNode,
      children: rootNode.children?.map((provinceNode) => {
        const provinceKey = String(provinceNode.provinceId ?? provinceNode.key);
        const prisonList = provincePrisons[provinceKey];

        if (!prisonList) {
          return provinceNode;
        }

        const prisonNodes = buildPrisonNodes(
          prisonList,
          { provinceId: provinceNode.provinceId },
          maxLevel
        );

        if (maxLevel < 3) {
          return {
            ...provinceNode,
            children: prisonNodes,
          };
        }

        return {
          ...provinceNode,
          children: prisonNodes.map((prisonNode) => {
            const prisonKey = String(prisonNode.prisonId ?? prisonNode.key);
            const buildingList = prisonBuildings[prisonKey];

            if (!buildingList) {
              return prisonNode;
            }

            const buildingNodes = buildBuildingNodes(
              buildingList,
              {
                provinceId: prisonNode.provinceId,
                prisonId: prisonNode.prisonId,
              },
              maxLevel
            );

            if (maxLevel < 4) {
              return {
                ...prisonNode,
                children: buildingNodes,
              };
            }

            return {
              ...prisonNode,
              children: buildingNodes.map((buildingNode) => {
                const buildingKey = String(buildingNode.buildingId ?? buildingNode.key);
                const floorList = buildingFloors[buildingKey];

                if (!floorList) {
                  return buildingNode;
                }

                return {
                  ...buildingNode,
                  children: buildFloorNodes(floorList, {
                    provinceId: buildingNode.provinceId,
                    prisonId: buildingNode.prisonId,
                    buildingId: buildingNode.buildingId,
                  }),
                };
              }),
            };
          }),
        };
      }),
    }));
  }, [buildingFloors, intl, maxLevel, prisonBuildings, provinceList, provincePrisons, rootTitle]);

  const handleLoadData = async (treeNode: AlarmTreeNode): Promise<void> => {
    const currentNode = treeNode;

    if (currentNode.nodeType === 'province' && maxLevel >= 2) {
      const provinceKey = String(currentNode.provinceId ?? currentNode.key);

      if (provincePrisons[provinceKey] || !currentNode.provinceId) {
        return;
      }

      const prisonList = await queryProvincePrisons(currentNode.provinceId);

      setProvincePrisons((prev) => ({
        ...prev,
        [provinceKey]: (prisonList.data ?? []) as PrisonVO[],
      }));

      return;
    }

    if (currentNode.nodeType === 'prison' && maxLevel >= 3) {
      const prisonKey = String(currentNode.prisonId ?? currentNode.key);

      if (prisonBuildings[prisonKey] || !currentNode.prisonId) {
        return;
      }

      const buildingList = await queryPrisonBuildings(currentNode.prisonId);

      setPrisonBuildings((prev) => ({
        ...prev,
        [prisonKey]: (buildingList.data ?? []) as BuildingDetailVO[],
      }));

      return;
    }

    if (currentNode.nodeType === 'building' && maxLevel >= 4) {
      const buildingKey = String(currentNode.buildingId ?? currentNode.key);

      if (buildingFloors[buildingKey] || !currentNode.buildingId) {
        return;
      }

      const floorList = await queryBuildingFloors(currentNode.buildingId);

      setBuildingFloors((prev) => ({
        ...prev,
        [buildingKey]: (floorList.data ?? []) as FloorVO[],
      }));
    }
  };

  return (
    <Spin spinning={loading} className={styles.treeSpin}>
      <Tree<AlarmTreeNode>
        className={[styles.orgTree, className].filter(Boolean).join(' ')}
        treeData={orgTreeData}
        defaultExpandedKeys={['country']}
        selectedKeys={selectedKeys}
        loadData={handleLoadData}
        onSelect={(nextSelectedKeys, info) => {
          setSelectedKeys(nextSelectedKeys);

          const selectedNode = info.node as AlarmTreeNode;
          onSelectionChange?.({
            nodeType: selectedNode.nodeType,
            provinceId: selectedNode.provinceId,
            prisonId: selectedNode.prisonId,
            buildingId: selectedNode.buildingId,
            floorId: selectedNode.floorId,
          });
        }}
        switcherIcon={({ expanded }) => (
          <CaretDownOutlined className={styles.treeSwitcherIcon} rotate={expanded ? 0 : -90} />
        )}
      />
    </Spin>
  );
};

export default OrgTree;
