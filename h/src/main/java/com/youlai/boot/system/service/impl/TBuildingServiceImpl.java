package com.youlai.boot.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.youlai.boot.system.model.entity.TFloor;
import com.youlai.boot.system.model.form.TFloorForm;
import com.youlai.boot.system.model.vo.TBuildingDetailVO;
import com.youlai.boot.system.model.vo.TBuildingInfoVO;
import com.youlai.boot.system.model.vo.TFloorDetailVO;
import com.youlai.boot.system.service.TFloorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.system.mapper.TBuildingMapper;
import com.youlai.boot.system.service.TBuildingService;
import com.youlai.boot.system.model.entity.TBuilding;
import com.youlai.boot.system.model.form.TBuildingForm;
import com.youlai.boot.system.model.query.TBuildingQuery;
import com.youlai.boot.system.model.vo.TBuildingVO;
import com.youlai.boot.system.converter.TBuildingConverter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;

/**
 * 楼栋服务实现类
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Service
@RequiredArgsConstructor
public class TBuildingServiceImpl extends ServiceImpl<TBuildingMapper, TBuilding> implements TBuildingService {

    private final TBuildingConverter tBuildingConverter;
    private final TFloorService tFloorService;

    /**
    * 获取楼栋分页列表
    *
    * @param queryParams 查询参数
    * @return {@link IPage<TBuildingVO>} 楼栋分页列表
    */
    @Override
    public IPage<TBuildingVO> getTBuildingPage(TBuildingQuery queryParams) {
        Page<TBuildingVO> pageVO = this.baseMapper.getTBuildingPage(
                new Page<>(queryParams.getPageNum(), queryParams.getPageSize()),
                queryParams
        );
        return pageVO;
    }
    
    /**
     * 获取楼栋表单数据
     *
     * @param id 楼栋ID
     * @return 楼栋表单数据
     */
    @Override
    public TBuildingForm getTBuildingFormData(Long id) {
        TBuilding entity = this.getById(id);
        return tBuildingConverter.toForm(entity);
    }
    
    /**
     * 新增楼栋
     *
     * @param formData 楼栋表单对象
     * @return 是否新增成功
     */
    @Override
    public boolean saveTBuilding(TBuildingForm formData) {
        TBuilding entity = tBuildingConverter.toEntity(formData);
        int groundFloorNum = normalizeFloorCount(entity.getGroundFloorNum());
        int undergroundFloorNum = normalizeFloorCount(entity.getUndergroundFloorNum());
        entity.setFloorNum(groundFloorNum + undergroundFloorNum);
        boolean result = this.save(entity);
        if(result){
            List<TFloor> tFloors = buildFloorList(entity.getId(), entity.getName(), groundFloorNum, undergroundFloorNum);
            if (!tFloors.isEmpty()) {
                tFloorService.saveBatch(tFloors);
            }
        }
        return result;
    }
    
    /**
     * 更新楼栋
     *
     * @param id   楼栋ID
     * @param formData 楼栋表单对象
     * @return 是否修改成功
     */
    @Override
    public boolean updateTBuilding(Long id,TBuildingForm formData) {
        TBuilding entity = tBuildingConverter.toEntity(formData);
        entity.setId(id);
        int groundFloorNum = normalizeFloorCount(entity.getGroundFloorNum());
        int undergroundFloorNum = normalizeFloorCount(entity.getUndergroundFloorNum());
        entity.setFloorNum(groundFloorNum + undergroundFloorNum);
        boolean result = this.updateById(entity);
        if (result) {
            syncFloors(entity.getId(), entity.getName(), groundFloorNum, undergroundFloorNum);
        }
        return result;
    }

    private int normalizeFloorCount(Integer floorCount) {
        return floorCount == null ? 0 : Math.max(floorCount, 0);
    }

    private String formatFloorName(int floorNo) {
        return floorNo < 0 ? "B" + Math.abs(floorNo) : "F" + floorNo;
    }

    private List<TFloor> buildFloorList(Long buildingId, String buildingName, int groundFloorNum, int undergroundFloorNum) {
        List<TFloor> floors = new ArrayList<>();
        for (int i = 1; i <= groundFloorNum; i++) {
            floors.add(buildFloor(buildingId, buildingName, i));
        }
        for (int i = 1; i <= undergroundFloorNum; i++) {
            floors.add(buildFloor(buildingId, buildingName, -i));
        }
        return floors;
    }

    private TFloor buildFloor(Long buildingId, String buildingName, int floorNo) {
        TFloor floor = new TFloor();
        floor.setFloorName(formatFloorName(floorNo));
        floor.setFloorNo(floorNo);
        floor.setBuildingId(buildingId);
        floor.setBuildingName(buildingName);
        return floor;
    }

    private void syncFloors(Long buildingId, String buildingName, int groundFloorNum, int undergroundFloorNum) {
        List<TFloor> targetFloors = buildFloorList(buildingId, buildingName, groundFloorNum, undergroundFloorNum);
        List<Integer> targetFloorNos = targetFloors.stream().map(TFloor::getFloorNo).toList();
        List<TFloor> existingFloors = tFloorService.list(
                new LambdaQueryWrapper<TFloor>()
                        .eq(TFloor::getBuildingId, buildingId)
                        .eq(TFloor::getIsDeleted, 0)
        );
        Map<Integer, TFloor> existingByFloorNo = existingFloors.stream()
                .collect(Collectors.toMap(TFloor::getFloorNo, floor -> floor, (left, right) -> left));

        List<TFloor> floorsToCreate = new ArrayList<>();
        List<TFloor> floorsToUpdate = new ArrayList<>();
        for (TFloor targetFloor : targetFloors) {
            TFloor existingFloor = existingByFloorNo.get(targetFloor.getFloorNo());
            if (existingFloor == null) {
                floorsToCreate.add(targetFloor);
                continue;
            }
            existingFloor.setFloorName(targetFloor.getFloorName());
            existingFloor.setBuildingName(buildingName);
            floorsToUpdate.add(existingFloor);
        }

        List<Long> floorIdsToRemove = existingFloors.stream()
                .filter(floor -> !targetFloorNos.contains(floor.getFloorNo()))
                .map(TFloor::getId)
                .toList();

        if (!floorsToCreate.isEmpty()) {
            tFloorService.saveBatch(floorsToCreate);
        }
        if (!floorsToUpdate.isEmpty()) {
            tFloorService.updateBatchById(floorsToUpdate);
        }
        if (!floorIdsToRemove.isEmpty()) {
            tFloorService.removeByIds(floorIdsToRemove);
        }
    }
    
    /**
     * 删除楼栋
     *
     * @param ids 楼栋ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    @Override
    public boolean deleteTBuildings(String ids) {
        Assert.isTrue(StrUtil.isNotBlank(ids), "删除的楼栋数据为空");
        // 逻辑删除
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(Long::parseLong)
                .toList();
        return this.removeByIds(idList);
    }

    @Override
    public TBuildingInfoVO getTBuildingInfo(Long id) {
        return this.baseMapper.getTBuildingInfo(id);
    }

    @Override
    public List<TFloorDetailVO> getFloorList(Long id) {
        return this.baseMapper.getFloorList(id);
    }

}
