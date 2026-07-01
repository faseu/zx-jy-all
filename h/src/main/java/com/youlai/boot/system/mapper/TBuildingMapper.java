package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.youlai.boot.system.model.entity.TBuilding;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TPrison;
import com.youlai.boot.system.model.query.TBuildingQuery;
import com.youlai.boot.system.model.query.TDeviceQuery;
import com.youlai.boot.system.model.vo.TBuildingDetailVO;
import com.youlai.boot.system.model.vo.TBuildingInfoVO;
import com.youlai.boot.system.model.vo.TBuildingVO;
import com.youlai.boot.system.model.vo.TFloorDetailVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

/**
 * 楼栋Mapper接口
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Mapper
public interface TBuildingMapper extends BaseMapper<TBuilding> {

    /**
     * 获取楼栋分页数据
     *
     * @param page 分页对象
     * @param queryParams 查询参数
     * @return {@link Page<TBuildingVO>} 楼栋分页列表
     */
    Page<TBuildingVO> getTBuildingPage(Page<TBuildingVO> page, TBuildingQuery queryParams);

    TBuildingInfoVO getTBuildingInfo(Long id);

    List<TFloorDetailVO> getFloorList(Long id);

    List<TBuilding> selectByPrisonIds(@Param("prisonIds")Set<Long> prisonIds, @Param("queryParams")TDeviceQuery queryParams);
}
