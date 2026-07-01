package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.youlai.boot.system.model.entity.TBuilding;
import com.youlai.boot.system.model.entity.TFloor;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.query.TDeviceQuery;
import com.youlai.boot.system.model.query.TFloorQuery;
import com.youlai.boot.system.model.vo.TFloorVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

/**
 * 楼层Mapper接口
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Mapper
public interface TFloorMapper extends BaseMapper<TFloor> {

    /**
     * 获取楼层分页数据
     *
     * @param page 分页对象
     * @param queryParams 查询参数
     * @return {@link Page<TFloorVO>} 楼层分页列表
     */
    Page<TFloorVO> getTFloorPage(Page<TFloorVO> page, TFloorQuery queryParams);

    List<TFloor> selectByBuildingIds(@Param("buildingIds")Set<Long> buildingIds, @Param("queryParams")TDeviceQuery queryParams);

    void updateTFloorDraw(@Param("floorId")Long floorId, @Param("filePath")String filePath);
}
