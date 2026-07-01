package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.youlai.boot.system.model.entity.TDevice;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TFloor;
import com.youlai.boot.system.model.query.TDeviceQuery;
import com.youlai.boot.system.model.vo.TDeviceVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

/**
 * 设备Mapper接口
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Mapper
public interface TDeviceMapper extends BaseMapper<TDevice> {

    /**
     * 获取设备分页数据
     *
     * @param page 分页对象
     * @param queryParams 查询参数
     * @return {@link Page<TDeviceVO>} 设备分页列表
     */
    Page<TDeviceVO> getTDevicePage(Page<TDeviceVO> page, TDeviceQuery queryParams);


    List<TDevice> selectByFloorIds(@Param("floorIds")Set<Long> floorIds, @Param("queryParams")TDeviceQuery queryParams);

    void updateTDeviceXY(@Param("id")Long id, @Param("positionX")String positionX, @Param("positionY")String positionY);


    List<TDevice> getTDeviceByPrisonId(@Param("prisonId") Long prisonId);
    List<TDevice> getTDeviceByBuildingId(@Param("buildingId") Long buildingId);
    List<TDevice> getTDeviceByFloorId(@Param("floorId") Long floorId);
    List<TDevice> getTDeviceByDeviceIds(@Param("ids") List<Long> ids);

}
