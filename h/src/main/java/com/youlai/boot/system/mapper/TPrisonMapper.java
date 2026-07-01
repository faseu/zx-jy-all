package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.youlai.boot.system.model.entity.TPrison;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.query.TDeviceQuery;
import com.youlai.boot.system.model.query.TPrisonQuery;
import com.youlai.boot.system.model.vo.TBuildingDetailVO;
import com.youlai.boot.system.model.vo.TPrisonInfoVO;
import com.youlai.boot.system.model.vo.TPrisonVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

/**
 * 监狱Mapper接口
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Mapper
public interface TPrisonMapper extends BaseMapper<TPrison> {

    /**
     * 获取监狱分页数据
     *
     * @param page 分页对象
     * @param queryParams 查询参数
     * @return {@link Page<TPrisonVO>} 监狱分页列表
     */
    Page<TPrisonVO> getTPrisonPage(Page<TPrisonVO> page, TPrisonQuery queryParams);

    TPrisonInfoVO getTPrisonInfo(Long prisonId);

    List<TBuildingDetailVO> getBuildingList(Long prisonId);

    List<TPrison> selectByProvinceIds(@Param("provinceIds")Set<Long> provinceIds, @Param("queryParams")TDeviceQuery queryParams);

}
