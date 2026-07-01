package com.youlai.boot.system.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.youlai.boot.system.mapper.*;
import com.youlai.boot.system.model.entity.*;
import com.youlai.boot.system.model.form.IdsForm;
import com.youlai.boot.system.model.vo.*;
import com.youlai.boot.system.service.ProvinceService;
//import com.youlai.boot.udp.ShieldProtocolUtil;
//import com.youlai.boot.udp.ShieldUdpServer;
import com.youlai.boot.udp.ShieldProtocolUtil;
import com.youlai.boot.udp2.DeviceCommand;
import com.youlai.boot.udp2.RedisCommandQueue;
import com.youlai.boot.udp2.ShieldProtocolConstants;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.checkerframework.checker.units.qual.A;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.system.service.TDeviceService;
import com.youlai.boot.system.model.form.TDeviceForm;
import com.youlai.boot.system.model.query.TDeviceQuery;
import com.youlai.boot.system.converter.TDeviceConverter;

import java.util.*;
import java.util.stream.Collectors;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import org.springframework.transaction.annotation.Transactional;

/**
 * 设备服务实现类
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TDeviceServiceImpl extends ServiceImpl<TDeviceMapper, TDevice> implements TDeviceService {

    private final TDeviceConverter tDeviceConverter;

    private final ProvinceService provinceService;

    private final TPrisonMapper prisonMapper;

    private final TBuildingMapper buildingMapper;

    private final TFloorMapper floorMapper;

//    private final ShieldUdpServer udpServer;

    private final RedisCommandQueue redisCommandQueue;

    /**
    * 获取设备分页列表
    *
    * @param queryParams 查询参数
    * @return {@link IPage<TDeviceVO>} 设备分页列表
    */
    @Override
    public IPage<TDeviceVO> getTDevicePage(TDeviceQuery queryParams) {
        Page<TDeviceVO> pageVO = this.baseMapper.getTDevicePage(
                new Page<>(queryParams.getPageNum(), queryParams.getPageSize()),
                queryParams
        );
        return pageVO;
    }

    /**
     * 获取设备表单数据
     *
     * @param id 设备ID
     * @return 设备表单数据
     */
    @Override
    public TDeviceForm getTDeviceFormData(Long id) {
        TDevice entity = this.getById(id);
        if(entity!=null){
            TFloor tFloor = floorMapper.selectById(entity.getFloorId());
            if(tFloor!=null){
                TBuilding tBuilding = buildingMapper.selectById(tFloor.getBuildingId());
                entity.setBuildingId(tBuilding.getId());
                entity.setBuildingName(tBuilding.getName());
            }
            entity.setFloorName(tFloor.getFloorName());
        }
        return tDeviceConverter.toForm(entity);
    }

    /**
     * 新增设备
     *
     * @param formData 设备表单对象
     * @return 是否新增成功
     */
    @Override
    public boolean saveTDevice(TDeviceForm formData) {
        TDevice entity = tDeviceConverter.toEntity(formData);

        // 先查询 entireNo 是否已存在，保证唯一性
        QueryWrapper<TDevice> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("entire_no", entity.getEntireNo());
        queryWrapper.eq("is_deleted", 0);
        Long count = this.baseMapper.selectCount(queryWrapper);

        if (count > 0) {
            log.error("设备编号已存在: {}", entity.getEntireNo());
            return false; // 如果已存在，返回保存失败
        }

        try {
            List<String> chs = Arrays.asList(entity.getCh1()
                    , entity.getCh2()
                    , entity.getCh3()
                    , entity.getCh4()
                    , entity.getCh5()
                    , entity.getCh6()
                    , entity.getCh7()
                    , entity.getCh8()
                    , entity.getCh9()
                    , entity.getCh10()
                    , entity.getCh11()
                    , entity.getCh12()
                    , entity.getCh13()
                    , entity.getCh14()
                    , entity.getCh15()
                    , entity.getCh16()
                    , entity.getCh17()
                    , entity.getCh18()
            );

//            for (int i = 0; i < chs.size(); i++) {
//                byte[] cmd = ShieldProtocolUtil.buildCmdSetAtt(i + 1, Integer.parseInt(chs.get(i))); // 修正索引从1开始
//                udpServer.sendCmd(entity.getEntireNo(), cmd);
//            }
        } catch(Exception e){
            log.error("设备CH设置失败", e); // 添加异常信息便于调试
            return false; // 设置失败时返回false
        }

        // 保存设备信息
        return this.save(entity);
    }


    /**
     * 更新设备
     * @param id   设备ID
     * @param formData 设备表单对象
     * @return 是否修改成功
     */
    @Override
    public boolean updateTDevice(Long id, TDeviceForm formData) {
        // 参数校验
        if (id == null || formData == null) {
            log.error("更新设备参数错误: ID或表单数据为空");
            return false;
        }

        // 检查原记录是否存在
        TDevice originalDevice = this.getById(id);
        if (originalDevice == null) {
            log.error("要更新的设备不存在, ID: {}", id);
            return false;
        }

        TDevice entity = tDeviceConverter.toEntity(formData);
        entity.setId(id);

        // 如果entireNo没有变化，则无需校验唯一性
        if (!originalDevice.getEntireNo().equals(entity.getEntireNo())) {
            // 校验entireNo是否被其他记录使用
            QueryWrapper<TDevice> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("entireNo", entity.getEntireNo())
                    .ne("id", id);

            Long count = this.baseMapper.selectCount(queryWrapper);

            if (count > 0) {
                log.error("设备编号已存在: {}", entity.getEntireNo());
                return false;
            }
        }

        // 执行更新
        boolean result = this.updateById(entity);
        if (result) {
            log.info("设备更新成功, ID: {}, EntireNo: {}", id, entity.getEntireNo());
        } else {
            log.error("设备更新失败, ID: {}", id);
        }
        return result;
    }

    @Override
    public boolean updateCH(Long id, JSONObject jsonObject) {
        // 检查原记录是否存在
        TDevice originalDevice = this.getById(id);
        if (originalDevice == null) {
            log.error("要更新的设备不存在, ID: {}", id);
            return false;
        }
        try {
            // 使用循环动态生成键名，避免硬编码重复项
            List<String> chs = new ArrayList<>();
            for (int i = 1; i <= 18; i++) {
                String key = "ch" + i;
                // 统一从jsonObject获取值，仅ch18特殊处理
                String value = jsonObject.getString(key);
                chs.add(value);
            }

            for (int i = 0; i < chs.size(); i++) {
                byte[] fullPacket = ShieldProtocolUtil.buildCmdSetAtt(i + 1, Integer.parseInt(chs.get(i))); // 修正索引从1开始
                DeviceCommand command = new DeviceCommand(
                        ShieldProtocolConstants.CMD_ATT_GET,
                        fullPacket,
                        ShieldProtocolConstants.CMD_ATT_GET_ACK
                );
                String commandId = redisCommandQueue.sendCommand(originalDevice.getEntireNo(), command);
            }






        } catch(Exception e){
            log.error("设备CH设置失败", e); // 添加异常信息便于调试
            return false; // 设置失败时返回false
        }
        // 保存设备信息 - 使用反射批量设置ch1到ch18的值
        for (int i = 1; i <= 18; i++) {
            try {
                // 获取对应的setter方法
                String methodName = "setCh" + i;
                java.lang.reflect.Method setter = originalDevice.getClass().getMethod(methodName, String.class);
                // 调用setter方法设置值
                setter.invoke(originalDevice, jsonObject.getString("ch" + i));
            } catch (Exception e) {
                throw new RuntimeException("设置ch" + i + "时发生错误", e);
            }
        }

        return this.updateById(originalDevice);
    }

    /**
     * 删除设备
     *
     * @param ids 设备ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    @Override
    public boolean deleteTDevices(String ids) {
        Assert.isTrue(StrUtil.isNotBlank(ids), "删除的设备数据为空");
        // 逻辑删除
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(Long::parseLong)
                .toList();
        return this.removeByIds(idList);
    }

    @Override
    public boolean enableDevices(IdsForm formData) {
        //TODO 调用硬件开启接口
        List<TDevice> devices = new ArrayList<>();
        if(formData.getPrisonId()!=null){
            devices = this.baseMapper.getTDeviceByPrisonId(formData.getPrisonId());
        }
        if(formData.getBuildingId()!=null){
            devices = this.baseMapper.getTDeviceByBuildingId(formData.getBuildingId());
        }
        if(formData.getFloorId()!=null){
            devices = this.baseMapper.getTDeviceByFloorId(formData.getFloorId());
        }
        if(formData.getIds()!=null){
            devices = this.baseMapper.getTDeviceByDeviceIds(formData.getIds());
        }

        if(devices.size()>0){
            for (TDevice device: devices){
//                for (int i = 0; i < 18; i++) {
//                    byte[] cmd = ShieldProtocolUtil.buildCmdSetRfSwitch(i, 1);
//                    udpServer.sendCmd(device.getEntireNo(), cmd);
//                }
                device.setPowerOff(0);
            }
            return this.updateBatchById(devices);
        }
        return true;
    }

    @Override
    public boolean disableDevices(IdsForm formData) {
        //TODO 调用硬件关闭接口
        List<TDevice> devices = new ArrayList<>();
        if(formData.getPrisonId()!=null){
            devices = this.baseMapper.getTDeviceByPrisonId(formData.getPrisonId());
        }
        if(formData.getBuildingId()!=null){
            devices = this.baseMapper.getTDeviceByBuildingId(formData.getBuildingId());
        }
        if(formData.getFloorId()!=null){
            devices = this.baseMapper.getTDeviceByFloorId(formData.getFloorId());
        }
        if(formData.getIds()!=null){
            devices = this.baseMapper.getTDeviceByDeviceIds(formData.getIds());
        }

        if(devices.size()>0){
            for (TDevice device: devices){
//                for (int i = 0; i < 18; i++) {
//                    byte[] cmd = ShieldProtocolUtil.buildCmdSetRfSwitch(i, 0);
//                    udpServer.sendCmd(device.getEntireNo(), cmd);
//                }
//                device.setPowerOff(1);
            }
            return this.updateBatchById(devices);
        }
        return true;
    }

    @Override
    public List<TProvinceTreeVO> getTDeviceNation(TDeviceQuery queryParams) {
        // ===================== 第一步：批量查询所有层级数据 =====================
        // 1. 查询所有省份
        List<ProvinceVO> provinceList = provinceService.getProvinceList();
        if (CollectionUtils.isEmpty(provinceList)) {
            return Collections.emptyList();
        }
        // 省份ID -> 省份VO Map（用于快速关联）
        Map<Long, TProvinceTreeVO> provinceVOMap = provinceList.stream()
                .map(province -> {
                    TProvinceTreeVO vo = new TProvinceTreeVO();
                    vo.setProvinceId(province.getProvinceId());
                    vo.setProvinceName(province.getProvinceName());
                    vo.setPrisonList(new ArrayList<>()); // 初始化子列表
                    return vo;
                })
                .collect(Collectors.toMap(TProvinceTreeVO::getProvinceId, vo -> vo));

        // 2. 查询所有监狱（可根据省份ID筛选，减少数据量）
        Set<Long> provinceIds = provinceVOMap.keySet();
        List<TPrison> prisonList = prisonMapper.selectByProvinceIds(provinceIds, queryParams);
        // 监狱ID -> 监狱VO Map + 省份ID -> 监狱VO列表 Map
        Map<Long, TPrisonTreeVO> prisonVOMap = new HashMap<>();
        Map<Long, List<TPrisonTreeVO>> provincePrisonMap = new HashMap<>();
        if (!CollectionUtils.isEmpty(prisonList)) {
            for (TPrison prison : prisonList) {
                TPrisonTreeVO vo = new TPrisonTreeVO();
                vo.setPrisonId(prison.getId());
                vo.setPrisonName(prison.getName());
                vo.setLevel(prison.getLevel());
                vo.setBuildingList(new ArrayList<>());
                prisonVOMap.put(prison.getId(), vo);
                // 按省份ID分组存储监狱VO
                provincePrisonMap.computeIfAbsent(prison.getDeptId(), k -> new ArrayList<>()).add(vo);
            }
        }

        // 3. 查询所有楼栋（根据监狱ID筛选）
        Set<Long> prisonIds = prisonVOMap.keySet();
        List<TBuilding> buildingList = buildingMapper.selectByPrisonIds(prisonIds, queryParams);
        // 楼栋ID -> 楼栋VO Map + 监狱ID -> 楼栋VO列表 Map
        Map<Long, TBuildingTreeVO> buildingVOMap = new HashMap<>();
        Map<Long, List<TBuildingTreeVO>> prisonBuildingMap = new HashMap<>();
        if (!CollectionUtils.isEmpty(buildingList)) {
            for (TBuilding building : buildingList) {
                TBuildingTreeVO vo = new TBuildingTreeVO();
                vo.setBuildingId(building.getId());
                vo.setBuildingName(building.getName());
                vo.setFloorList(new ArrayList<>());
                buildingVOMap.put(building.getId(), vo);
                // 按监狱ID分组存储楼栋VO
                prisonBuildingMap.computeIfAbsent(building.getPrisonId(), k -> new ArrayList<>()).add(vo);
            }
        }

        // 4. 查询所有楼层（根据楼栋ID筛选）
        Set<Long> buildingIds = buildingVOMap.keySet();
        List<TFloor> floorList = floorMapper.selectByBuildingIds(buildingIds, queryParams);
        // 楼层ID -> 楼层VO Map + 楼栋ID -> 楼层VO列表 Map
        Map<Long, TFloorTreeVO> floorVOMap = new HashMap<>();
        Map<Long, List<TFloorTreeVO>> buildingFloorMap = new HashMap<>();
        if (!CollectionUtils.isEmpty(floorList)) {
            for (TFloor floor : floorList) {
                TFloorTreeVO vo = new TFloorTreeVO();
                vo.setFloorId(floor.getId());
                vo.setFloorName(floor.getFloorName());
                vo.setDeviceList(new ArrayList<>());
                floorVOMap.put(floor.getId(), vo);
                // 按楼栋ID分组存储楼层VO
                buildingFloorMap.computeIfAbsent(floor.getBuildingId(), k -> new ArrayList<>()).add(vo);
            }
        }

        // 5. 查询所有设备（根据楼层ID筛选）
        Set<Long> floorIds = floorVOMap.keySet();
        List<TDevice> deviceList = this.baseMapper.selectByFloorIds(floorIds, queryParams);
        // 楼层ID -> 设备VO列表 Map
        Map<Long, List<TDevice>> floorDeviceMap = new HashMap<>();
        if (!CollectionUtils.isEmpty(deviceList)) {
            floorDeviceMap = deviceList.stream()
                    .collect(Collectors.groupingBy(TDevice::getFloorId)); // 按楼层ID分组
        }

        // ===================== 第二步：从下往上组装树形结构 =====================
        // 1. 设备关联到楼层
        for (Map.Entry<Long, TFloorTreeVO> entry : floorVOMap.entrySet()) {
            Long floorId = entry.getKey();
            TFloorTreeVO floorVO = entry.getValue();
            floorVO.setDeviceList(floorDeviceMap.getOrDefault(floorId, new ArrayList<>()));
        }

        // 2. 楼层关联到楼栋
        for (Map.Entry<Long, TBuildingTreeVO> entry : buildingVOMap.entrySet()) {
            Long buildingId = entry.getKey();
            TBuildingTreeVO buildingVO = entry.getValue();
            buildingVO.setFloorList(buildingFloorMap.getOrDefault(buildingId, new ArrayList<>()));
        }

        // 3. 楼栋关联到监狱
        for (Map.Entry<Long, TPrisonTreeVO> entry : prisonVOMap.entrySet()) {
            Long prisonId = entry.getKey();
            TPrisonTreeVO prisonVO = entry.getValue();
            prisonVO.setBuildingList(prisonBuildingMap.getOrDefault(prisonId, new ArrayList<>()));
        }

        // 4. 监狱关联到省份
        for (Map.Entry<Long, TProvinceTreeVO> entry : provinceVOMap.entrySet()) {
            Long provinceId = entry.getKey();
            TProvinceTreeVO provinceVO = entry.getValue();
            provinceVO.setPrisonList(provincePrisonMap.getOrDefault(provinceId, new ArrayList<>()));
        }

        // ===================== 第三步：返回最终结果 =====================
        return new ArrayList<>(provinceVOMap.values());
    }
    @Override
    public List<TProvinceTreeVO> getTDeviceNationTree(TDeviceQuery queryParams) {
        // ===================== 第一步：批量查询所有层级数据 =====================
        // 1. 查询所有省份
        List<ProvinceVO> provinceList = provinceService.getProvinceList();
        if (CollectionUtils.isEmpty(provinceList)) {
            return Collections.emptyList();
        }
        // 省份ID -> 省份VO Map（用于快速关联）
        Map<Long, TProvinceTreeVO> provinceVOMap = provinceList.stream()
                .map(province -> {
                    TProvinceTreeVO vo = new TProvinceTreeVO();
                    vo.setProvinceId(province.getProvinceId());
                    vo.setProvinceName(province.getProvinceName());
                    vo.setPrisonList(new ArrayList<>()); // 初始化子列表
                    return vo;
                })
                .collect(Collectors.toMap(TProvinceTreeVO::getProvinceId, vo -> vo));

        // 2. 查询所有监狱（可根据省份ID筛选，减少数据量）
        Set<Long> provinceIds = provinceVOMap.keySet();
        List<TPrison> prisonList = prisonMapper.selectByProvinceIds(provinceIds, queryParams);
        // 监狱ID -> 监狱VO Map + 省份ID -> 监狱VO列表 Map
        Map<Long, TPrisonTreeVO> prisonVOMap = new HashMap<>();
        Map<Long, List<TPrisonTreeVO>> provincePrisonMap = new HashMap<>();
        if (!CollectionUtils.isEmpty(prisonList)) {
            for (TPrison prison : prisonList) {
                TPrisonTreeVO vo = new TPrisonTreeVO();
                vo.setPrisonId(prison.getId());
                vo.setPrisonName(prison.getName());
                vo.setLevel(prison.getLevel());
                vo.setBuildingList(new ArrayList<>());
                prisonVOMap.put(prison.getId(), vo);
                // 按省份ID分组存储监狱VO
                provincePrisonMap.computeIfAbsent(prison.getDeptId(), k -> new ArrayList<>()).add(vo);
            }
        }

        // 3. 查询所有楼栋（根据监狱ID筛选）
        Set<Long> prisonIds = prisonVOMap.keySet();
        List<TBuilding> buildingList = buildingMapper.selectByPrisonIds(prisonIds, queryParams);
        // 楼栋ID -> 楼栋VO Map + 监狱ID -> 楼栋VO列表 Map
        Map<Long, TBuildingTreeVO> buildingVOMap = new HashMap<>();
        Map<Long, List<TBuildingTreeVO>> prisonBuildingMap = new HashMap<>();
        if (!CollectionUtils.isEmpty(buildingList)) {
            for (TBuilding building : buildingList) {
                TBuildingTreeVO vo = new TBuildingTreeVO();
                vo.setBuildingId(building.getId());
                vo.setBuildingName(building.getName());
                vo.setFloorList(new ArrayList<>());
                buildingVOMap.put(building.getId(), vo);
                // 按监狱ID分组存储楼栋VO
                prisonBuildingMap.computeIfAbsent(building.getPrisonId(), k -> new ArrayList<>()).add(vo);
            }
        }

        // 4. 查询所有楼层（根据楼栋ID筛选）
        Set<Long> buildingIds = buildingVOMap.keySet();
        List<TFloor> floorList = floorMapper.selectByBuildingIds(buildingIds, queryParams);
        // 楼层ID -> 楼层VO Map + 楼栋ID -> 楼层VO列表 Map
        Map<Long, TFloorTreeVO> floorVOMap = new HashMap<>();
        Map<Long, List<TFloorTreeVO>> buildingFloorMap = new HashMap<>();
        if (!CollectionUtils.isEmpty(floorList)) {
            for (TFloor floor : floorList) {
                TFloorTreeVO vo = new TFloorTreeVO();
                vo.setFloorId(floor.getId());
                vo.setFloorName(floor.getFloorName());
                vo.setDeviceList(new ArrayList<>());
                floorVOMap.put(floor.getId(), vo);
                // 按楼栋ID分组存储楼层VO
                buildingFloorMap.computeIfAbsent(floor.getBuildingId(), k -> new ArrayList<>()).add(vo);
            }
        }

//        // 5. 查询所有设备（根据楼层ID筛选）
//        Set<Long> floorIds = floorVOMap.keySet();
//        List<TDevice> deviceList = this.baseMapper.selectByFloorIds(floorIds, queryParams);
//        // 楼层ID -> 设备VO列表 Map
//        Map<Long, List<TDevice>> floorDeviceMap = new HashMap<>();
//        if (!CollectionUtils.isEmpty(deviceList)) {
//            floorDeviceMap = deviceList.stream()
//                    .collect(Collectors.groupingBy(TDevice::getFloorId)); // 按楼层ID分组
//        }

        // ===================== 第二步：从下往上组装树形结构 =====================
        // 1. 设备关联到楼层
//        for (Map.Entry<Long, TFloorTreeVO> entry : floorVOMap.entrySet()) {
//            Long floorId = entry.getKey();
//            TFloorTreeVO floorVO = entry.getValue();
//            floorVO.setDeviceList(floorDeviceMap.getOrDefault(floorId, new ArrayList<>()));
//        }

        // 2. 楼层关联到楼栋
        for (Map.Entry<Long, TBuildingTreeVO> entry : buildingVOMap.entrySet()) {
            Long buildingId = entry.getKey();
            TBuildingTreeVO buildingVO = entry.getValue();
            buildingVO.setFloorList(buildingFloorMap.getOrDefault(buildingId, new ArrayList<>()));
        }

        // 3. 楼栋关联到监狱
        for (Map.Entry<Long, TPrisonTreeVO> entry : prisonVOMap.entrySet()) {
            Long prisonId = entry.getKey();
            TPrisonTreeVO prisonVO = entry.getValue();
            prisonVO.setBuildingList(prisonBuildingMap.getOrDefault(prisonId, new ArrayList<>()));
        }

        // 4. 监狱关联到省份
        for (Map.Entry<Long, TProvinceTreeVO> entry : provinceVOMap.entrySet()) {
            Long provinceId = entry.getKey();
            TProvinceTreeVO provinceVO = entry.getValue();
            provinceVO.setPrisonList(provincePrisonMap.getOrDefault(provinceId, new ArrayList<>()));
        }

        // ===================== 第三步：返回最终结果 =====================
        return new ArrayList<>(provinceVOMap.values());
    }

    @Override
    public TProvinceTreeVO getTDeviceProvince(Long provinceId,TDeviceQuery queryParams) {
        // ===================== 第一步：参数校验和初始化 =====================
        if (provinceId == null) {
            throw new IllegalArgumentException("省份ID不能为空");
        }

        TProvinceTreeVO result = new TProvinceTreeVO();

        // 查询指定省份信息
        ProvinceDetailVO provinceDetailVO = provinceService.getProvinceInfo(provinceId);
        if (provinceDetailVO == null) {
            return result; // 返回空的树形结构
        }

        // 设置省份基本信息
        result.setProvinceId(provinceDetailVO.getProvinceId());
        result.setProvinceName(provinceDetailVO.getProvinceName());
        result.setPrisonList(new ArrayList<>());

        // ===================== 第二步：批量查询层级数据 =====================

        // 1. 查询该省份下的监狱
        List<TPrison> prisonList = prisonMapper.selectByProvinceIds(Collections.singleton(provinceId), queryParams);
        if (CollectionUtils.isEmpty(prisonList)) {
            return result; // 没有监狱数据，直接返回
        }

        Map<Long, TPrisonTreeVO> prisonVOMap = new HashMap<>();
        Set<Long> prisonIds = new HashSet<>();

        // 转换监狱VO并收集监狱ID
        for (TPrison prison : prisonList) {
            TPrisonTreeVO prisonVO = new TPrisonTreeVO();
            prisonVO.setPrisonId(prison.getId());
            prisonVO.setPrisonName(prison.getName());
            prisonVO.setLevel(prison.getLevel());
            prisonVO.setBuildingList(new ArrayList<>());
            prisonVOMap.put(prison.getId(), prisonVO);
            prisonIds.add(prison.getId());
        }

        // 2. 查询监狱下的楼栋
        List<TBuilding> buildingList = buildingMapper.selectByPrisonIds(prisonIds, queryParams);
        Map<Long, TBuildingTreeVO> buildingVOMap = new HashMap<>();
        Set<Long> buildingIds = new HashSet<>();
        Map<Long, List<TBuildingTreeVO>> prisonBuildingMap = new HashMap<>();

        if (!CollectionUtils.isEmpty(buildingList)) {
            for (TBuilding building : buildingList) {
                TBuildingTreeVO buildingVO = new TBuildingTreeVO();
                buildingVO.setBuildingId(building.getId());
                buildingVO.setBuildingName(building.getName());
                buildingVO.setFloorList(new ArrayList<>());
                buildingVOMap.put(building.getId(), buildingVO);
                buildingIds.add(building.getId());

                // 按监狱ID分组
                prisonBuildingMap.computeIfAbsent(building.getPrisonId(), k -> new ArrayList<>()).add(buildingVO);
            }
        }

        // 3. 查询楼栋下的楼层
        List<TFloor> floorList = floorMapper.selectByBuildingIds(buildingIds, queryParams);
        Map<Long, TFloorTreeVO> floorVOMap = new HashMap<>();
        Set<Long> floorIds = new HashSet<>();
        Map<Long, List<TFloorTreeVO>> buildingFloorMap = new HashMap<>();

        if (!CollectionUtils.isEmpty(floorList)) {
            for (TFloor floor : floorList) {
                TFloorTreeVO floorVO = new TFloorTreeVO();
                floorVO.setFloorId(floor.getId());
                floorVO.setFloorName(floor.getFloorName());
                floorVO.setDeviceList(new ArrayList<>());
                floorVOMap.put(floor.getId(), floorVO);
                floorIds.add(floor.getId());

                // 按楼栋ID分组
                buildingFloorMap.computeIfAbsent(floor.getBuildingId(), k -> new ArrayList<>()).add(floorVO);
            }
        }

        // 4. 查询楼层下的设备
        List<TDevice> deviceList = this.baseMapper.selectByFloorIds(floorIds, queryParams);
        Map<Long, List<TDevice>> floorDeviceMap = new HashMap<>();

        if (!CollectionUtils.isEmpty(deviceList)) {
            floorDeviceMap = deviceList.stream()
                    .collect(Collectors.groupingBy(TDevice::getFloorId));
        }

        // ===================== 第三步：组装树形结构 =====================

        // 1. 设备关联到楼层
        for (Map.Entry<Long, TFloorTreeVO> entry : floorVOMap.entrySet()) {
            Long floorId = entry.getKey();
            TFloorTreeVO floorVO = entry.getValue();
            List<TDevice> devices = floorDeviceMap.get(floorId);
            if (devices != null) {
                floorVO.setDeviceList(devices);
            }
        }

        // 2. 楼层关联到楼栋
        for (Map.Entry<Long, List<TFloorTreeVO>> entry : buildingFloorMap.entrySet()) {
            Long buildingId = entry.getKey();
            TBuildingTreeVO buildingVO = buildingVOMap.get(buildingId);
            if (buildingVO != null) {
                buildingVO.setFloorList(entry.getValue());
            }
        }

        // 3. 楼栋关联到监狱
        for (Map.Entry<Long, List<TBuildingTreeVO>> entry : prisonBuildingMap.entrySet()) {
            Long prisonId = entry.getKey();
            TPrisonTreeVO prisonVO = prisonVOMap.get(prisonId);
            if (prisonVO != null) {
                prisonVO.setBuildingList(entry.getValue());
            }
        }

        // 4. 监狱关联到省份
        result.setPrisonList(new ArrayList<>(prisonVOMap.values()));

        // ===================== 第四步：返回最终结果 =====================
        return result;
    }

    @Override
    public TPrisonTreeVO getTDevicePrison(Long prisonId, TDeviceQuery queryParams) {
        // ===================== 第一步：参数校验和初始化 =====================
        if (prisonId == null) {
            throw new IllegalArgumentException("监狱ID不能为空");
        }

        TPrisonTreeVO result = new TPrisonTreeVO();

        // 查询指定监狱信息
        TPrison prisonInfo = prisonMapper.selectById(prisonId);
        if (prisonInfo == null) {
            return result; // 返回空的树形结构
        }

        // 设置监狱基本信息
        result.setPrisonId(prisonInfo.getId());
        result.setPrisonName(prisonInfo.getName());
        result.setLevel(prisonInfo.getLevel());
        result.setBuildingList(new ArrayList<>());

        // ===================== 第二步：批量查询层级数据 =====================

        // 1. 查询该监狱下的楼栋
        List<TBuilding> buildingList = buildingMapper.selectByPrisonIds(Collections.singleton(prisonId), queryParams);
        if (CollectionUtils.isEmpty(buildingList)) {
            return result; // 没有楼栋数据，直接返回
        }

        Map<Long, TBuildingTreeVO> buildingVOMap = new HashMap<>();
        Set<Long> buildingIds = new HashSet<>();

        // 转换楼栋VO并收集楼栋ID
        for (TBuilding building : buildingList) {
            TBuildingTreeVO buildingVO = new TBuildingTreeVO();
            buildingVO.setBuildingId(building.getId());
            buildingVO.setBuildingName(building.getName());
            buildingVO.setFloorList(new ArrayList<>());
            buildingVOMap.put(building.getId(), buildingVO);
            buildingIds.add(building.getId());
        }

        // 2. 查询楼栋下的楼层
        List<TFloor> floorList = floorMapper.selectByBuildingIds(buildingIds, queryParams);
        Map<Long, TFloorTreeVO> floorVOMap = new HashMap<>();
        Set<Long> floorIds = new HashSet<>();
        Map<Long, List<TFloorTreeVO>> buildingFloorMap = new HashMap<>();

        if (!CollectionUtils.isEmpty(floorList)) {
            for (TFloor floor : floorList) {
                TFloorTreeVO floorVO = new TFloorTreeVO();
                floorVO.setFloorId(floor.getId());
                floorVO.setFloorName(floor.getFloorName());
                floorVO.setDeviceList(new ArrayList<>());
                floorVOMap.put(floor.getId(), floorVO);
                floorIds.add(floor.getId());

                // 按楼栋ID分组
                buildingFloorMap.computeIfAbsent(floor.getBuildingId(), k -> new ArrayList<>()).add(floorVO);
            }
        }

        // 3. 查询楼层下的设备
        List<TDevice> deviceList = this.baseMapper.selectByFloorIds(floorIds, queryParams);
        Map<Long, List<TDevice>> floorDeviceMap = new HashMap<>();

        if (!CollectionUtils.isEmpty(deviceList)) {
            floorDeviceMap = deviceList.stream()
                    .collect(Collectors.groupingBy(TDevice::getFloorId));
        }

        // ===================== 第三步：组装树形结构 =====================

        // 1. 设备关联到楼层
        for (Map.Entry<Long, TFloorTreeVO> entry : floorVOMap.entrySet()) {
            Long floorId = entry.getKey();
            TFloorTreeVO floorVO = entry.getValue();
            List<TDevice> devices = floorDeviceMap.get(floorId);
            if (devices != null) {
                floorVO.setDeviceList(devices);
            }
        }

        // 2. 楼层关联到楼栋
        for (Map.Entry<Long, List<TFloorTreeVO>> entry : buildingFloorMap.entrySet()) {
            Long buildingId = entry.getKey();
            TBuildingTreeVO buildingVO = buildingVOMap.get(buildingId);
            if (buildingVO != null) {
                buildingVO.setFloorList(entry.getValue());
            }
        }

        // 3. 楼栋关联到监狱
        result.setBuildingList(new ArrayList<>(buildingVOMap.values()));

        // ===================== 第四步：返回最终结果 =====================
        return result;
    }

    @Override
    public TBuildingTreeVO getTDeviceBuilding(Long buildingId, TDeviceQuery queryParams) {
        // ===================== 第一步：参数校验和初始化 =====================
        if (buildingId == null) {
            throw new IllegalArgumentException("楼栋ID不能为空");
        }

        // 直接返回楼栋VO（根节点就是当前楼栋）
        TBuildingTreeVO result = new TBuildingTreeVO();

        // 查询指定楼栋
        TBuilding buildingInfo = buildingMapper.selectById(buildingId);
        if (buildingInfo == null) {
            return result;
        }

        // 给根节点 result 直接赋值（关键修复）
        result.setBuildingId(buildingInfo.getId());
        result.setBuildingName(buildingInfo.getName());

        // 初始化楼层列表
        result.setFloorList(new ArrayList<>());

        // ===================== 第二步：查询当前楼栋下的所有楼层 =====================
        List<TFloor> floorList = floorMapper.selectByBuildingIds(Collections.singleton(buildingId), queryParams);
        if (CollectionUtils.isEmpty(floorList)) {
            return result;
        }

        Map<Long, TFloorTreeVO> floorVOMap = new HashMap<>();
        Set<Long> floorIds = new HashSet<>();

        for (TFloor floor : floorList) {
            TFloorTreeVO floorVO = new TFloorTreeVO();
            floorVO.setFloorId(floor.getId());
            floorVO.setFloorName(floor.getFloorName());
            floorVO.setDeviceList(new ArrayList<>());
            floorVOMap.put(floor.getId(), floorVO);
            floorIds.add(floor.getId());
        }

        // ===================== 第三步：查询楼层下的设备 =====================
        List<TDevice> deviceList = this.baseMapper.selectByFloorIds(floorIds, queryParams);
        if (!CollectionUtils.isEmpty(deviceList)) {
            // 按楼层分组设备
            Map<Long, List<TDevice>> floorDeviceMap = deviceList.stream()
                    .collect(Collectors.groupingBy(TDevice::getFloorId));

            // 设备绑定到对应楼层
            for (Map.Entry<Long, List<TDevice>> entry : floorDeviceMap.entrySet()) {
                TFloorTreeVO floorVO = floorVOMap.get(entry.getKey());
                if (floorVO != null) {
                    floorVO.setDeviceList(entry.getValue());
                }
            }
        }

        // ===================== 第四步：楼层绑定到当前楼栋（根节点） =====================
        result.setFloorList(new ArrayList<>(floorVOMap.values()));

        // ===================== 第五步：返回最终结果 =====================
        return result;
    }

    @Override
    public List<TDevice> getTDeviceFloor(Long floorId, TDeviceQuery queryParams) {
        Set<Long> floorIds = new HashSet<>();
        floorIds.add(floorId);
        List<TDevice> deviceList = this.baseMapper.selectByFloorIds(floorIds, queryParams);
        return deviceList;
    }

    @Override
    @Transactional
    public boolean updateTDeviceXY(Long id, String positionX, String positionY) {
        try {
            this.baseMapper.updateTDeviceXY(id,positionX, positionY);
        }catch (Exception e){
            return false;
        }
        return true;
    }


    /**
     * 根据设备编号查询设备记录（返回Optional，更安全的用法）
     * @param entireNo 设备编号
     * @return Optional包装的设备实体对象
     */
    @Override
    public Optional<TDevice> getTDeviceByEntireNoOptional(String entireNo) {
        if (StringUtils.isBlank(entireNo)) {
            return Optional.empty();
        }

        QueryWrapper<TDevice> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("entire_no", entireNo);
        queryWrapper.eq("is_deleted", 0);

        TDevice device = this.baseMapper.selectOne(queryWrapper);
        return Optional.ofNullable(device);
    }


}
