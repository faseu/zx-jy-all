package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.youlai.boot.system.model.dto.AlarmExportDTO;
import com.youlai.boot.system.model.entity.TAlarm;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.query.TAlarmQuery;
import com.youlai.boot.system.model.vo.TAlarmVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 告警Mapper接口
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
@Mapper
public interface TAlarmMapper extends BaseMapper<TAlarm> {

    /**
     * 获取告警分页数据
     *
     * @param page 分页对象
     * @param queryParams 查询参数
     * @return {@link Page<TAlarmVO>} 告警分页列表
     */
    Page<TAlarmVO> getTAlarmPage(Page<TAlarmVO> page, TAlarmQuery queryParams);


    List<AlarmExportDTO> listExportAlarms(@Param("queryParams") TAlarmQuery queryParams);
}
