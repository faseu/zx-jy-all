package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TOperLog;
import com.youlai.boot.system.model.query.OperLogPageQuery;
import com.youlai.boot.system.model.vo.OperLogPageVO;
import org.apache.ibatis.annotations.Mapper;


/**
 * 系统日志数据访问层
 *
 * @author Ray
 * @since 2.10.0
 */
@Mapper
public interface TOperLogMapper extends BaseMapper<TOperLog> {

    /**
     * 获取日志分页列表
     */
    Page<OperLogPageVO> getLogPage(Page<OperLogPageVO> page, OperLogPageQuery queryParams);

}



